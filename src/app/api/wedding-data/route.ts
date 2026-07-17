import { NextResponse } from 'next/server';
import { 
  getWeddingInfo, 
  updateWeddingInfo, 
  getParents, 
  updateParents, 
  getGallery, 
  updateGallery,
  getGiftAccounts, 
  updateGiftAccounts, 
  getGuests, 
  updateGuests,
  getEvents,
  updateEvents,
  getLoveStories,
  updateLoveStories,
  getThemeSettings,
  updateThemeSettings,
  getWhatsAppTemplates,
  updateWhatsAppTemplates,
  syncLocalDbToMarkdown, 
  isSupabaseConfigured 
} from '@/utils/db';

export async function GET() {
  try {
    const info = await getWeddingInfo();
    const parents = await getParents();
    const gallery = await getGallery();
    const giftAccounts = await getGiftAccounts();
    const guests = await getGuests();
    const events = await getEvents();
    const loveStories = await getLoveStories();
    const themeSettings = await getThemeSettings();
    const whatsappTemplates = await getWhatsAppTemplates();

    return NextResponse.json({
      info,
      event: info,
      parents,
      gallery,
      giftAccounts,
      guests,
      events,
      loveStories,
      themeSettings,
      whatsappTemplates
    });
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown> | null;
    const message = errObj?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error';
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
    if (body.gallery) {
      await updateGallery(body.gallery);
    }
    if (body.guests) {
      await updateGuests(body.guests);
    }
    if (body.events) {
      await updateEvents(body.events);
    }
    if (body.loveStories) {
      await updateLoveStories(body.loveStories);
    }
    if (body.themeSettings) {
      await updateThemeSettings(body.themeSettings);
    }
    if (body.whatsappTemplates) {
      await updateWhatsAppTemplates(body.whatsappTemplates);
    }
    
    // Sync to local markdown file if not using Supabase so local wedding-data.md stays updated
    if (!isSupabaseConfigured()) {
      syncLocalDbToMarkdown();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown> | null;
    const message = errObj?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

