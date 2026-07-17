'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Copy, 
  Check, 
  Heart, 
  Send, 
  Clock, 
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { WeddingData, RSVP, Guestbook } from '../types/wedding';
import Countdown from './Countdown';
import MusicPlayer from './MusicPlayer';
import PremiumEffects from './PremiumEffects';
import { supabase } from '@/utils/supabaseClient';
import { getThemeConfig } from '@/themes';

interface InvitationPageProps {
  initialData: WeddingData;
  guestName: string | null;
  previewThemeId?: string; // Client-side theme preview override
}

// Vector corners for premium theme decoration
const BatikCorner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={`w-14 h-14 fill-current opacity-25 ${className}`} style={style}>
    <path d="M0,0 L100,0 Q80,20 80,40 Q80,80 40,80 Q20,80 0,100 Z" />
    <path d="M0,0 L60,0 Q50,10 50,20 Q50,50 20,50 Q10,50 0,60 Z" opacity="0.6" />
  </svg>
);

const GoldVintageCorner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={`w-14 h-14 fill-none stroke-current opacity-40 ${className}`} style={style} strokeWidth="1.5">
    <path d="M5,5 L90,5 A85,85 0 0,1 5,90 Z" />
    <path d="M12,12 L75,12 A63,63 0 0,1 12,75 Z" />
    <circle cx="20" cy="20" r="3" className="fill-current" />
  </svg>
);

const FloralCorner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={`w-14 h-14 fill-current opacity-30 ${className}`} style={style}>
    <path d="M0,0 Q30,10 40,30 Q30,50 0,0 Z" />
    <path d="M0,0 Q10,30 30,40 Q50,30 0,0 Z" />
    <circle cx="15" cy="15" r="8" opacity="0.5" />
    <circle cx="25" cy="25" r="5" opacity="0.4" />
  </svg>
);

const LeafRusticCorner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={`w-14 h-14 fill-none stroke-current opacity-35 ${className}`} style={style} strokeWidth="1.2">
    <path d="M5,0 Q10,40 50,50 Q40,10 0,5 Z" />
    <path d="M5,0 Q25,25 50,50" />
    <path d="M20,15 Q30,10 35,20 Q25,25 20,15 Z" fill="currentColor" opacity="0.2" />
    <path d="M15,20 Q10,30 20,35 Q25,25 15,20 Z" fill="currentColor" opacity="0.2" />
  </svg>
);

const ArabicCorner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={`w-14 h-14 fill-none stroke-current opacity-30 ${className}`} style={style} strokeWidth="1">
    <path d="M0,0 L30,0 L40,10 L30,20 L30,30 L20,30 L10,40 L0,30 Z" fill="currentColor" opacity="0.1" />
    <path d="M5,5 L25,5 L25,25 L5,25 Z" />
  </svg>
);

const CornerOrnament = ({ type, color, className }: { type: string; color: string; className?: string }) => {
  const style = { color };
  if (type === 'traditional-culture' || type === 'batik') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`}>
        <BatikCorner className="absolute top-3 left-3" style={style} />
        <BatikCorner className="absolute top-3 right-3 rotate-90" style={style} />
        <BatikCorner className="absolute bottom-3 left-3 -rotate-90" style={style} />
        <BatikCorner className="absolute bottom-3 right-3 rotate-180" style={style} />
      </div>
    );
  }
  if (type === 'gold-vintage') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`}>
        <GoldVintageCorner className="absolute top-3 left-3" style={style} />
        <GoldVintageCorner className="absolute top-3 right-3 rotate-90" style={style} />
        <GoldVintageCorner className="absolute bottom-3 left-3 -rotate-90" style={style} />
        <GoldVintageCorner className="absolute bottom-3 right-3 rotate-180" style={style} />
      </div>
    );
  }
  if (type === 'floral-pastel') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`}>
        <FloralCorner className="absolute top-2 left-2" style={style} />
        <FloralCorner className="absolute top-2 right-2 rotate-90" style={style} />
        <FloralCorner className="absolute bottom-2 left-2 -rotate-90" style={style} />
        <FloralCorner className="absolute bottom-2 right-2 rotate-180" style={style} />
      </div>
    );
  }
  if (type === 'leaf-rustic') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`}>
        <LeafRusticCorner className="absolute top-3 left-3" style={style} />
        <LeafRusticCorner className="absolute top-3 right-3 rotate-90" style={style} />
        <LeafRusticCorner className="absolute bottom-3 left-3 -rotate-90" style={style} />
        <LeafRusticCorner className="absolute bottom-3 right-3 rotate-180" style={style} />
      </div>
    );
  }
  if (type === 'arabic') {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`}>
        <ArabicCorner className="absolute top-3 left-3" style={style} />
        <ArabicCorner className="absolute top-3 right-3 rotate-90" style={style} />
        <ArabicCorner className="absolute bottom-3 left-3 -rotate-90" style={style} />
        <ArabicCorner className="absolute bottom-3 right-3 rotate-180" style={style} />
      </div>
    );
  }
  return null;
};

export default function InvitationPage({ initialData, guestName, previewThemeId }: InvitationPageProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [wishes, setWishes] = useState<Guestbook[]>([]);
  const [wishesLoading, setWishesLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);

  // Active theme selection
  const currentThemeKey = previewThemeId || initialData.event?.theme || 'elegant-gold';
  let theme = getThemeConfig(currentThemeKey);
  if (!theme) {
    theme = getThemeConfig('elegant-gold');
  }

  // Extract or build groom/bride details to be fully compatible with both mapped and raw data formats
  const groom = initialData.groom || {
    namaLengkap: initialData.event?.groom_name || '',
    namaPanggilan: initialData.event?.groom_nickname || '',
    fatherName: initialData.parents?.find(p => p.type === 'groom')?.father_name,
    motherName: initialData.parents?.find(p => p.type === 'groom')?.mother_name,
    fatherPhoto: initialData.parents?.find(p => p.type === 'groom')?.father_photo,
    motherPhoto: initialData.parents?.find(p => p.type === 'groom')?.mother_photo,
  };

  const bride = initialData.bride || {
    namaLengkap: initialData.event?.bride_name || '',
    namaPanggilan: initialData.event?.bride_nickname || '',
    fatherName: initialData.parents?.find(p => p.type === 'bride')?.father_name,
    motherName: initialData.parents?.find(p => p.type === 'bride')?.mother_name,
    fatherPhoto: initialData.parents?.find(p => p.type === 'bride')?.father_photo,
    motherPhoto: initialData.parents?.find(p => p.type === 'bride')?.mother_photo,
  };

  // Layout configs
  const galleryLayout = initialData.themeSettings?.gallery_layout || 'grid';
  const bgEffect = (initialData.themeSettings?.effect as 'sakura' | 'rose' | 'confetti' | 'sparkle' | 'snow' | 'bubble' | 'fireflies' | 'lantern' | 'none') || theme.defaultEffect || 'none';

  // Setup form hooks
  const { register: registerRsvp, handleSubmit: handleRsvpSubmit, reset: resetRsvp } = useForm<RSVP>({
    defaultValues: {
      guest_name: guestName || '',
      attendance: true,
      guest_count: 1,
      message: '',
    }
  });

  const { register: registerWish, handleSubmit: handleWishSubmit, reset: resetWish } = useForm<{
    guest_name: string;
    message: string;
  }>({
    defaultValues: {
      guest_name: guestName || '',
      message: '',
    }
  });

  // Track visit analytics and load guestbook
  useEffect(() => {
    // 1. Log visit analytics
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_path: typeof window !== 'undefined' ? window.location.pathname : '/' }),
    }).catch(err => console.warn('Analytics registration failed:', err));

    // 2. Fetch approved wishes
    const fetchWishes = async () => {
      try {
        const res = await fetch('/api/guestbook');
        const data = await res.json();
        if (Array.isArray(data)) {
          setWishes(data.filter((w: Guestbook) => w.is_approved));
        }
      } catch (err) {
        console.error('Failed to load guestbook:', err);
      } finally {
        setWishesLoading(false);
      }
    };

    fetchWishes();

    // 3. Setup real-time updates for wishes
    if (supabase) {
      const channel = supabase
        .channel('realtime-guestbook-wall-inv')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'guestbook' },
          (payload) => {
            const newEntry = payload.new as Guestbook;
            if (newEntry.is_approved) {
              setWishes((prev) => [newEntry, ...prev]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Control body scrolling based on opened state
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpened]);

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (initialData.event.enable_music) {
      setPlayMusic(true);
    }
  };

  const onRSVPSubmit = async (formData: RSVP) => {
    setRsvpSubmitting(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guest_count: Number(formData.guest_count),
        }),
      });
      if (res.ok) {
        setRsvpSuccess(true);
        resetRsvp();
        // Automatically publish well-wishes message in guestbook
        if (formData.message) {
          await fetch('/api/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guest_name: formData.guest_name,
              message: formData.message,
              is_approved: true
            }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const onWishSubmit = async (formData: { guest_name: string; message: string }) => {
    setGuestbookSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_approved: true }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        if (!supabase) {
          setWishes((prev) => [newEntry, ...prev]);
        }
        resetWish();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuestbookSubmitting(false);
    }
  };

  const copyAccountNumber = (accNum: string, index: number) => {
    navigator.clipboard.writeText(accNum);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Google Calendar trigger
  const getGoogleCalendarUrl = (evName: string, evDate: string, evTime: string, evLoc: string, evAddr: string) => {
    if (!evDate) return '';
    const dateStr = evDate.replace(/-/g, '');
    const title = encodeURIComponent(`${evName} - ${initialData.event.groom_nickname} & ${initialData.event.bride_nickname}`);
    const details = encodeURIComponent(`Bergabunglah merayakan hari bahagia kami di ${evLoc}.`);
    const location = encodeURIComponent(evAddr);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T090000/${dateStr}T150000&details=${details}&location=${location}`;
  };

  // Dynamic timelines fallback helper
  const fallbackStories = [];
  if (initialData.event.story_meet) {
    fallbackStories.push({
      id: 'meet',
      title: 'Awal Bertemu',
      story_date: 'Kisah Pertama',
      description: initialData.event.story_meet,
      sort_order: 0
    });
  }
  if (initialData.event.story_proposal) {
    fallbackStories.push({
      id: 'proposal',
      title: 'Lamaran',
      story_date: 'Kisah Kedua',
      description: initialData.event.story_proposal,
      sort_order: 1
    });
  }
  if (initialData.event.story_marriage) {
    fallbackStories.push({
      id: 'marriage',
      title: 'Hingga Menikah',
      story_date: 'Kisah Ketiga',
      description: initialData.event.story_marriage,
      sort_order: 2
    });
  }
  const storiesList = (initialData.loveStories && initialData.loveStories.length > 0)
    ? initialData.loveStories
    : fallbackStories;

  // Dynamic events list fallback helper
  const eventsList = (initialData.events && initialData.events.length > 0)
    ? initialData.events
    : [{
        id: 'default-akad',
        name: 'Akad Nikah',
        event_date: initialData.event.event_date,
        event_time: initialData.event.event_time,
        location: initialData.event.location,
        address: initialData.event.address,
        google_maps_url: initialData.event.google_maps,
        sort_order: 0
      }];

  const showMusic = initialData.event.enable_music ?? true;
  const showCountdown = initialData.event.enable_countdown ?? true;
  const showGallery = initialData.gallery && initialData.gallery.length > 0;
  const showRSVP = initialData.event.enable_rsvp ?? true;
  const showGuestbook = initialData.event.enable_guestbook ?? true;
  const showGift = (initialData.event.enable_gift ?? true) && initialData.giftAccounts && initialData.giftAccounts.length > 0;

  // -------------------------------------------------------------
  // GALLERY CAROUSEL STATE MANAGER
  // -------------------------------------------------------------
  const [carouselIndex, setCarouselIndex] = useState(0);
  const nextCarouselSlide = () => {
    setCarouselIndex((prev) => (prev === initialData.gallery.length - 1 ? 0 : prev + 1));
  };
  const prevCarouselSlide = () => {
    setCarouselIndex((prev) => (prev === 0 ? initialData.gallery.length - 1 : prev - 1));
  };

  // Render maintenance view if enabled by admin
  if (initialData.event.maintenance_mode) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-center p-6">
        <div className="max-w-md p-8 bg-white border border-gold-200 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-gold-50 border border-gold-300 rounded-full flex items-center justify-center text-gold-600 mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gold-800">Under Maintenance</h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Halaman undangan digital ini sedang dalam proses pemeliharaan sistem. Silakan berkunjung beberapa saat lagi.
          </p>
        </div>
      </div>
    );
  }

  if (!theme || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-red-500 font-bold min-h-[200px] bg-white">
        Preview is not available.
      </div>
    );
  }

  return (
    <div className={`relative overflow-x-hidden min-h-screen ${theme.classes.bodyBg} ${theme.fontBody} ${theme.classes.text} antialiased`}>
      {/* Inject custom variables in inline stylesheet */}
      <style>{`
        :root {
          --theme-primary: ${theme.colors.primary};
          --theme-secondary: ${theme.colors.secondary};
          --theme-accent: ${theme.colors.accent};
        }
        .font-elegant-serif { font-family: var(--font-elegant-serif), serif; }
        .font-luxury-serif { font-family: var(--font-luxury-serif), serif; }
        .font-modern-sans { font-family: var(--font-modern-sans), sans-serif; }
        .font-classic-script { font-family: var(--font-classic-script), cursive; }
        .font-arabic-style { font-family: var(--font-arabic-style), serif; }
        .font-traditional-style { font-family: var(--font-traditional-style), serif; }
      `}</style>

      {/* Background audio floating widget */}
      {showMusic && (
        <MusicPlayer play={playMusic} audioUrl={initialData.event.music_url} />
      )}

      {/* Premium Effect animation floating on top */}
      <PremiumEffects effect={bgEffect} />

      {/* 1. COVER PAGE LAYER (Fullscreen Overlay) */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-50 flex flex-col justify-between items-center text-center px-6 py-16 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url("${
                initialData.event.hero_image || '/images/cover.png'
              }")`,
            }}
          >
            <div className="mt-6 flex flex-col items-center">
              <span className={`text-white/80 font-medium uppercase tracking-widest text-xs ${theme.fontBody}`}>Wedding Invitation</span>
              <div className="w-12 h-px bg-white/30 my-3" />
              <h1 className={`text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide mt-2 drop-shadow-md ${theme.fontHeading}`}>
                {groom.namaPanggilan} & {bride.namaPanggilan}
              </h1>
            </div>

            <div className="flex flex-col items-center gap-6 max-w-sm w-full bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
              {guestName ? (
                <div className="text-white">
                  <p className="text-xs text-white/70 font-medium tracking-widest uppercase">Dear Honorable Guest:</p>
                  <p className={`text-xl sm:text-2xl font-bold mt-2 ${theme.fontHeading}`} style={{ color: theme.colors.accent }}>{guestName}</p>
                </div>
              ) : (
                <p className="text-sm text-white/80 font-medium tracking-wide">
                  Kami mengundang Anda untuk merayakan hari istimewa kami.
                </p>
              )}

              <button
                onClick={handleOpenInvitation}
                className={`w-full py-3.5 rounded-full text-white font-bold text-xs tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2`}
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Heart className="w-4 h-4 fill-white animate-pulse" />
                Buka Undangan
              </button>
            </div>

            <div className="text-white/70 text-xs sm:text-sm font-semibold tracking-widest uppercase">
              {formatIndoDate(initialData.event.event_date)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WEDDING INVITATION VIEW */}
      {isOpened && (
        <div className="w-full min-h-screen flex flex-col items-center relative z-10">
          
          {/* Top progress line accent */}
          <div className="w-full h-1 fixed top-0 left-0 z-40" style={{ backgroundColor: theme.colors.primary }} />

          {/* 2. OPENING SECTION */}
          <section className="min-h-screen w-full flex flex-col justify-center items-center text-center px-6 py-20 relative bg-cover bg-center"
            style={initialData.event.hero_image ? {
              backgroundImage: `linear-gradient(to bottom, rgba(${theme.colors.secondary === '#111111' ? '17,17,17' : '253,251,247'}, 0.95), rgba(${theme.colors.secondary === '#111111' ? '17,17,17' : '253,251,247'}, 0.9)), url("${initialData.event.hero_image}")`,
            } : {}}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="max-w-2xl mx-auto flex flex-col items-center relative p-12 rounded-3xl"
            >
              <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
              
              <Heart className="w-8 h-8 mb-6 animate-pulse" style={{ color: theme.colors.primary }} />
              <span className={`text-xs uppercase tracking-widest font-bold mb-4`} style={{ color: theme.colors.primary }}>Undangan Pernikahan</span>
              
              <h2 className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-wide my-6 ${theme.classes.heading} ${theme.fontHeading}`}>
                {groom.namaPanggilan} & {bride.namaPanggilan}
              </h2>
              
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mt-4 opacity-80">
                {formatIndoDate(initialData.event.event_date)}
              </p>
              
              <div className="mt-8 animate-bounce">
                <p className="text-[10px] tracking-widest uppercase opacity-45">Scroll Down</p>
                <div className="w-0.5 h-6 mx-auto mt-2 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              </div>
            </motion.div>
          </section>

          {/* 3. QUOTE / AYAT SECTION */}
          <section className="w-full max-w-3xl px-6 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-2xl border"
              style={{ borderColor: `${theme.colors.primary}20`, backgroundColor: `${theme.colors.primary}05` }}
            >
              <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
              <span className="text-2xl font-serif mb-4 block">﷽</span>
              <p className="text-sm sm:text-base leading-relaxed italic max-w-lg mx-auto opacity-90">
                &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenis-mu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir.&rdquo;
              </p>
              <p className={`block mt-4 font-bold text-xs uppercase tracking-wider`} style={{ color: theme.colors.primary }}>
                (QS. Ar-Rum: 21)
              </p>
            </motion.div>
          </section>

          {/* 4. BRIDE & GROOM SECTION */}
          <section className={`w-full max-w-4xl px-6 py-24 flex flex-col items-center text-center rounded-3xl my-8 relative ${theme.classes.cardBg}`}>
            <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-14"
            >
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Mempelai Pernikahan</h2>
              <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-3xl">
              {/* Groom Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center p-6 rounded-2xl border"
                style={{ borderColor: `${theme.colors.primary}15` }}
              >
                {initialData.event.groom_image ? (
                  <div className="relative w-28 h-28 mb-6 shadow-md border-2 rounded-full overflow-hidden" style={{ borderColor: theme.colors.primary }}>
                    <Image 
                      src={initialData.event.groom_image} 
                      alt={groom.namaLengkap} 
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-3xl font-bold border-2" style={{ backgroundColor: `${theme.colors.primary}10`, borderColor: theme.colors.primary, color: theme.colors.primary }}>
                    G
                  </div>
                )}
                <h3 className={`text-2xl font-bold ${theme.fontHeading}`}>{groom.namaLengkap}</h3>
                <p className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-70">Mempelai Pria</p>
                
                {(groom.fatherName || groom.motherName) && (
                  <div className="text-sm mt-6 pt-4 border-t border-dashed w-full flex flex-col items-center gap-2" style={{ borderColor: `${theme.colors.primary}20` }}>
                    <p className="font-semibold text-[10px] uppercase tracking-widest opacity-40">Putra dari:</p>
                    
                    <div className="flex gap-4 items-start justify-center">
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'groom')?.father_photo && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border mb-1 mx-auto" style={{ borderColor: `${theme.colors.primary}30` }}>
                            <Image 
                              src={initialData.parents.find(p => p.type === 'groom')?.father_photo || ''} 
                              alt="Father" 
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium">Bapak {groom.fatherName || '-'}</p>
                      </div>
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'groom')?.mother_photo && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border mb-1 mx-auto" style={{ borderColor: `${theme.colors.primary}30` }}>
                            <Image 
                              src={initialData.parents.find(p => p.type === 'groom')?.mother_photo || ''} 
                              alt="Mother" 
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium">Ibu {groom.motherName || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Bride Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center p-6 rounded-2xl border"
                style={{ borderColor: `${theme.colors.primary}15` }}
              >
                {initialData.event.bride_image ? (
                  <div className="relative w-28 h-28 mb-6 shadow-md border-2 rounded-full overflow-hidden" style={{ borderColor: theme.colors.primary }}>
                    <Image 
                      src={initialData.event.bride_image} 
                      alt={bride.namaLengkap} 
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-3xl font-bold border-2" style={{ backgroundColor: `${theme.colors.primary}10`, borderColor: theme.colors.primary, color: theme.colors.primary }}>
                    B
                  </div>
                )}
                <h3 className={`text-2xl font-bold ${theme.fontHeading}`}>{bride.namaLengkap}</h3>
                <p className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-70">Mempelai Wanita</p>

                {(bride.fatherName || bride.motherName) && (
                  <div className="text-sm mt-6 pt-4 border-t border-dashed w-full flex flex-col items-center gap-2" style={{ borderColor: `${theme.colors.primary}20` }}>
                    <p className="font-semibold text-[10px] uppercase tracking-widest opacity-40">Putri dari:</p>
                    
                    <div className="flex gap-4 items-start justify-center">
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'bride')?.father_photo && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border mb-1 mx-auto" style={{ borderColor: `${theme.colors.primary}30` }}>
                            <Image 
                              src={initialData.parents.find(p => p.type === 'bride')?.father_photo || ''} 
                              alt="Father" 
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium">Bapak {bride.fatherName || '-'}</p>
                      </div>
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'bride')?.mother_photo && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border mb-1 mx-auto" style={{ borderColor: `${theme.colors.primary}30` }}>
                            <Image 
                              src={initialData.parents.find(p => p.type === 'bride')?.mother_photo || ''} 
                              alt="Mother" 
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium">Ibu {bride.motherName || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          {/* 5. LOVE STORY TIMELINE */}
          {storiesList.length > 0 && (
            <section className="w-full max-w-4xl px-6 py-24 flex flex-col items-center relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-14 text-center"
              >
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Kisah Cinta Kami</h2>
                <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
              </motion.div>

              <div className="relative border-l-2 max-w-xl mx-auto flex flex-col gap-12 py-4" style={{ borderColor: `${theme.colors.primary}30` }}>
                {storiesList.map((story, idx) => (
                  <motion.div
                    key={story.id || idx}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative pl-10"
                  >
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-white" style={{ borderColor: theme.colors.primary }} />
                    
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">{story.story_date}</span>
                    <h3 className={`text-xl font-bold mt-1`} style={{ color: theme.colors.primary }}>{story.title}</h3>
                    
                    {story.image_url && (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden mt-3 shadow-sm border" style={{ borderColor: `${theme.colors.primary}15` }}>
                        <Image 
                          src={story.image_url} 
                          alt={story.title} 
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed mt-2.5 opacity-80">{story.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 6. WEDDING EVENTS SECTION */}
          <section className={`w-full max-w-4xl px-6 py-24 flex flex-col items-center rounded-3xl my-8 relative ${theme.classes.cardBg}`}>
            <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-14 text-center"
            >
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Acara Pernikahan</h2>
              <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              {eventsList.map((ev, idx) => (
                <motion.div
                  key={ev.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/40 border shadow-xs"
                  style={{ borderColor: `${theme.colors.primary}15` }}
                >
                  <Clock className="w-8 h-8 mb-4" style={{ color: theme.colors.primary }} />
                  <h3 className={`text-2xl font-bold`} style={{ color: theme.colors.primary }}>{ev.name}</h3>
                  <div className="w-12 h-px my-3" style={{ backgroundColor: `${theme.colors.primary}30` }} />
                  <p className="text-sm font-bold">{formatIndoDate(ev.event_date)}</p>
                  <p className="text-xs opacity-75 mt-1">{ev.event_time}</p>
                  <p className="text-xs font-semibold mt-4">{ev.location}</p>
                  <p className="text-[11px] opacity-75 leading-relaxed mt-1">{ev.address}</p>

                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <a
                      href={getGoogleCalendarUrl(ev.name, ev.event_date, ev.event_time, ev.location, ev.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-white font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5 transition-all shadow-xs"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <CalendarIcon className="w-3 h-3" />
                      Simpan Kalender
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 7. COUNTDOWN SECTION */}
          {showCountdown && (
            <section className="w-full max-w-3xl px-6 py-20 text-center flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full"
              >
                <span className="text-[10px] tracking-widest uppercase font-bold opacity-60">Hari Bahagia Kami Akan Tiba Dalam:</span>
                <Countdown targetDate={initialData.event.event_date} />
              </motion.div>
            </section>
          )}

          {/* 8. LOCATION & MAPS SECTION */}
          <section className="w-full max-w-4xl px-6 py-24 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-14 text-center"
            >
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Lokasi Utama</h2>
              <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
            </motion.div>

            {eventsList[0] && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-full max-w-2xl bg-white/30 border p-6 rounded-3xl flex flex-col items-center shadow-xs"
                style={{ borderColor: `${theme.colors.primary}15` }}
              >
                <MapPin className="w-8 h-8 mb-4 animate-bounce" style={{ color: theme.colors.primary }} />
                <h4 className="text-xl font-bold text-center">{eventsList[0].location}</h4>
                <p className="text-xs text-center opacity-75 mt-1 leading-relaxed max-w-md">{eventsList[0].address}</p>

                {eventsList[0].google_maps_url && (
                  <div className="mt-6 w-full flex flex-col items-center">
                    {/* Maps embedded iframe fallback */}
                    <div className="w-full h-64 rounded-2xl overflow-hidden border shadow-sm mb-4">
                      <iframe 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(eventsList[0].location + " " + eventsList[0].address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy"
                      />
                    </div>
                    <a
                      href={eventsList[0].google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-colors inline-flex items-center gap-2 cursor-pointer border"
                      style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Buka di Google Maps
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </section>

          {/* 9. PREMIUM GALLERY */}
          {showGallery && (
            <section className="w-full max-w-4xl px-6 py-24 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-14 text-center"
              >
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Galeri Kebahagiaan</h2>
                <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
              </motion.div>

              {/* RENDER CUSTOM LAYOUT TYPES */}
              {galleryLayout === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {initialData.gallery.map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      onClick={() => setLightboxImage(item.image_url)}
                      className="aspect-square relative rounded-xl overflow-hidden shadow-xs hover:shadow-md cursor-zoom-in group border"
                      style={{ borderColor: `${theme.colors.primary}20` }}
                    >
                      <Image 
                        src={item.image_url} 
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {galleryLayout === 'masonry' && (
                (() => {
                  const columns: typeof initialData.gallery[] = [[], []];
                  initialData.gallery.forEach((item, idx) => {
                    columns[idx % 2].push(item);
                  });
                  return (
                    <div className="flex gap-4 w-full">
                      {columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex-1 flex flex-col gap-4">
                          {col.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              onClick={() => setLightboxImage(item.image_url)}
                              className="rounded-xl overflow-hidden cursor-zoom-in group border shadow-xs"
                              style={{ borderColor: `${theme.colors.primary}15` }}
                            >
                              <Image src={item.image_url} alt="" width={500} height={500} className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              {galleryLayout === 'pinterest' && (
                (() => {
                  const columns: typeof initialData.gallery[] = [[], [], []];
                  initialData.gallery.forEach((item, idx) => {
                    columns[idx % 3].push(item);
                  });
                  return (
                    <div className="flex gap-3 w-full">
                      {columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex-1 flex flex-col gap-3">
                          {col.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              onClick={() => setLightboxImage(item.image_url)}
                              className="rounded-lg overflow-hidden cursor-zoom-in group bg-white p-2 border shadow-xs"
                              style={{ borderColor: `${theme.colors.primary}15` }}
                            >
                              <Image src={item.image_url} alt="" width={500} height={500} className="w-full h-auto object-cover rounded-md" />
                              <p className="text-[10px] text-center mt-2 opacity-50 font-serif">Moment #{idx + 1}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              {galleryLayout === 'carousel' && (
                <div className="w-full max-w-lg relative aspect-square rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: `${theme.colors.primary}20` }}>
                  <Image 
                    src={initialData.gallery[carouselIndex].image_url} 
                    alt="" 
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-xs py-4 flex items-center justify-between px-6 text-white">
                    <button onClick={prevCarouselSlide} className="p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-semibold">{carouselIndex + 1} / {initialData.gallery.length}</span>
                    <button onClick={nextCarouselSlide} className="p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {galleryLayout === 'album' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {initialData.gallery.map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      onClick={() => setLightboxImage(item.image_url)}
                      className="bg-white p-3 rounded-2xl border shadow-md flex flex-col cursor-zoom-in"
                      style={{ borderColor: `${theme.colors.primary}15` }}
                    >
                      <div className="aspect-video w-full relative rounded-xl overflow-hidden">
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      </div>
                      <span className="text-xs font-bold text-center mt-3 uppercase tracking-widest opacity-60">Album Foto #{idx + 1}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {galleryLayout === 'scroll' && (
                <div className="w-full flex gap-4 overflow-x-auto snap-x py-4 pr-10 scrollbar-thin">
                  {initialData.gallery.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      onClick={() => setLightboxImage(item.image_url)}
                      className="snap-center shrink-0 w-64 aspect-square relative rounded-2xl overflow-hidden border shadow-sm cursor-zoom-in"
                      style={{ borderColor: `${theme.colors.primary}15` }}
                    >
                      <Image src={item.image_url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {galleryLayout === 'polaroid' && (
                <div className="flex flex-wrap gap-8 justify-center w-full">
                  {initialData.gallery.map((item, idx) => {
                    const tilt = idx % 2 === 0 ? '-2deg' : '2deg';
                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => setLightboxImage(item.image_url)}
                        className="bg-[#FCFAF7] border p-4 pb-8 rounded-xs shadow-lg w-52 cursor-zoom-in flex flex-col items-center hover:scale-105 active:scale-95 transition-transform"
                        style={{ 
                          transform: `rotate(${tilt})`,
                          borderColor: '#E5DFD3'
                        }}
                      >
                        <div className="aspect-square w-full relative bg-gray-100 overflow-hidden border border-gray-200">
                          <Image src={item.image_url} alt="" fill className="object-cover" />
                        </div>
                        <span className="text-center font-serif text-[#7C6B55] text-sm mt-4 tracking-wide font-classic-script">Happy Moment</span>
                      </div>
                    );
                  })}
                </div>
              )}

            </section>
          )}

          {/* 10. WEDDING GIFT SECTION */}
          {showGift && (
            <section className={`w-full max-w-lg px-6 py-24 rounded-3xl border shadow-sm my-8 relative ${theme.classes.cardBg}`}>
              <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
              
              <div className="text-center mb-10">
                <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                <h2 className={`text-3xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Kado Digital</h2>
                <p className="text-xs opacity-75 mt-2">Bagi Anda yang ingin mentransfer tanda kasih.</p>
              </div>

              <div className="flex flex-col gap-6 items-center w-full">
                {initialData.giftAccounts.map((gift, idx) => (
                  <motion.div
                    key={gift.id || idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full p-6 rounded-2xl bg-white border shadow-md relative overflow-hidden text-left"
                    style={{ borderColor: `${theme.colors.primary}20` }}
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-55">Rekening Transfer</span>
                    <h3 className="text-lg font-bold text-gray-800 mt-1">{gift.bank_name}</h3>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border mt-4" style={{ backgroundColor: `${theme.colors.primary}05`, borderColor: `${theme.colors.primary}20` }}>
                      <span className="font-mono text-sm sm:text-base font-bold text-gray-700 tracking-wider">
                        {gift.account_number}
                      </span>
                      <button
                        onClick={() => copyAccountNumber(gift.account_number, idx)}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-gray-400"
                        title="Copy"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {copiedIndex === idx && (
                      <span className="text-[10px] text-green-600 font-semibold absolute top-4 right-4">
                        Tersalin!
                      </span>
                    )}

                    <p className="text-xs text-gray-500 font-medium mt-3">a.n. {gift.account_holder}</p>

                    {gift.qris_image && (
                      <div className="mt-6 flex flex-col items-center border-t border-dashed pt-6" style={{ borderColor: `${theme.colors.primary}25` }}>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">QRIS Code</span>
                        <Image 
                          src={gift.qris_image} 
                          alt="QRIS Code"
                          width={160}
                          height={160}
                          className="object-contain border p-2 rounded-xl"
                          style={{ borderColor: `${theme.colors.primary}20` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 11. RSVP FORM SECTION */}
          {showRSVP && (
            <section className={`w-full max-w-2xl px-6 py-24 rounded-3xl my-8 border relative ${theme.classes.cardBg}`}>
              <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
              
              <div className="text-center mb-10">
                <Heart className="w-8 h-8 mx-auto mb-4 animate-pulse" style={{ color: theme.colors.primary }} />
                <h2 className={`text-3xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Konfirmasi Kehadiran</h2>
                <p className="text-xs opacity-75 mt-2">Silakan konfirmasi rencana kehadiran Anda.</p>
              </div>

              {rsvpSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border rounded-xl p-8 text-center"
                  style={{ backgroundColor: `${theme.colors.primary}05`, borderColor: `${theme.colors.primary}30` }}
                >
                  <Check className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                  <h3 className="text-lg font-bold">Konfirmasi Tersimpan!</h3>
                  <p className="text-sm mt-2 opacity-85">Terima kasih atas konfirmasi kehadiran Anda.</p>
                  <button 
                    onClick={() => setRsvpSuccess(false)}
                    className="mt-6 text-xs font-bold uppercase tracking-wider underline cursor-pointer"
                    style={{ color: theme.colors.primary }}
                  >
                    Kirim tanggapan baru
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleRsvpSubmit(onRSVPSubmit)} className="flex flex-col gap-5 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      {...registerRsvp('guest_name', { required: true })}
                      className={`w-full px-4 py-3 rounded-lg border text-sm ${theme.classes.input}`}
                      placeholder="Masukkan nama Anda"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Status Kehadiran</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center justify-center p-3 border rounded-lg cursor-pointer bg-white/50 hover:bg-gray-50/20 font-medium text-sm text-gray-700">
                        <input 
                          type="radio" 
                          value="true" 
                          className="mr-2 accent-indigo-500" 
                          {...registerRsvp('attendance')}
                          defaultChecked
                        />
                        Hadir
                      </label>
                      <label className="flex items-center justify-center p-3 border rounded-lg cursor-pointer bg-white/50 hover:bg-gray-50/20 font-medium text-sm text-gray-700">
                        <input 
                          type="radio" 
                          value="false" 
                          className="mr-2 accent-indigo-500" 
                          {...registerRsvp('attendance')}
                        />
                        Tidak Hadir
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Jumlah Tamu</label>
                    <select
                      {...registerRsvp('guest_count')}
                      className={`w-full px-4 py-3 rounded-lg border text-sm ${theme.classes.input}`}
                    >
                      <option value="1">1 Orang</option>
                      <option value="2">2 Orang</option>
                      <option value="3">3 Orang</option>
                      <option value="4">4 Orang</option>
                      <option value="5">5 Orang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Doa & Ucapan Restu</label>
                    <textarea
                      rows={4}
                      {...registerRsvp('message')}
                      className={`w-full px-4 py-3 rounded-lg border text-sm ${theme.classes.input}`}
                      placeholder="Ketik doa restu Anda..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className={`w-full py-3.5 rounded-full text-white font-bold text-xs tracking-widest uppercase hover:opacity-95 cursor-pointer flex items-center justify-center gap-2 ${theme.classes.button}`}
                  >
                    {rsvpSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* 12. LIVE GUESTBOOK ucapan list */}
          {showGuestbook && (
            <section className="w-full max-w-2xl px-6 py-24 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10 text-center"
              >
                <h2 className={`text-3xl font-bold tracking-wide ${theme.classes.heading} ${theme.fontHeading}`}>Doa & Ucapan Restu</h2>
                <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: theme.colors.primary }} />
              </motion.div>

              <form onSubmit={handleWishSubmit(onWishSubmit)} className={`w-full flex flex-col gap-4 p-6 rounded-2xl border shadow-xs mb-8 relative ${theme.classes.cardBg}`}>
                <CornerOrnament type={theme.ornaments.type} color={theme.colors.primary} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left relative z-10">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      {...registerWish('guest_name', { required: true })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm ${theme.classes.input}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Tulis ucapan selamat..."
                      {...registerWish('message', { required: true })}
                      className={`w-full flex-grow px-4 py-2.5 rounded-lg border text-sm ${theme.classes.input}`}
                    />
                    <button
                      type="submit"
                      disabled={guestbookSubmitting}
                      className="px-4 bg-gray-800 hover:bg-gray-950 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Guestbook Wishes List */}
              <div className="w-full flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                {wishesLoading ? (
                  <p className="text-xs text-gray-400 text-center py-4">Memuat ucapan...</p>
                ) : wishes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">Belum ada ucapan restu.</p>
                ) : (
                  wishes.map((wish, index) => (
                    <motion.div
                      key={wish.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white/60 border rounded-xl shadow-xs text-left"
                      style={{ borderColor: `${theme.colors.primary}10` }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold text-sm`} style={{ color: theme.colors.primary }}>{wish.guest_name}</span>
                        <span className="text-[10px] text-gray-400">
                          {wish.created_at ? new Date(wish.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'Baru saja'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-85">{wish.message}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* 13. FOOTER / PENUTUP */}
          <footer className="w-full text-center px-6 py-24 relative bg-black/5 mt-16 border-t" style={{ borderColor: `${theme.colors.primary}10` }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto flex flex-col items-center"
            >
              <Heart className="w-6 h-6 mb-6 fill-red-100" style={{ color: theme.colors.primary }} />
              <p className="text-sm leading-relaxed mb-6 italic opacity-80">
                {initialData.closingMessage || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.'}
              </p>

              <h3 className={`text-4xl font-bold tracking-wide mt-4 ${theme.classes.heading} ${theme.fontHeading}`}>
                {initialData.groom.namaPanggilan} & {initialData.bride.namaPanggilan}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-3">
                Terima Kasih Banyak
              </p>
            </motion.div>
          </footer>

          {/* GALLERY LIGHTBOX OVERLAY */}
          <AnimatePresence>
            {lightboxImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxImage(null)}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
              >
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-6 right-6 text-white/70 hover:text-white cursor-pointer bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="relative w-full h-[80vh] flex items-center justify-center">
                  <Image
                    src={lightboxImage}
                    alt="Enlarged view"
                    width={1600}
                    height={1200}
                    className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
