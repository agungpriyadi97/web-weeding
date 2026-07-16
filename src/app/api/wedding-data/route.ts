import { NextResponse } from 'next/server';
import { getWeddingInfo, updateWeddingInfo, getParents, updateParents, getGallery, getGiftAccounts, updateGiftAccounts, getGuests, syncLocalDbToMarkdown, isSupabaseConfigured } from '@/utils/db';

export async function GET() {
  try {
    const info = await getWeddingInfo();
    const parents = await getParents();
    const gallery = await getGallery();
    const giftAccounts = await getGiftAccounts();
    const guests = await getGuests();

    return NextResponse.json({
      info,
      parents,
      gallery,
      giftAccounts,
      guests
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.info) {
      await updateWeddingInfo(body.info);
    }
    if (body.parents) {
      await updateParents(body.parents);
    }
    if (body.giftAccounts) {
      await updateGiftAccounts(body.giftAccounts);
    }
    
    // Sync to local markdown file if not using Supabase so local wedding-data.md stays updated
    if (!isSupabaseConfigured()) {
      syncLocalDbToMarkdown();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
