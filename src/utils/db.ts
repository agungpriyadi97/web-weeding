import fs from 'fs';
import path from 'path';
import { supabase, getSupabaseAdmin } from './supabaseClient';
import { parseMarkdown, stringifyToMarkdown } from './parser';
import { EventDetail, ParentDetail, GalleryItem, GiftAccount, RSVP, Guestbook, Guest, WeddingData, AnalyticsLog } from '../types/wedding';

const LOCAL_DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const MD_FILE_PATH = path.join(process.cwd(), 'wedding-data.md');

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && supabase !== null;
}

function getMarkdownData(): WeddingData {
  if (fs.existsSync(MD_FILE_PATH)) {
    const content = fs.readFileSync(MD_FILE_PATH, 'utf8');
    return parseMarkdown(content);
  }
  return {
    groom: { namaLengkap: 'Groom', namaPanggilan: 'Groom' },
    bride: { namaLengkap: 'Bride', namaPanggilan: 'Bride' },
    event: {
      groom_name: '', groom_nickname: '', bride_name: '', bride_nickname: '', event_date: '', event_time: '', location: '', address: '', google_maps: '',
      theme: 'elegant-gold', primary_color: '#C5A059', secondary_color: '#FDFBF7', opening_animation: true,
      enable_music: true, enable_countdown: true, enable_guestbook: true, enable_rsvp: true, enable_gift: true, maintenance_mode: false, visitor_count: 0,
      website_title: 'Invitation', meta_description: 'Digital Invitation'
    },
    parents: [],
    gallery: [],
    giftAccounts: [],
    guests: [],
    closingMessage: '',
  };
}

function initLocalDb() {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const mdData = getMarkdownData();
    const initialDb = {
      wedding_info: {
        groom_name: mdData.groom.namaLengkap,
        groom_nickname: mdData.groom.namaPanggilan,
        bride_name: mdData.bride.namaLengkap,
        bride_nickname: mdData.bride.namaPanggilan,
        event_date: mdData.event.event_date || '2026-12-12',
        event_time: mdData.event.event_time || '09:00 WIB - Selesai',
        location: mdData.event.location || 'Gedung Pernikahan',
        address: mdData.event.address || 'Alamat Lengkap',
        google_maps: mdData.event.google_maps || 'https://maps.google.com',
        story_meet: mdData.event.story_meet || '',
        story_proposal: mdData.event.story_proposal || '',
        story_marriage: mdData.event.story_marriage || '',
        closing_message: mdData.closingMessage || '',

        // Extended options
        theme: 'elegant-gold',
        primary_color: '#C5A059',
        secondary_color: '#FDFBF7',
        hero_image: '/images/cover.png',
        background_image: '',
        groom_image: '',
        bride_image: '',
        opening_animation: true,

        enable_music: true,
        enable_countdown: true,
        enable_guestbook: true,
        enable_rsvp: true,
        enable_gift: true,
        maintenance_mode: false,

        music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',

        website_title: `The Wedding of ${mdData.groom.namaPanggilan} & ${mdData.bride.namaPanggilan}`,
        meta_description: `Undangan Pernikahan Digital ${mdData.groom.namaLengkap} & ${mdData.bride.namaLengkap}`,
        favicon: '',
        og_image: '/images/cover.png',
        seo_keywords: 'wedding, invitation, digital',
        canonical_url: '',
        visitor_count: 0
      },
      parents: mdData.parents.map((p, idx) => ({
        id: String(idx + 1),
        ...p,
        father_photo: '',
        mother_photo: ''
      })),
      gallery: mdData.gallery.map(item => ({
        ...item,
        image_url: item.image_url.includes('Foto 1') ? '/images/gallery1.png' :
          item.image_url.includes('Foto 2') ? '/images/gallery2.png' :
            item.image_url.includes('Foto 3') ? '/images/gallery3.png' :
              item.image_url.includes('Foto 4') ? '/images/gallery4.png' : item.image_url
      })),
      gift_accounts: mdData.giftAccounts.map((g, idx) => ({
        id: String(idx + 1),
        ...g,
        qris_image: '/images/qris.png',
        sort_order: idx
      })),
      rsvp: [] as RSVP[],
      guestbook: [] as Guestbook[],
      guests: mdData.guests.map((g, idx) => ({ id: String(idx + 1), ...g })),
      analytics_logs: [] as AnalyticsLog[]
    };

    if (!initialDb.parents.length) {
      initialDb.parents = [
        { id: '1', type: 'groom', father_name: 'Ayah Pria', mother_name: 'Ibu Pria', father_photo: '', mother_photo: '' },
        { id: '2', type: 'bride', father_name: 'Ayah Wanita', mother_name: 'Ibu Wanita', father_photo: '', mother_photo: '' }
      ];
    }

    if (!initialDb.gallery.length) {
      initialDb.gallery = [
        { id: '1', image_url: '/images/gallery1.png', sort_order: 1 },
        { id: '2', image_url: '/images/gallery2.png', sort_order: 2 },
        { id: '3', image_url: '/images/gallery3.png', sort_order: 3 },
        { id: '4', image_url: '/images/gallery4.png', sort_order: 4 }
      ];
    }

    if (!initialDb.gift_accounts.length) {
      initialDb.gift_accounts = [
        { id: '1', bank_name: 'BCA', account_number: '123456789', account_holder: mdData.groom.namaLengkap, qris_image: '/images/qris.png', sort_order: 0 }
      ];
    }

    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
  }
}

function readLocalDb() {
  initLocalDb();
  const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeLocalDb(data: Record<string, unknown>) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// -------------------------------------------------------------
// WEDDING INFO
// -------------------------------------------------------------
export async function getWeddingInfo(): Promise<EventDetail> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('wedding_info').select('*').limit(1).maybeSingle();
    if (!error && data) return data;
    console.error('Supabase getWeddingInfo error:', error?.message);
  }
  const db = readLocalDb();
  return db.wedding_info;
}

export async function updateWeddingInfo(info: Partial<EventDetail>): Promise<EventDetail> {
  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase.from('wedding_info').select('id').limit(1).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from('wedding_info').update(info).eq('id', existing.id).select().single();
      if (!error && data) return data;
      console.error('Supabase updateWeddingInfo error:', error?.message);
    } else {
      const { data, error } = await supabase.from('wedding_info').insert([info]).select().single();
      if (!error && data) return data;
      console.error('Supabase insertWeddingInfo error:', error?.message);
    }
  }
  const db = readLocalDb();
  db.wedding_info = { ...db.wedding_info, ...info };
  writeLocalDb(db);
  return db.wedding_info;
}

// -------------------------------------------------------------
// PARENTS
// -------------------------------------------------------------
export async function getParents(): Promise<ParentDetail[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('parents').select('*');
    if (!error && data) return data;
    console.error('Supabase getParents error:', error?.message);
  }
  const db = readLocalDb();
  return db.parents;
}

export async function updateParents(parents: ParentDetail[]): Promise<ParentDetail[]> {
  if (isSupabaseConfigured()) {
    await supabase.from('parents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { data, error } = await supabase.from('parents').insert(parents).select();
    if (!error && data) return data;
    console.error('Supabase updateParents error:', error?.message);
  }
  const db = readLocalDb();
  db.parents = parents.map((p, idx) => ({ id: p.id || String(idx + 1), ...p }));
  writeLocalDb(db);
  return db.parents;
}

// -------------------------------------------------------------
// GALLERY
// -------------------------------------------------------------
export async function getGallery(): Promise<GalleryItem[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('gallery').select('*').order('sort_order', { ascending: true });
    if (!error && data) return data;
    console.error('Supabase getGallery error:', error?.message);
  }
  const db = readLocalDb();
  return db.gallery.sort((a: GalleryItem, b: GalleryItem) => a.sort_order - b.sort_order);
}

export async function updateGallery(gallery: GalleryItem[]): Promise<GalleryItem[]> {
  if (isSupabaseConfigured()) {
    await supabase.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { data, error } = await supabase.from('gallery').insert(gallery).select();
    if (!error && data) return data;
    console.error('Supabase updateGallery error:', error?.message);
  }
  const db = readLocalDb();
  db.gallery = gallery.map((item, idx) => ({ id: item.id || String(idx + 1), ...item }));
  writeLocalDb(db);
  return db.gallery;
}

export async function addGalleryItem(url: string): Promise<GalleryItem> {
  const gallery = await getGallery();
  const maxOrder = gallery.reduce((max, item) => Math.max(max, item.sort_order), 0);
  const newItem = { image_url: url, sort_order: maxOrder + 1 };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('gallery').insert([newItem]).select().single();
    if (!error && data) return data;
    console.error('Supabase addGalleryItem error:', error?.message);
  }

  const db = readLocalDb();
  const localItem = { id: String(Date.now()), ...newItem };
  db.gallery.push(localItem);
  writeLocalDb(db);
  return localItem;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (!error) return true;
    console.error('Supabase deleteGalleryItem error:', error.message);
  }
  const db = readLocalDb();
  const initialLength = db.gallery.length;
  db.gallery = db.gallery.filter((item: GalleryItem) => item.id !== id);
  writeLocalDb(db);
  return db.gallery.length < initialLength;
}

// -------------------------------------------------------------
// GIFT ACCOUNTS
// -------------------------------------------------------------
export async function getGiftAccounts(): Promise<GiftAccount[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('gift_accounts').select('*').order('sort_order', { ascending: true });
    if (!error && data) return data;
    console.error('Supabase getGiftAccounts error:', error?.message);
  }
  const db = readLocalDb();
  return db.gift_accounts.sort((a: GiftAccount, b: GiftAccount) => a.sort_order - b.sort_order);
}

export async function updateGiftAccounts(accounts: GiftAccount[]): Promise<GiftAccount[]> {
  if (isSupabaseConfigured()) {
    await supabase.from('gift_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { data, error } = await supabase.from('gift_accounts').insert(accounts).select();
    if (!error && data) return data;
    console.error('Supabase updateGiftAccounts error:', error?.message);
  }
  const db = readLocalDb();
  db.gift_accounts = accounts.map((a, idx) => ({ id: a.id || String(idx + 1), ...a }));
  writeLocalDb(db);
  return db.gift_accounts;
}

// -------------------------------------------------------------
// RSVP
// -------------------------------------------------------------
export async function getRSVPs(): Promise<RSVP[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('rsvp').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase getRSVPs error:', error?.message);
  }
  const db = readLocalDb();
  return db.rsvp || [];
}

export async function addRSVP(rsvp: RSVP): Promise<RSVP> {
  const payload = {
    guest_name: rsvp.guest_name,
    attendance: rsvp.attendance,
    guest_count: rsvp.guest_count,
    message: rsvp.message,
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('rsvp').insert([payload]).select().single();
    if (!error && data) return data;
    console.error('Supabase addRSVP error:', error?.message);
  }

  const db = readLocalDb();
  const localRSVP = { id: String(Date.now()), created_at: new Date().toISOString(), ...payload };
  db.rsvp.unshift(localRSVP);
  writeLocalDb(db);
  return localRSVP;
}

export async function deleteRSVP(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('rsvp').delete().eq('id', id);
    if (!error) return true;
  }
  const db = readLocalDb();
  const initialLength = db.rsvp.length;
  db.rsvp = db.rsvp.filter((r: RSVP) => r.id !== id);
  writeLocalDb(db);
  return db.rsvp.length < initialLength;
}

export async function deleteRSVPs(ids: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('rsvp').delete().in('id', ids);
    if (!error) return true;
  }
  const db = readLocalDb();
  db.rsvp = db.rsvp.filter((r: RSVP) => !ids.includes(r.id || ''));
  writeLocalDb(db);
  return true;
}

// -------------------------------------------------------------
// GUESTBOOK
// -------------------------------------------------------------
export async function getGuestbook(showUnapproved = true): Promise<Guestbook[]> {
  if (isSupabaseConfigured()) {
    let query = supabase.from('guestbook').select('*');
    if (!showUnapproved) {
      query = query.eq('is_approved', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase getGuestbook error:', error?.message);
  }
  const db = readLocalDb();
  const list = db.guestbook || [];
  return showUnapproved ? list : list.filter((w: Guestbook) => w.is_approved);
}

export async function addGuestbookEntry(entry: Guestbook): Promise<Guestbook> {
  const payload = {
    guest_name: entry.guest_name,
    message: entry.message,
    is_approved: entry.is_approved !== undefined ? entry.is_approved : true
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('guestbook').insert([payload]).select().single();
    if (!error && data) return data;
    console.error('Supabase addGuestbookEntry error:', error?.message);
  }

  const db = readLocalDb();
  const localEntry = { id: String(Date.now()), created_at: new Date().toISOString(), ...payload };
  db.guestbook.unshift(localEntry);
  writeLocalDb(db);
  return localEntry;
}

export async function toggleGuestbookApproval(id: string, isApproved: boolean): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('guestbook').update({ is_approved: isApproved }).eq('id', id);
    if (!error) return true;
  }
  const db = readLocalDb();
  const wish = db.guestbook.find((w: Guestbook) => w.id === id);
  if (wish) {
    wish.is_approved = isApproved;
    writeLocalDb(db);
    return true;
  }
  return false;
}

export async function deleteGuestbookEntry(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('guestbook').delete().eq('id', id);
    if (!error) return true;
  }
  const db = readLocalDb();
  const initialLength = db.guestbook.length;
  db.guestbook = db.guestbook.filter((w: Guestbook) => w.id !== id);
  writeLocalDb(db);
  return db.guestbook.length < initialLength;
}

export async function deleteGuestbookEntries(ids: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('guestbook').delete().in('id', ids);
    if (!error) return true;
  }
  const db = readLocalDb();
  db.guestbook = db.guestbook.filter((w: Guestbook) => !ids.includes(w.id || ''));
  writeLocalDb(db);
  return true;
}

// -------------------------------------------------------------
// GUESTS REGISTRY (for invitation slugs)
// -------------------------------------------------------------
export async function getGuests(): Promise<Guest[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('guests').select('*');
    if (!error && data) return data;
    console.error('Supabase getGuests error:', error?.message);
  }
  const db = readLocalDb();
  return db.guests || [];
}

export async function updateGuests(guests: Guest[]): Promise<Guest[]> {
  if (isSupabaseConfigured()) {
    await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { data, error } = await supabase.from('guests').insert(guests).select();
    if (!error && data) return data;
    console.error('Supabase updateGuests error:', error?.message);
  }
  const db = readLocalDb();
  db.guests = guests.map((g, idx) => ({ id: g.id || String(idx + 1), ...g }));
  writeLocalDb(db);
  return db.guests;
}

export async function addGuest(name: string, slug: string): Promise<Guest> {
  const payload = { guest_name: name, slug };
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('guests').insert([payload]).select().single();
    if (!error && data) return data;
    console.error('Supabase addGuest error:', error?.message);
  }

  const db = readLocalDb();
  const localGuest = { id: String(Date.now()), ...payload };
  db.guests.push(localGuest);
  writeLocalDb(db);
  return localGuest;
}

export async function deleteGuest(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (!error) return true;
    console.error('Supabase deleteGuest error:', error.message);
  }
  const db = readLocalDb();
  const initialLength = db.guests.length;
  db.guests = db.guests.filter((g: Guest) => g.id !== id);
  writeLocalDb(db);
  return db.guests.length < initialLength;
}

export async function deleteGuests(ids: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('guests').delete().in('id', ids);
    if (!error) return true;
  }
  const db = readLocalDb();
  db.guests = db.guests.filter((g: Guest) => !ids.includes(g.id || ''));
  writeLocalDb(db);
  return true;
}

// -------------------------------------------------------------
// ANALYTICS LOGS
// -------------------------------------------------------------
export async function getAnalyticsLogs(): Promise<AnalyticsLog[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('analytics_logs').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
    console.error('Supabase getAnalyticsLogs error:', error?.message);
  }
  const db = readLocalDb();
  return db.analytics_logs || [];
}

export async function addAnalyticsLog(log: Omit<AnalyticsLog, 'id' | 'created_at'>): Promise<AnalyticsLog> {
  const info = await getWeddingInfo();
  await updateWeddingInfo({ visitor_count: (info.visitor_count || 0) + 1 });

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('analytics_logs').insert([log]).select().single();
    if (!error && data) return data;
    console.error('Supabase addAnalyticsLog error:', error?.message);
  }

  const db = readLocalDb();
  if (!db.analytics_logs) db.analytics_logs = [];
  const localLog = { id: String(Date.now()), created_at: new Date().toISOString(), ...log };
  db.analytics_logs.unshift(localLog);
  writeLocalDb(db);
  return localLog;
}

// Sync back changes to wedding-data.md when edited from local admin dashboard
export function syncLocalDbToMarkdown() {
  const db = readLocalDb();

  const weddingData: WeddingData = {
    groom: {
      namaLengkap: db.wedding_info.groom_name,
      namaPanggilan: db.wedding_info.groom_nickname,
      fatherName: db.parents.find((p: ParentDetail) => p.type === 'groom')?.father_name,
      motherName: db.parents.find((p: ParentDetail) => p.type === 'groom')?.mother_name,
      fatherPhoto: db.parents.find((p: ParentDetail) => p.type === 'groom')?.father_photo,
      motherPhoto: db.parents.find((p: ParentDetail) => p.type === 'groom')?.mother_photo,
    },
    bride: {
      namaLengkap: db.wedding_info.bride_name,
      namaPanggilan: db.wedding_info.bride_nickname,
      fatherName: db.parents.find((p: ParentDetail) => p.type === 'bride')?.father_name,
      motherName: db.parents.find((p: ParentDetail) => p.type === 'bride')?.mother_name,
      fatherPhoto: db.parents.find((p: ParentDetail) => p.type === 'bride')?.father_photo,
      motherPhoto: db.parents.find((p: ParentDetail) => p.type === 'bride')?.mother_photo,
    },
    event: db.wedding_info,
    parents: db.parents,
    gallery: db.gallery,
    giftAccounts: db.gift_accounts,
    guests: db.guests,
    closingMessage: db.wedding_info.closing_message || '',
  };

  const mdContent = stringifyToMarkdown(weddingData);
  fs.writeFileSync(MD_FILE_PATH, mdContent, 'utf8');
}
