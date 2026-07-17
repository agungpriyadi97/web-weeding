import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from './supabaseClient';
import { EventDetail, ParentDetail, GalleryItem, GiftAccount, RSVP, Guestbook, Guest, AnalyticsLog, LoveStory, WeddingEvent, WhatsAppTemplate, ThemeSettings } from '../types/wedding';


// Helper to get administrative client to bypass RLS policies
const getDb = () => getSupabaseAdmin();

// Always return true since Supabase is the mandatory single source of truth
export function isSupabaseConfigured(): boolean {
  return true;
}

// Helper to extract bucket storage path from Supabase public URL
function getStoragePathFromUrl(url: string, bucket: string): string | null {
  if (!url) return null;
  const parts = url.split(`/storage/v1/object/public/${bucket}/`);
  if (parts.length > 1) {
    return decodeURIComponent(parts[1]);
  }
  const lastIndex = url.lastIndexOf('/');
  if (lastIndex !== -1) {
    return decodeURIComponent(url.substring(lastIndex + 1));
  }
  return null;
}

// Dummy sync method to maintain backward compatibility in route definitions
export function syncLocalDbToMarkdown() {
  // No-op: Supabase native database synchronisation is handled automatically.
}

// -------------------------------------------------------------
// WEDDING INFO
// -------------------------------------------------------------
export async function getWeddingInfo(): Promise<EventDetail> {
  const db = getDb();
  const { data, error } = await db.from('wedding_info').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Supabase getWeddingInfo error:', error.message);
    throw error;
  }
  if (!data) {
    // If table is completely empty, insert a default row to prevent errors
    const defaultInfo = {
      groom_name: 'Hery Kurniawan',
      groom_nickname: 'Hery',
      bride_name: 'Irish Bella',
      bride_nickname: 'Bella',
      event_date: '2026-12-25',
      event_time: '09:00 WIB - Selesai',
      location: 'Kediaman Mempelai Pria',
      address: 'Sasana Kriya, TMII, Jakarta',
      google_maps: 'https://maps.google.com',
      theme: 'elegant-gold',
      primary_color: '#C5A059',
      secondary_color: '#FDFBF7',
      enable_music: true,
      enable_countdown: true,
      enable_guestbook: true,
      enable_rsvp: true,
      enable_gift: true,
      maintenance_mode: false,
      visitor_count: 0
    };
    const { data: inserted, error: insertError } = await db.from('wedding_info').insert([defaultInfo]).select().single();
    if (insertError) {
      console.error('Supabase default wedding_info insert error:', insertError.message);
      throw insertError;
    }
    return inserted;
  }
  return data;
}

export async function updateWeddingInfo(info: Partial<EventDetail>): Promise<EventDetail> {
  const db = getDb();
  const { data: existing } = await db.from('wedding_info').select('*').limit(1).maybeSingle();
  
  if (existing) {
    // Handle image file cleanup in Storage if replaced/removed
    const supabaseAdmin = getDb();
    const imageFields: (keyof EventDetail)[] = ['music_url', 'hero_image', 'background_image', 'groom_image', 'bride_image', 'favicon', 'og_image'];
    for (const field of imageFields) {
      if (info[field] !== undefined && existing[field] && existing[field] !== info[field]) {
        const bucket = field === 'music_url' ? 'music' : (field === 'hero_image' || field === 'og_image' ? 'cover' : 'wedding-info');
        const storagePath = getStoragePathFromUrl(existing[field], bucket);
        if (storagePath) {
          await supabaseAdmin.storage.from(bucket).remove([storagePath]);
        }
      }
    }

    const { data, error } = await db.from('wedding_info').update(info).eq('id', existing.id).select().single();
    if (error) {
      console.error('Supabase updateWeddingInfo error:', error.message);
      throw error;
    }
    return data;
  } else {
    const { data, error } = await db.from('wedding_info').insert([info]).select().single();
    if (error) {
      console.error('Supabase insertWeddingInfo error:', error.message);
      throw error;
    }
    return data;
  }
}

// -------------------------------------------------------------
// PARENTS
// -------------------------------------------------------------
export async function getParents(): Promise<ParentDetail[]> {
  const db = getDb();
  const { data, error } = await db.from('parents').select('*');
  if (error) {
    console.error('Supabase getParents error:', error.message);
    throw error;
  }
  if (!data || data.length === 0) {
    const initialParents = [
      { type: 'groom', father_name: 'Rahmat', mother_name: 'Juminah', father_photo: '', mother_photo: '' },
      { type: 'bride', father_name: 'Edi', mother_name: 'Asril', father_photo: '', mother_photo: '' }
    ];
    const { data: inserted, error: insertError } = await db.from('parents').insert(initialParents).select();
    if (insertError) {
      console.error('Supabase auto-initialize parents error:', insertError.message);
      throw insertError;
    }
    return inserted || [];
  }
  return data;
}

export async function updateParents(parents: ParentDetail[]): Promise<ParentDetail[]> {
  const db = getDb();
  const existing = await getParents();
  const supabaseAdmin = getDb();

  for (const parent of parents) {
    const exist = existing.find(p => p.id === parent.id || p.type === parent.type);
    if (exist) {
      if (parent.father_photo !== undefined && exist.father_photo && exist.father_photo !== parent.father_photo) {
        const storagePath = getStoragePathFromUrl(exist.father_photo, 'parents');
        if (storagePath) {
          await supabaseAdmin.storage.from('parents').remove([storagePath]);
        }
      }
      if (parent.mother_photo !== undefined && exist.mother_photo && exist.mother_photo !== parent.mother_photo) {
        const storagePath = getStoragePathFromUrl(exist.mother_photo, 'parents');
        if (storagePath) {
          await supabaseAdmin.storage.from('parents').remove([storagePath]);
        }
      }
    }
  }

  const { data, error } = await db.from('parents').upsert(parents).select();
  if (error) {
    console.error('Supabase updateParents error:', error.message);
    throw error;
  }
  return data || [];
}

// -------------------------------------------------------------
// GALLERY
// -------------------------------------------------------------
export async function getGallery(): Promise<GalleryItem[]> {
  const db = getDb();
  const { data, error } = await db.from('gallery').select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Supabase getGallery error:', error.message);
    throw error;
  }
  return data || [];
}

export async function updateGallery(gallery: GalleryItem[]): Promise<GalleryItem[]> {
  const db = getDb();
  const existing = await getGallery();
  const supabaseAdmin = getDb();

  // Find removed images and delete them from Supabase Storage
  const newUrls = new Set(gallery.map(item => item.image_url));
  const removed = existing.filter(item => !newUrls.has(item.image_url));
  for (const item of removed) {
    const storagePath = getStoragePathFromUrl(item.image_url, 'gallery');
    if (storagePath) {
      await supabaseAdmin.storage.from('gallery').remove([storagePath]);
    }
  }

  // Clear existing items and insert new ones to avoid primary key collisions
  const { error: deleteError } = await db.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Supabase updateGallery delete error:', deleteError.message);
    throw deleteError;
  }

  const { data, error } = await db.from('gallery').insert(gallery.map(item => ({
    image_url: item.image_url,
    sort_order: item.sort_order
  }))).select();

  if (error) {
    console.error('Supabase updateGallery insert error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addGalleryItem(url: string): Promise<GalleryItem> {
  const db = getDb();
  const gallery = await getGallery();
  const maxOrder = gallery.reduce((max, item) => Math.max(max, item.sort_order), 0);
  const newItem = { image_url: url, sort_order: maxOrder + 1 };

  const { data, error } = await db.from('gallery').insert([newItem]).select().single();
  if (error) {
    console.error('Supabase addGalleryItem error:', error.message);
    throw error;
  }
  return data;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  const db = getDb();
  const { data: item, error: fetchError } = await db.from('gallery').select('*').eq('id', id).maybeSingle();
  if (!fetchError && item) {
    const supabaseAdmin = getDb();
    const storagePath = getStoragePathFromUrl(item.image_url, 'gallery');
    if (storagePath) {
      await supabaseAdmin.storage.from('gallery').remove([storagePath]);
    }
  }

  const { error } = await db.from('gallery').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteGalleryItem error:', error.message);
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// GIFT ACCOUNTS
// -------------------------------------------------------------
export async function getGiftAccounts(): Promise<GiftAccount[]> {
  const db = getDb();
  const { data, error } = await db.from('gift_accounts').select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Supabase getGiftAccounts error:', error.message);
    throw error;
  }
  return data || [];
}

export async function updateGiftAccounts(accounts: GiftAccount[]): Promise<GiftAccount[]> {
  const db = getDb();
  const existing = await getGiftAccounts();
  const supabaseAdmin = getDb();

  // Find removed QRIS and clean up
  for (const acc of accounts) {
    const exist = existing.find(e => e.id === acc.id);
    if (exist && acc.qris_image !== undefined && exist.qris_image && exist.qris_image !== acc.qris_image) {
      const storagePath = getStoragePathFromUrl(exist.qris_image, 'qris');
      if (storagePath) {
        await supabaseAdmin.storage.from('qris').remove([storagePath]);
      }
    }
  }

  const activeIds = new Set(accounts.map(a => a.id).filter(Boolean));
  const removed = existing.filter(e => !activeIds.has(e.id));
  for (const acc of removed) {
    if (acc.qris_image) {
      const storagePath = getStoragePathFromUrl(acc.qris_image, 'qris');
      if (storagePath) {
        await supabaseAdmin.storage.from('qris').remove([storagePath]);
      }
    }
    await db.from('gift_accounts').delete().eq('id', acc.id);
  }

  const { data, error } = await db.from('gift_accounts').upsert(accounts.map(acc => ({
    id: acc.id || randomUUID(),
    bank_name: acc.bank_name,
    account_number: acc.account_number,
    account_holder: acc.account_holder,
    qris_image: acc.qris_image,
    sort_order: acc.sort_order
  }))).select();

  if (error) {
    console.error('Supabase updateGiftAccounts error:', error.message);
    throw error;
  }
  return data || [];
}

// -------------------------------------------------------------
// RSVP
// -------------------------------------------------------------
export async function getRSVPs(): Promise<RSVP[]> {
  const db = getDb();
  const { data, error } = await db.from('rsvp').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase getRSVPs error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addRSVP(rsvp: RSVP): Promise<RSVP> {
  const db = getDb();
  const payload = {
    guest_name: rsvp.guest_name,
    attendance: rsvp.attendance,
    guest_count: rsvp.guest_count,
    message: rsvp.message,
  };

  const { data, error } = await db.from('rsvp').insert([payload]).select().single();
  if (error) {
    console.error('Supabase addRSVP error:', error.message);
    throw error;
  }
  return data;
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('rsvp').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteRSVP error:', error.message);
    return false;
  }
  return true;
}

export async function deleteRSVPs(ids: string[]): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('rsvp').delete().in('id', ids);
  if (error) {
    console.error('Supabase deleteRSVPs error:', error.message);
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// GUESTBOOK
// -------------------------------------------------------------
export async function getGuestbook(showUnapproved = true): Promise<Guestbook[]> {
  const db = getDb();
  let query = db.from('guestbook').select('*');
  if (!showUnapproved) {
    query = query.eq('is_approved', true);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase getGuestbook error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addGuestbookEntry(entry: Guestbook): Promise<Guestbook> {
  const db = getDb();
  const payload = {
    guest_name: entry.guest_name,
    message: entry.message,
    is_approved: entry.is_approved !== undefined ? entry.is_approved : true
  };

  const { data, error } = await db.from('guestbook').insert([payload]).select().single();
  if (error) {
    console.error('Supabase addGuestbookEntry error:', error.message);
    throw error;
  }
  return data;
}

export async function toggleGuestbookApproval(id: string, isApproved: boolean): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('guestbook').update({ is_approved: isApproved }).eq('id', id);
  if (error) {
    console.error('Supabase toggleGuestbookApproval error:', error.message);
    return false;
  }
  return true;
}

export async function deleteGuestbookEntry(id: string): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('guestbook').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteGuestbookEntry error:', error.message);
    return false;
  }
  return true;
}

export async function deleteGuestbookEntries(ids: string[]): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('guestbook').delete().in('id', ids);
  if (error) {
    console.error('Supabase deleteGuestbookEntries error:', error.message);
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// GUESTS REGISTRY (for invitation slugs)
// -------------------------------------------------------------
export async function getGuests(): Promise<Guest[]> {
  const db = getDb();
  const { data, error } = await db.from('guests').select('*');
  if (error) {
    console.error('Supabase getGuests error:', error.message);
    throw error;
  }
  return data || [];
}

export async function updateGuests(guests: Guest[]): Promise<Guest[]> {
  const db = getDb();
  const existing = await getGuests();
  const activeIds = new Set(guests.map(g => g.id).filter(Boolean));
  const removed = existing.filter(e => !activeIds.has(e.id));
  
  for (const guest of removed) {
    await db.from('guests').delete().eq('id', guest.id);
  }

  const { data, error } = await db.from('guests').upsert(guests.map(g => ({
    id: g.id || randomUUID(),
    guest_name: g.guest_name,
    slug: g.slug
  }))).select();

  if (error) {
    console.error('Supabase updateGuests error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addGuest(name: string, slug: string): Promise<Guest> {
  const db = getDb();
  const payload = { guest_name: name, slug };
  const { data, error } = await db.from('guests').insert([payload]).select().single();
  if (error) {
    console.error('Supabase addGuest error:', error.message);
    throw error;
  }
  return data;
}

export async function deleteGuest(id: string): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('guests').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteGuest error:', error.message);
    return false;
  }
  return true;
}

export async function deleteGuests(ids: string[]): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from('guests').delete().in('id', ids);
  if (error) {
    console.error('Supabase deleteGuests error:', error.message);
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// ANALYTICS LOGS
// -------------------------------------------------------------
export async function getAnalyticsLogs(): Promise<AnalyticsLog[]> {
  const db = getDb();
  const { data, error } = await db.from('analytics_logs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase getAnalyticsLogs error:', error.message);
    throw error;
  }
  return data || [];
}

export async function addAnalyticsLog(log: Omit<AnalyticsLog, 'id' | 'created_at'>): Promise<AnalyticsLog> {
  const db = getDb();
  // Update visitor count first in wedding_info
  const { data: info } = await db.from('wedding_info').select('id, visitor_count').limit(1).maybeSingle();
  if (info) {
    await db.from('wedding_info').update({ visitor_count: (info.visitor_count || 0) + 1 }).eq('id', info.id);
  }

  const { data, error } = await db.from('analytics_logs').insert([log]).select().single();
  if (error) {
    console.error('Supabase addAnalyticsLog error:', error.message);
    throw error;
  }
  return data;
}

// -------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------
export async function getEvents(): Promise<WeddingEvent[]> {
  const db = getDb();
  const { data, error } = await db.from('events').select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Supabase getEvents error:', error.message);
    return [];
  }
  if (!data || data.length === 0) {
    const defaultEvents = [
      {
        name: 'Akad Nikah',
        event_date: '2026-12-25',
        event_time: '08:00 - 10:00 WIB',
        location: 'Sasana Kriya, TMII',
        address: 'Taman Mini Indonesia Indah, Jakarta',
        google_maps_url: 'https://maps.google.com',
        sort_order: 0
      },
      {
        name: 'Resepsi Pernikahan',
        event_date: '2026-12-25',
        event_time: '11:00 - 13:00 WIB',
        location: 'Sasana Kriya, TMII',
        address: 'Taman Mini Indonesia Indah, Jakarta',
        google_maps_url: 'https://maps.google.com',
        sort_order: 1
      }
    ];
    const { data: inserted, error: insertError } = await db.from('events').insert(defaultEvents).select();
    if (insertError) {
      console.error('Supabase default events insert error:', insertError.message);
      return [];
    }
    return inserted || [];
  }
  return data;
}

export async function updateEvents(events: WeddingEvent[]): Promise<WeddingEvent[]> {
  const db = getDb();
  const existing = await getEvents();
  
  const activeIds = new Set(events.map(e => e.id).filter(Boolean));
  const removed = existing.filter(e => !activeIds.has(e.id));
  
  for (const ev of removed) {
    await db.from('events').delete().eq('id', ev.id);
  }

  const { data, error } = await db.from('events').upsert(events.map(ev => ({
    id: ev.id || randomUUID(),
    name: ev.name,
    event_date: ev.event_date,
    event_time: ev.event_time,
    location: ev.location,
    address: ev.address,
    google_maps_url: ev.google_maps_url,
    sort_order: ev.sort_order
  }))).select();

  if (error) {
    console.error('Supabase updateEvents error:', error.message);
    throw error;
  }
  return data || [];
}

// -------------------------------------------------------------
// LOVE STORY
// -------------------------------------------------------------
export async function getLoveStories(): Promise<LoveStory[]> {
  const db = getDb();
  const { data, error } = await db.from('love_story').select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Supabase getLoveStories error:', error.message);
    return [];
  }
  if (!data || data.length === 0) {
    const defaultStories = [
      {
        title: 'Pertama Bertemu',
        story_date: '15 Januari 2024',
        description: 'Pertemuan pertama kami yang tidak disengaja di sebuah kedai kopi hangat di sudut kota. Percakapan singkat hari itu menuntun kami pada obrolan-obrolan panjang berikutnya.',
        image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60',
        sort_order: 0
      },
      {
        title: 'Ikatan Janji (Lamaran)',
        story_date: '20 Juni 2025',
        description: 'Setelah melewati berbagai cerita suka dan duka bersama, kami memutuskan untuk melangkah ke komitmen yang lebih serius. Lamaran resmi dihadiri oleh keluarga besar kami tercinta.',
        image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=60',
        sort_order: 1
      },
      {
        title: 'Hari Bahagia (Pernikahan)',
        story_date: '25 Desember 2026',
        description: 'Hari bersejarah di mana kami berdua mengucapkan janji suci pernikahan untuk memulai babak baru kehidupan bersama sebagai pasangan suami istri.',
        image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60',
        sort_order: 2
      }
    ];
    const { data: inserted, error: insertError } = await db.from('love_story').insert(defaultStories).select();
    if (insertError) {
      console.error('Supabase default love stories insert error:', insertError.message);
      return [];
    }
    return inserted || [];
  }
  return data;
}

export async function updateLoveStories(stories: LoveStory[]): Promise<LoveStory[]> {
  const db = getDb();
  const existing = await getLoveStories();
  const supabaseAdmin = getDb();

  // Find removed stories and delete image if exists
  const activeIds = new Set(stories.map(s => s.id).filter(Boolean));
  const removed = existing.filter(e => !activeIds.has(e.id));
  
  for (const story of removed) {
    if (story.image_url) {
      const storagePath = getStoragePathFromUrl(story.image_url, 'wedding-info');
      if (storagePath) {
        await supabaseAdmin.storage.from('wedding-info').remove([storagePath]);
      }
    }
    await db.from('love_story').delete().eq('id', story.id);
  }

  // Handle updated story image cleanups if replaced
  for (const story of stories) {
    const exist = existing.find(e => e.id === story.id);
    if (exist && story.image_url !== undefined && exist.image_url && exist.image_url !== story.image_url) {
      const storagePath = getStoragePathFromUrl(exist.image_url, 'wedding-info');
      if (storagePath) {
        await supabaseAdmin.storage.from('wedding-info').remove([storagePath]);
      }
    }
  }

  const { data, error } = await db.from('love_story').upsert(stories.map(s => ({
    id: s.id || randomUUID(),
    title: s.title,
    story_date: s.story_date,
    description: s.description,
    image_url: s.image_url,
    sort_order: s.sort_order
  }))).select();

  if (error) {
    console.error('Supabase updateLoveStories error:', error.message);
    throw error;
  }
  return data || [];
}

// -------------------------------------------------------------
// WHATSAPP TEMPLATES
// -------------------------------------------------------------
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const db = getDb();
  const { data, error } = await db.from('whatsapp_templates').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase getWhatsAppTemplates error:', error.message);
    return [];
  }
  return data || [];
}

export async function updateWhatsAppTemplates(templates: WhatsAppTemplate[]): Promise<WhatsAppTemplate[]> {
  const db = getDb();
  const existing = await getWhatsAppTemplates();
  
  const activeIds = new Set(templates.map(t => t.id).filter(Boolean));
  const removed = existing.filter(e => !activeIds.has(e.id));
  
  for (const tpl of removed) {
    await db.from('whatsapp_templates').delete().eq('id', tpl.id);
  }

  const { data, error } = await db.from('whatsapp_templates').upsert(templates.map(t => ({
    id: t.id || randomUUID(),
    name: t.name,
    template_text: t.template_text,
    is_default: t.is_default
  }))).select();

  if (error) {
    console.error('Supabase updateWhatsAppTemplates error:', error.message);
    throw error;
  }
  return data || [];
}

// -------------------------------------------------------------
// THEME SETTINGS
// -------------------------------------------------------------
export async function getThemeSettings(): Promise<ThemeSettings> {
  const db = getDb();
  try {
    const { data, error } = await db.from('theme_settings').select('*').limit(1).maybeSingle();
    if (error) {
      console.warn('Supabase getThemeSettings error (falling back to default):', error.message);
      return {
        gallery_layout: 'grid',
        effect: 'none'
      };
    }
    if (!data) {
      const defaultSettings = {
        gallery_layout: 'grid',
        effect: 'none'
      };
      const { data: inserted, error: insertError } = await db.from('theme_settings').insert([defaultSettings]).select().single();
      if (insertError) {
        console.warn('Supabase default theme_settings insert error (falling back to default):', insertError.message);
        return defaultSettings;
      }
      return inserted;
    }
    return data;
  } catch (err) {
    console.warn('Theme settings catch error (falling back to default settings):', err);
    return {
      gallery_layout: 'grid',
      effect: 'none'
    };
  }
}

export async function updateThemeSettings(settings: Partial<ThemeSettings>): Promise<ThemeSettings> {
  const db = getDb();
  const existing = await getThemeSettings();
  
  const { data, error } = await db.from('theme_settings').update(settings).eq('id', existing.id).select().single();
  if (error) {
    console.error('Supabase updateThemeSettings error:', error.message);
    throw error;
  }
  return data;
}

