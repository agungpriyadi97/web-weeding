import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'gallery';
    const field = formData.get('field') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean file name
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const baseName = file.name.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${baseName}_${Date.now()}${ext}`;

    const supabaseAdmin = getSupabaseAdmin();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Flow: Client -> /api/upload -> Supabase Storage -> Public URL -> Update Database -> Refresh State
    if (bucket === "gallery") {
      // Find max sort order in gallery
      const { data: galleryItems } = await supabaseAdmin.from('gallery').select('sort_order');
      const maxOrder = galleryItems ? galleryItems.reduce((max, item) => Math.max(max, item.sort_order), 0) : 0;
      
      const { error: dbError } = await supabaseAdmin
        .from("gallery")
        .insert({
          image_url: publicUrl,
          sort_order: maxOrder + 1,
        });

      if (dbError) throw dbError;
    } else if (bucket === "music" || field === "music_url") {
      const { data: existing } = await supabaseAdmin.from('wedding_info').select('id').limit(1).maybeSingle();
      if (existing) {
        const { error: dbError } = await supabaseAdmin
          .from("wedding_info")
          .update({ music_url: publicUrl })
          .eq('id', existing.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabaseAdmin
          .from("wedding_info")
          .insert([{ music_url: publicUrl }]);
        if (dbError) throw dbError;
      }
    } else if (field) {
      if (['groom_image', 'bride_image', 'hero_image', 'background_image', 'favicon', 'og_image'].includes(field)) {
        const { data: existing } = await supabaseAdmin.from('wedding_info').select('id').limit(1).maybeSingle();
        if (existing) {
          const { error: dbError } = await supabaseAdmin
            .from("wedding_info")
            .update({ [field]: publicUrl })
            .eq('id', existing.id);
          if (dbError) throw dbError;
        } else {
          const { error: dbError } = await supabaseAdmin
            .from("wedding_info")
            .insert([{ [field]: publicUrl }]);
          if (dbError) throw dbError;
        }
      } else if (field.startsWith('parents:')) {
        const parts = field.split(':'); // parents:groom:father_photo
        if (parts.length === 3) {
          const type = parts[1]; // groom or bride
          const parentField = parts[2]; // father_photo or mother_photo
          const { error: dbError } = await supabaseAdmin
            .from("parents")
            .update({ [parentField]: publicUrl })
            .eq('type', type);
          if (dbError) throw dbError;
        }
      } else if (field.startsWith('gift_accounts:')) {
        const parts = field.split(':'); // gift_accounts:index:qris_image
        if (parts.length === 3) {
          const index = Number(parts[1]);
          // Find the gift account by sort_order
          const { data: existingGifts } = await supabaseAdmin.from('gift_accounts').select('*').order('sort_order', { ascending: true });
          if (existingGifts && existingGifts[index]) {
            const { error: dbError } = await supabaseAdmin
              .from("gift_accounts")
              .update({ qris_image: publicUrl })
              .eq('id', existingGifts[index].id);
            if (dbError) throw dbError;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
