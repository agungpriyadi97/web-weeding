import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseMarkdown } from '../src/utils/parser';

// Manual .env loader
function loadEnv() {
  const envPaths = ['.env.local', '.env', '.env.production', '.env.development'];
  for (const envPath of envPaths) {
    const fullPath = path.join(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          let val = trimmed.substring(index + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      });
      console.log(`Loaded environment from ${envPath}`);
      return;
    }
  }
  console.warn('No .env file found. Will rely on system environment variables.');
}

async function seed() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment.');
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const mdPath = path.join(process.cwd(), 'wedding-data.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: ${mdPath} not found.`);
    process.exit(1);
  }

  console.log('Reading wedding-data.md...');
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const data = parseMarkdown(mdContent);

  console.log('Parsing complete. Groom:', data.groom.namaLengkap, '| Bride:', data.bride.namaLengkap);

  // 1. Seed wedding_info
  console.log('Seeding public.wedding_info...');
  // We check if a record exists. If not, insert. If yes, update.
  const { data: existingInfo, error: fetchInfoError } = await supabase
    .from('wedding_info')
    .select('id')
    .limit(1);

  if (fetchInfoError) {
    console.error('Error fetching wedding_info:', fetchInfoError.message);
    process.exit(1);
  }

  const infoPayload = {
    groom_name: data.groom.namaLengkap,
    groom_nickname: data.groom.namaPanggilan,
    bride_name: data.bride.namaLengkap,
    bride_nickname: data.bride.namaPanggilan,
    event_date: data.event.event_date || '2026-12-12',
    event_time: data.event.event_time || '09:00 WIB - Selesai',
    location: data.event.location || 'Gedung Pernikahan',
    address: data.event.address || 'Alamat Lengkap',
    google_maps: data.event.google_maps || 'https://maps.google.com',
    story_meet: data.event.story_meet || '',
    story_proposal: data.event.story_proposal || '',
    story_marriage: data.event.story_marriage || '',
    closing_message: data.closingMessage || '',
  };

  if (existingInfo && existingInfo.length > 0) {
    const { error: updateError } = await supabase
      .from('wedding_info')
      .update(infoPayload)
      .eq('id', existingInfo[0].id);
    if (updateError) console.error('Error updating wedding_info:', updateError.message);
    else console.log('Successfully updated wedding_info.');
  } else {
    const { error: insertError } = await supabase
      .from('wedding_info')
      .insert([infoPayload]);
    if (insertError) console.error('Error inserting wedding_info:', insertError.message);
    else console.log('Successfully inserted wedding_info.');
  }

  // 2. Seed parents
  console.log('Seeding public.parents...');
  const { error: deleteParentsError } = await supabase.from('parents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteParentsError) console.error('Error cleaning parents table:', deleteParentsError.message);

  if (data.parents.length > 0) {
    const { error: insertParentsError } = await supabase.from('parents').insert(data.parents);
    if (insertParentsError) console.error('Error inserting parents:', insertParentsError.message);
    else console.log(`Seeded ${data.parents.length} parents.`);
  }

  // 3. Seed gallery
  console.log('Seeding public.gallery...');
  const { error: deleteGalleryError } = await supabase.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteGalleryError) console.error('Error cleaning gallery table:', deleteGalleryError.message);

  if (data.gallery.length > 0) {
    const { error: insertGalleryError } = await supabase.from('gallery').insert(data.gallery);
    if (insertGalleryError) console.error('Error inserting gallery items:', insertGalleryError.message);
    else console.log(`Seeded ${data.gallery.length} gallery items.`);
  }

  // 4. Seed gift_accounts
  console.log('Seeding public.gift_accounts...');
  const { error: deleteGiftsError } = await supabase.from('gift_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteGiftsError) console.error('Error cleaning gift_accounts table:', deleteGiftsError.message);

  if (data.giftAccounts.length > 0) {
    const { error: insertGiftsError } = await supabase.from('gift_accounts').insert(data.giftAccounts);
    if (insertGiftsError) console.error('Error inserting gift_accounts:', insertGiftsError.message);
    else console.log(`Seeded ${data.giftAccounts.length} gift accounts.`);
  }

  // 5. Seed guests list
  console.log('Seeding public.guests...');
  // We don't necessarily delete existing RSVPs, but we synchronize the guest registry list.
  const { error: deleteGuestsError } = await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteGuestsError) console.error('Error cleaning guests registry table:', deleteGuestsError.message);

  if (data.guests.length > 0) {
    const { error: insertGuestsError } = await supabase.from('guests').insert(data.guests);
    if (insertGuestsError) console.error('Error inserting guests registry:', insertGuestsError.message);
    else console.log(`Seeded ${data.guests.length} guest names registry.`);
  }

  console.log('Database seeding successfully finished!');
}

seed().catch(err => {
  console.error('Unhanded error in seed process:', err);
  process.exit(1);
});
