import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isSupabaseConfigured } from '@/utils/db';
import { getSupabaseAdmin } from '@/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'gallery';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean file name
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${baseName}_${Date.now()}${ext}`;

    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error.message);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Simpan ke database jika bucket gallery
      if (bucket === "gallery") {
        const { error: dbError } = await supabaseAdmin
          .from("gallery")
          .insert({
            image_url: publicUrl,
            sort_order: 0,
          });

        if (dbError) {
          console.error("Insert gallery error:", dbError.message);
          throw dbError;
        }
      }

      // Update wedding_info jika bucket music
      if (bucket === "music") {
        const { error: dbError } = await supabaseAdmin
          .from("wedding_info")
          .update({
            music_url: publicUrl,
          });

        if (dbError) {
          console.error("Update music error:", dbError.message);
          throw dbError;
        }
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
      });
    } else {
      // Local fallback upload
      const uploadDir = path.join(process.cwd(), 'public/uploads', bucket);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const publicPath = `/uploads/${bucket}/${fileName}`;
      return NextResponse.json({ url: publicPath });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
