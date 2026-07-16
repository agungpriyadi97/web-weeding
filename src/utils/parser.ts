import { WeddingData } from '../types/wedding';

// Helper to generate a slug from guest name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseMarkdown(content: string): WeddingData {
  const result: WeddingData = {
    groom: { namaLengkap: '', namaPanggilan: '' },
    bride: { namaLengkap: '', namaPanggilan: '' },
    event: {
      groom_name: '',
      groom_nickname: '',
      bride_name: '',
      bride_nickname: '',
      event_date: '',
      event_time: '',
      location: '',
      address: '',
      google_maps: '',
      theme: 'elegant-gold',
      primary_color: '#C5A059',
      secondary_color: '#FDFBF7',
      opening_animation: true,
      enable_music: true,
      enable_countdown: true,
      enable_guestbook: true,
      enable_rsvp: true,
      enable_gift: true,
      maintenance_mode: false,
      visitor_count: 0,
      website_title: 'Invitation',
      meta_description: 'Digital Invitation'
    },
    parents: [],
    gallery: [],
    giftAccounts: [],
    guests: [],
    closingMessage: '',
  };

  const sections = content.split(/(?=^##\s+)/m);

  for (const section of sections) {
    const lines = section.split('\n');
    const headerLine = lines[0] || '';

    if (headerLine.includes('Data Mempelai')) {
      let currentMempelai: 'groom' | 'bride' | null = null;
      for (const line of lines) {
        if (line.includes('### Mempelai Pria')) {
          currentMempelai = 'groom';
        } else if (line.includes('### Mempelai Wanita')) {
          currentMempelai = 'bride';
        } else if (currentMempelai && line.trim().startsWith('-')) {
          const match = line.match(/-\s*([^:]+):\s*(.*)/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key.includes('Nama Lengkap')) {
              if (currentMempelai === 'groom') result.groom.namaLengkap = value;
              else result.bride.namaLengkap = value;
            } else if (key.includes('Nama Panggilan')) {
              if (currentMempelai === 'groom') result.groom.namaPanggilan = value;
              else result.bride.namaPanggilan = value;
            }
          }
        }
      }
    } else if (headerLine.includes('Foto')) {
      let isGallery = false;
      let order = 1;
      for (const line of lines) {
        if (line.includes('### Galeri')) {
          isGallery = true;
        } else if (line.trim().startsWith('-')) {
          const value = line.replace(/^-\s*/, '').trim();
          if (value && !value.includes('Opsional')) {
            if (isGallery) {
              result.gallery.push({ image_url: value, sort_order: order++ });
            } else {
              // Cover
              result.event.story_marriage = value; // temp holder for cover photo or custom field
            }
          }
        }
      }
    } else if (headerLine.includes('Informasi Acara')) {
      for (const line of lines) {
        if (line.trim().startsWith('-')) {
          const match = line.match(/-\s*([^:]+):\s*(.*)/);
          if (match) {
            const key = match[1].trim().toLowerCase();
            const value = match[2].trim();
            if (key.includes('hari')) {
              // Just store or merge
            } else if (key.includes('tanggal')) {
              result.event.event_date = value;
            } else if (key.includes('jam')) {
              result.event.event_time = value;
            } else if (key.includes('nama lokasi')) {
              result.event.location = value;
            } else if (key.includes('alamat lengkap')) {
              result.event.address = value;
            } else if (key.includes('google maps')) {
              result.event.google_maps = value;
            }
          }
        }
      }
    } else if (headerLine.includes('Our Story')) {
      let currentTimeline: 'meet' | 'proposal' | 'marriage' | null = null;
      let buffer: string[] = [];

      const flushBuffer = () => {
        if (currentTimeline && buffer.length > 0) {
          const contentText = buffer.join('\n').trim();
          if (currentTimeline === 'meet') result.event.story_meet = contentText;
          else if (currentTimeline === 'proposal') result.event.story_proposal = contentText;
          else if (currentTimeline === 'marriage') result.event.story_marriage = contentText;
        }
        buffer = [];
      };

      for (const line of lines) {
        if (line.includes('### Awal Bertemu')) {
          flushBuffer();
          currentTimeline = 'meet';
        } else if (line.includes('### Lamaran')) {
          flushBuffer();
          currentTimeline = 'proposal';
        } else if (line.includes('### Cerita Singkat Hingga Menikah')) {
          flushBuffer();
          currentTimeline = 'marriage';
        } else if (line.trim().startsWith('---')) {
          // ignore horizontal rules
        } else if (currentTimeline && !line.trim().startsWith('###')) {
          buffer.push(line);
        }
      }
      flushBuffer();
    } else if (headerLine.includes('Orang Tua')) {
      let currentMempelai: 'groom' | 'bride' | null = null;
      let father = '';
      let mother = '';

      const flushParents = () => {
        if (currentMempelai && (father || mother)) {
          result.parents.push({
            type: currentMempelai,
            father_name: father.trim(),
            mother_name: mother.trim(),
          });
        }
        father = '';
        mother = '';
      };

      for (const line of lines) {
        if (line.includes('### Mempelai Pria')) {
          flushParents();
          currentMempelai = 'groom';
        } else if (line.includes('### Mempelai Wanita')) {
          flushParents();
          currentMempelai = 'bride';
        } else if (currentMempelai) {
          if (line.trim().toLowerCase().startsWith('ayah:')) {
            father = line.replace(/^\s*ayah:\s*/i, '').trim();
          } else if (line.trim().toLowerCase().startsWith('ibu:')) {
            mother = line.replace(/^\s*ibu:\s*/i, '').trim();
          }
        }
      }
      flushParents();
    } else if (headerLine.includes('Amplop Digital')) {
      let bank = '';
      let accNum = '';
      let holder = '';
      let qris = '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.toLowerCase().startsWith('nama bank:')) {
          bank = cleanLine.replace(/^\s*nama bank:\s*/i, '').trim();
        } else if (cleanLine.toLowerCase().startsWith('nomor rekening:')) {
          accNum = cleanLine.replace(/^\s*nomor rekening:\s*/i, '').trim();
        } else if (cleanLine.toLowerCase().startsWith('nama pemilik rekening:')) {
          holder = cleanLine.replace(/^\s*nama pemilik rekening:\s*/i, '').trim();
        } else if (cleanLine.toLowerCase().startsWith('qris:')) {
          qris = cleanLine.replace(/^\s*qris:\s*/i, '').trim();
        }
      }
      if (bank || accNum || holder || qris) {
        result.giftAccounts.push({
          bank_name: bank,
          account_number: accNum,
          account_holder: holder,
          qris_image: qris || undefined,
          sort_order: result.giftAccounts.length,
        });
      }
    } else if (headerLine.includes('Ucapan Penutup')) {
      const closingLines = lines.slice(1).filter(l => !l.trim().startsWith('---'));
      result.closingMessage = closingLines.join('\n').trim();
    } else if (headerLine.includes('Daftar Nama Tamu')) {
      for (const line of lines) {
        if (line.trim().startsWith('|')) {
          const cols = line.split('|').map(s => s.trim()).filter(Boolean);
          if (cols.length >= 2) {
            const no = parseInt(cols[0], 10);
            if (!isNaN(no)) {
              const name = cols.slice(1).join(' ').trim();
              if (name && !name.includes('Nama Tamu') && !name.startsWith('---')) {
                result.guests.push({
                  guest_name: name,
                  slug: generateSlug(name),
                });
              }
            }
          }
        }
      }
    }
  }

  // Populate basic event naming details
  result.event.groom_name = result.groom.namaLengkap;
  result.event.groom_nickname = result.groom.namaPanggilan;
  result.event.bride_name = result.bride.namaLengkap;
  result.event.bride_nickname = result.bride.namaPanggilan;

  // Add parents details directly into mempelai objects if available
  const groomParents = result.parents.find(p => p.type === 'groom');
  if (groomParents) {
    result.groom.fatherName = groomParents.father_name;
    result.groom.motherName = groomParents.mother_name;
  }
  const brideParents = result.parents.find(p => p.type === 'bride');
  if (brideParents) {
    result.bride.fatherName = brideParents.father_name;
    result.bride.motherName = brideParents.mother_name;
  }

  return result;
}

export function stringifyToMarkdown(data: WeddingData): string {
  const groomParents = data.parents.find(p => p.type === 'groom');
  const brideParents = data.parents.find(p => p.type === 'bride');
  const mainGift = data.giftAccounts[0] || { bank_name: '', account_number: '', account_holder: '', qris_image: '' };

  let md = `# DATA WEBSITE UNDANGAN DIGITAL

## 💍 Data Mempelai

### Mempelai Pria
- Nama Lengkap: ${data.groom.namaLengkap}
- Nama Panggilan (Opsional): ${data.groom.namaPanggilan}

### Mempelai Wanita
- Nama Lengkap: ${data.bride.namaLengkap}
- Nama Panggilan (Opsional): ${data.bride.namaPanggilan}

---

## 📸 Foto

### Foto Cover / Prewedding
- /images/cover.jpg

### Galeri
${data.gallery.map(item => `- ${item.image_url}`).join('\n')}

---

## 📅 Informasi Acara

- Hari: Sabtu
- Tanggal: ${data.event.event_date}
- Jam: ${data.event.event_time}
- Nama Lokasi: ${data.event.location}
- Alamat Lengkap: ${data.event.address}
- Link Google Maps: ${data.event.google_maps}

---

## ❤️ Our Story

### Awal Bertemu

${data.event.story_meet || '...'}

### Lamaran

${data.event.story_proposal || '...'}

### Cerita Singkat Hingga Menikah

${data.event.story_marriage || '...'}

---

## 👨‍👩‍👧‍👦 Orang Tua

### Mempelai Pria

Ayah: ${groomParents?.father_name || ''}
Ibu: ${groomParents?.mother_name || ''}

### Mempelai Wanita

Ayah: ${brideParents?.father_name || ''}
Ibu: ${brideParents?.mother_name || ''}

---

## 🎁 Amplop Digital (Opsional)

Nama Bank: ${mainGift.bank_name}

Nomor Rekening: ${mainGift.account_number}

Nama Pemilik Rekening: ${mainGift.account_holder}

QRIS: ${mainGift.qris_image || ''}

---

## 💌 Ucapan Penutup (Opsional)

${data.closingMessage || '...'}

---

## 👥 Daftar Nama Tamu (Opsional)

| No | Nama Tamu |
|----|-----------|
`;

  data.guests.forEach((guest, index) => {
    md += `| ${index + 1} | ${guest.guest_name} |\n`;
  });

  return md;
}
