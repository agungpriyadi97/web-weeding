export interface MempelaiDetail {
  namaLengkap: string;
  namaPanggilan: string;
  fatherName?: string;
  motherName?: string;
}

export interface EventDetail {
  id?: string;
  groom_name: string;
  groom_nickname: string;
  bride_name: string;
  bride_nickname: string;
  event_date: string;
  event_time: string;
  location: string;
  address: string;
  google_maps: string;
  story_meet?: string;
  story_proposal?: string;
  story_marriage?: string;
  closing_message?: string;
  created_at?: string;
}

export interface GalleryItem {
  id?: string;
  image_url: string;
  sort_order: number;
}

export interface ParentDetail {
  id?: string;
  type: 'groom' | 'bride';
  father_name: string;
  mother_name: string;
}

export interface GiftAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  qris_image?: string;
}

export interface RSVP {
  id?: string;
  guest_name: string;
  attendance: boolean;
  guest_count: number;
  message: string;
  created_at?: string;
}

export interface Guestbook {
  id?: string;
  guest_name: string;
  message: string;
  created_at?: string;
}

export interface Guest {
  id?: string;
  guest_name: string;
  slug: string;
  created_at?: string;
}

// Aggregated type for markdown parser and client rendering
export interface WeddingData {
  groom: MempelaiDetail;
  bride: MempelaiDetail;
  event: EventDetail;
  parents: ParentDetail[];
  gallery: GalleryItem[];
  giftAccounts: GiftAccount[];
  guests: Guest[];
  closingMessage: string;
}
