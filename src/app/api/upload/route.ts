import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabaseClient';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10).toUpperCase();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'gallery';
    const field = formData.get('field') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Server-side validation
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.name.endsWith('.mp3');

    if (!isImage && !isAudio) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}. Allowed types: JPEG, PNG, WEBP, GIF, MP3.` }, { status: 400 });
    }

    const maxLimit = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxLimit) {
      return NextResponse.json({ error: `File size too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed is ${isAudio ? '20' : '10'} MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Filename strategy: folder/year/month/day/uuid.ext
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : isAudio ? '.mp3' : '.png';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();
    
    // The path inside the bucket (e.g. 2026/07/17/uuid.png)
    const filePath = `${year}/${month}/${day}/${uuid}${ext}`;

    // Structured logging before upload
    console.log(`[UPLOAD START] RequestID: ${requestId} | Bucket: ${bucket} | Path: ${filePath} | Mime: ${file.type} | Size: ${file.size} bytes`);

    const supabaseAdmin = getSupabaseAdmin();

    // Verify bucket exists, if not, create it
    const { data: buckets, error: listBucketsError } = await supabaseAdmin.storage.listBuckets();
    if (listBucketsError) {
      console.error(`[UPLOAD ERROR] Failed to list buckets: ${listBucketsError.message}`);
      return NextResponse.json({ error: `Supabase authentication or access failed: ${listBucketsError.message}` }, { status: 500 });
    }

    const bucketExists = buckets.some(b => b.name === bucket);
    if (!bucketExists) {
      console.log(`[UPLOAD INFO] Bucket '${bucket}' not found. Attempting to create...`);
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
      if (createBucketError) {
        console.error(`[UPLOAD ERROR] Failed to create bucket '${bucket}': ${createBucketError.message}`);
        return NextResponse.json({ error: `Bucket not found and auto-creation failed: ${createBucketError.message}` }, { status: 500 });
      }
    }

    // Upload with automatic single retry
    let uploadErrorObj = null;

    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });
      
      if (error) throw error;
    } catch (firstErr) {
      console.warn(`[UPLOAD WARNING] First upload attempt failed for RequestID: ${requestId}. Retrying once... Error:`, firstErr);
      // Wait 300ms before retry
      await new Promise(resolve => setTimeout(resolve, 300));
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });
      
      if (error) {
        uploadErrorObj = error;
      }
    }

    if (uploadErrorObj) {
      console.error(`[UPLOAD FAIL] Storage upload failed after retry for RequestID: ${requestId} | Error:`, uploadErrorObj);
      return NextResponse.json({ error: `Upload permission denied or storage error: ${uploadErrorObj.message}` }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrl) {
      console.error(`[UPLOAD FAIL] Public URL generation failed for RequestID: ${requestId}`);
      return NextResponse.json({ error: 'Public URL generation failed.' }, { status: 500 });
    }

    const uploadDuration = Date.now() - startTime;
    console.log(`[UPLOAD SUCCESS] RequestID: ${requestId} | Duration: ${uploadDuration}ms | Public URL: ${publicUrl}`);

    // Update database based on bucket/field
    if (bucket === "gallery") {
      const { data: galleryItems, error: fetchErr } = await supabaseAdmin.from('gallery').select('sort_order');
      if (fetchErr) throw fetchErr;

      const maxOrder = galleryItems ? galleryItems.reduce((max, item) => Math.max(max, item.sort_order), 0) : 0;
      const { data: insertData, error: dbError } = await supabaseAdmin
        .from("gallery")
        .insert({
          image_url: publicUrl,
          sort_order: maxOrder + 1,
        })
        .select();

      if (dbError) throw dbError;
      console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: gallery | Status: Success | Response:`, insertData);
    } else if (bucket === "music" || field === "music_url") {
      const { data: existing, error: fetchErr } = await supabaseAdmin.from('wedding_info').select('id').limit(1).maybeSingle();
      if (fetchErr) throw fetchErr;

      if (existing) {
        const { data: updateData, error: dbError } = await supabaseAdmin
          .from("wedding_info")
          .update({ music_url: publicUrl })
          .eq('id', existing.id)
          .select();
        if (dbError) throw dbError;
        console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: wedding_info | Status: Success | Response:`, updateData);
      } else {
        const { data: insertData, error: dbError } = await supabaseAdmin
          .from("wedding_info")
          .insert([{ music_url: publicUrl }])
          .select();
        if (dbError) throw dbError;
        console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: wedding_info | Status: Success | Response:`, insertData);
      }
    } else if (field) {
      if (['groom_image', 'bride_image', 'hero_image', 'background_image', 'favicon', 'og_image'].includes(field)) {
        const { data: existing, error: fetchErr } = await supabaseAdmin.from('wedding_info').select('id').limit(1).maybeSingle();
        if (fetchErr) throw fetchErr;

        if (existing) {
          const { data: updateData, error: dbError } = await supabaseAdmin
            .from("wedding_info")
            .update({ [field]: publicUrl })
            .eq('id', existing.id)
            .select();
          if (dbError) throw dbError;
          console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: wedding_info | Status: Success | Response:`, updateData);
        } else {
          const { data: insertData, error: dbError } = await supabaseAdmin
            .from("wedding_info")
            .insert([{ [field]: publicUrl }])
            .select();
          if (dbError) throw dbError;
          console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: wedding_info | Status: Success | Response:`, insertData);
        }
      } else if (field.startsWith('parents:')) {
        const parts = field.split(':'); // parents:groom:father_photo
        if (parts.length === 3) {
          const type = parts[1]; // groom or bride
          const parentField = parts[2]; // father_photo or mother_photo
          const { data: updateData, error: dbError } = await supabaseAdmin
            .from("parents")
            .update({ [parentField]: publicUrl })
            .eq('type', type)
            .select();
          if (dbError) throw dbError;
          console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: parents | Status: Success | Response:`, updateData);
        }
      } else if (field.startsWith('gift_accounts:')) {
        const parts = field.split(':'); // gift_accounts:index:qris_image
        if (parts.length === 3) {
          const index = Number(parts[1]);
          const { data: existingGifts, error: fetchErr } = await supabaseAdmin.from('gift_accounts').select('*').order('sort_order', { ascending: true });
          if (fetchErr) throw fetchErr;

          if (existingGifts && existingGifts[index]) {
            const { data: updateData, error: dbError } = await supabaseAdmin
              .from("gift_accounts")
              .update({ qris_image: publicUrl })
              .eq('id', existingGifts[index].id)
              .select();
            if (dbError) throw dbError;
            console.log(`[DATABASE UPDATE] RequestID: ${requestId} | Table: gift_accounts | Status: Success | Response:`, updateData);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[UPLOAD FAIL] RequestID: ${requestId} | Duration: ${duration}ms | Error: ${message}`);
    return NextResponse.json({ error: `Upload process failed: ${message}` }, { status: 500 });
  }
}
