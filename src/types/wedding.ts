export interface MempelaiDetail {
  namaLengkap: string;
  namaPanggilan: string;
  fatherName?: string;
  motherName?: string;
  fatherPhoto?: string;
  motherPhoto?: string;
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
  
  // Story timeline
  story_meet?: string;
  story_proposal?: string;
  story_marriage?: string;
  closing_message?: string;

  // Design customisation options
  theme: string;
  primary_color: string;
  secondary_color: string;
  hero_image?: string;
  background_image?: string;
  groom_image?: string;
  bride_image?: string;
  opening_animation: boolean;

  // Business toggles
  enable_music: boolean;
  enable_countdown: boolean;
  enable_guestbook: boolean;
  enable_rsvp: boolean;
  enable_gift: boolean;
  maintenance_mode: boolean;

  // Audio track settings
  music_url?: string;

  // Metadata & SEO configuration
  website_title: string;
  meta_description: string;
  favicon?: string;
  og_image?: string;
  seo_keywords?: string;
  canonical_url?: string;

  // Analytics
  visitor_count: number;
  
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
  father_photo?: string;
  mother_photo?: string;
}

export interface GiftAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  qris_image?: string;
  sort_order: number;
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
  is_approved: boolean;
  created_at?: string;
}

export interface Guest {
  id?: string;
  guest_name: string;
  slug: string;
  created_at?: string;
}

export interface AnalyticsLog {
  id?: string;
  browser?: string;
  device?: string;
  country?: string;
  referrer?: string;
  page_path?: string;
  created_at?: string;
}

export interface LoveStory {
  id?: string;
  title: string;
  story_date: string;
  description: string;
  image_url?: string;
  sort_order: number;
  created_at?: string;
}

export interface WeddingEvent {
  id?: string;
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  address: string;
  google_maps_url: string;
  sort_order: number;
  created_at?: string;
}

export interface WhatsAppTemplate {
  id?: string;
  name: string;
  template_text: string;
  is_default: boolean;
  created_at?: string;
}

export interface ThemeSettings {
  id?: string;
  gallery_layout: string;
  effect: string;
  active_whatsapp_template_id?: string;
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
  loveStories?: LoveStory[];
  events?: WeddingEvent[];
  whatsappTemplates?: WhatsAppTemplate[];
  themeSettings?: ThemeSettings;
}

