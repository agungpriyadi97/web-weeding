'use client';

import React, { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { WeddingData, RSVP, Guestbook } from '../types/wedding';
import Countdown from './Countdown';
import MusicPlayer from './MusicPlayer';
import { supabase } from '@/utils/supabaseClient';

interface InvitationPageProps {
  initialData: WeddingData;
  guestName: string | null;
}

interface ThemeStyles {
  bodyBg: string;
  cardBg: string;
  textColor: string;
  headingColor: string;
  accentText: string;
  accentBg: string;
  borderColor: string;
  fontFamily: string;
}

const themeStylesMap: Record<string, ThemeStyles> = {
  'elegant-gold': {
    bodyBg: 'bg-[#FDFBF7]',
    cardBg: 'bg-white border border-gold-100 shadow-sm',
    textColor: 'text-gray-700',
    headingColor: 'text-gold-600 font-serif font-bold',
    accentText: 'text-gold-500',
    accentBg: 'gold-bg-gradient',
    borderColor: 'border-gold-100',
    fontFamily: 'font-sans',
  },
  'elegant-white': {
    bodyBg: 'bg-white',
    cardBg: 'bg-gray-50/50 border border-gray-200 shadow-sm',
    textColor: 'text-gray-800',
    headingColor: 'text-gray-900 font-serif font-bold',
    accentText: 'text-gray-700',
    accentBg: 'bg-gray-900',
    borderColor: 'border-gray-200',
    fontFamily: 'font-sans',
  },
  'minimalist': {
    bodyBg: 'bg-[#FAFAFA]',
    cardBg: 'bg-white border border-slate-200 shadow-xs',
    textColor: 'text-slate-600',
    headingColor: 'text-slate-950 font-sans font-bold',
    accentText: 'text-slate-800',
    accentBg: 'bg-slate-900',
    borderColor: 'border-slate-200',
    fontFamily: 'font-sans',
  },
  'classic': {
    bodyBg: 'bg-[#FCF7ED]',
    cardBg: 'bg-[#FFFDF9] border border-red-100/60 shadow-sm',
    textColor: 'text-red-950/80',
    headingColor: 'text-red-900 font-serif font-bold',
    accentText: 'text-red-700',
    accentBg: 'bg-red-800',
    borderColor: 'border-red-100',
    fontFamily: 'font-serif',
  },
  'dark': {
    bodyBg: 'bg-[#111111] text-[#EDEDED]',
    cardBg: 'bg-[#1E1E1E] border border-gold-900/50 shadow-lg',
    textColor: 'text-gray-300',
    headingColor: 'gold-text-gradient font-serif font-bold',
    accentText: 'text-gold-400',
    accentBg: 'gold-bg-gradient',
    borderColor: 'border-gold-900/30',
    fontFamily: 'font-sans',
  },
  'luxury': {
    bodyBg: 'bg-[#070F2B] text-white',
    cardBg: 'bg-[#1B1A55]/40 border border-gold-400/30 shadow-xl',
    textColor: 'text-blue-100',
    headingColor: 'gold-text-gradient font-serif font-bold',
    accentText: 'text-gold-300',
    accentBg: 'gold-bg-gradient',
    borderColor: 'border-gold-300/20',
    fontFamily: 'font-sans',
  },
};

export default function InvitationPage({ initialData, guestName }: InvitationPageProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [wishes, setWishes] = useState<Guestbook[]>([]);
  const [wishesLoading, setWishesLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);

  // Active styles based on theme configured in DB
  const currentThemeKey = initialData.event.theme || 'elegant-gold';
  const styles = themeStylesMap[currentThemeKey] || themeStylesMap['elegant-gold'];

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

    // 2. Fetch approved guestbook comments
    const fetchWishes = async () => {
      try {
        const res = await fetch('/api/guestbook');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filters to approved only on frontend as fallback
          setWishes(data.filter((w: Guestbook) => w.is_approved));
        }
      } catch (err) {
        console.error('Failed to load guestbook:', err);
      } finally {
        setWishesLoading(false);
      }
    };

    fetchWishes();

    // 3. Setup real-time updates for guestbook
    if (supabase) {
      const channel = supabase
        .channel('realtime-guestbook-wall')
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

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (initialData.event.enable_music) {
      setPlayMusic(true);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
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
  const getGoogleCalendarUrl = () => {
    if (!initialData.event.event_date) return '';
    const dateStr = initialData.event.event_date.replace(/-/g, '');
    const title = encodeURIComponent(`Pernikahan ${initialData.event.groom_nickname} & ${initialData.event.bride_nickname}`);
    const details = encodeURIComponent(`Bergabunglah merayakan hari bahagia kami di ${initialData.event.location}.`);
    const location = encodeURIComponent(initialData.event.address);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T090000/${dateStr}T150000&details=${details}&location=${location}`;
  };

  // Feature Toggles and content validation helpers
  const showMusic = initialData.event.enable_music;
  const showCountdown = initialData.event.enable_countdown;
  const showGallery = initialData.event.enable_guestbook && initialData.gallery && initialData.gallery.length > 0;
  const showRSVP = initialData.event.enable_rsvp;
  const showGuestbook = initialData.event.enable_guestbook;
  const showGift = initialData.event.enable_gift && initialData.giftAccounts && initialData.giftAccounts.length > 0;

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

  return (
    <div className={`relative overflow-x-hidden min-h-screen ${styles.bodyBg} ${styles.fontFamily}`}>
      {/* Dynamic Background Custom Image if uploaded */}
      {initialData.event.background_image && (
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none z-0"
          style={{ backgroundImage: `url("${initialData.event.background_image}")` }}
        />
      )}

      {/* Background audio floating widget */}
      {showMusic && (
        <MusicPlayer play={playMusic} audioUrl={initialData.event.music_url} />
      )}

      {/* 1. COVER PAGE LAYER */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-50 flex flex-col justify-between items-center text-center px-6 py-12 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.45)), url("${
                initialData.event.hero_image || '/images/cover.png'
              }")`,
            }}
          >
            <div className="mt-8">
              <span className="text-white/80 font-medium uppercase tracking-widest text-xs">Undangan Pernikahan</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white font-semibold tracking-wide mt-4">
                {initialData.groom.namaPanggilan} & {initialData.bride.namaPanggilan}
              </h1>
            </div>

            <div className="flex flex-col items-center gap-6 max-w-md w-full bg-black/30 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
              {guestName ? (
                <div className="text-white">
                  <p className="text-xs text-white/70 font-medium tracking-wide">Kepada Yth. Bapak/Ibu/Saudara/i:</p>
                  <p className="text-xl sm:text-2xl font-serif font-bold text-gold-300 mt-2">{guestName}</p>
                </div>
              ) : (
                <p className="text-sm text-white/90 font-medium tracking-wide">
                  Kami mengundang Anda untuk bergabung merayakan hari bahagia kami.
                </p>
              )}

              <button
                onClick={handleOpenInvitation}
                className="w-full sm:w-auto px-8 py-3 rounded-full gold-bg-gradient text-white font-semibold text-sm tracking-widest uppercase hover:scale-105 transition-all shadow-lg hover:shadow-gold-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white animate-pulse" />
                Buka Undangan
              </button>
            </div>

            <div className="text-white/70 text-xs sm:text-sm font-medium tracking-wider">
              {formatIndoDate(initialData.event.event_date)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WEDDING INVITATION VIEW */}
      {isOpened && (
        <div className="w-full min-h-screen flex flex-col items-center relative z-10">
          <div className="w-full h-1.5 gold-bg-gradient fixed top-0 left-0 z-40" />

          {/* 2. HERO PAGE */}
          <section className="min-h-screen w-full flex flex-col justify-center items-center text-center px-6 py-20 relative bg-cover bg-center"
            style={initialData.event.hero_image ? {
              backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.9), rgba(253, 251, 247, 0.9)), url("${initialData.event.hero_image}")`,
            } : {}}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="max-w-2xl mx-auto flex flex-col items-center"
            >
              <Heart className="text-gold-500 w-8 h-8 mb-6 fill-gold-100" />
              <span className="text-xs uppercase tracking-widest text-gold-600 font-bold mb-4">Maha Suci Allah</span>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed italic max-w-lg mb-8">
                &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenis-mu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang.&rdquo;
                <span className="block mt-2 font-semibold not-italic text-gold-700 text-xs">(Ar-Rum: 21)</span>
              </p>

              <h2 className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-wide my-6 ${styles.headingColor}`}>
                {initialData.groom.namaPanggilan} & {initialData.bride.namaPanggilan}
              </h2>

              {showCountdown && (
                <>
                  <p className="text-[10px] sm:text-xs text-gold-800/80 tracking-widest uppercase font-semibold mt-2">KAMI AKAN MENIKAH DALAM:</p>
                  <Countdown targetDate={initialData.event.event_date} />
                </>
              )}

              <p className="text-xs sm:text-sm font-semibold text-gray-500 tracking-wider mt-4">
                {formatIndoDate(initialData.event.event_date)}
              </p>
            </motion.div>
          </section>

          {/* 3. COUPLE DETAILS SECTION */}
          <section className={`w-full max-w-4xl px-6 py-24 flex flex-col items-center text-center rounded-3xl my-8 ${styles.cardBg}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${styles.headingColor}`}>Mempelai Pernikahan</h2>
              <div className="w-12 h-0.5 gold-bg-gradient mx-auto mt-4" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 w-full max-w-3xl">
              {/* Groom Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center p-6 rounded-2xl border border-gold-100/50 bg-[#FDFCF9]/50 shadow-xs"
              >
                {initialData.event.groom_image ? (
                  <img 
                    src={initialData.event.groom_image} 
                    alt={initialData.groom.namaLengkap} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gold-300 mb-6 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gold-50 border border-gold-300 rounded-full flex items-center justify-center mb-6 text-gold-600 text-3xl font-serif font-bold">
                    H
                  </div>
                )}
                <h3 className="text-2xl font-serif font-semibold text-gold-600">{initialData.groom.namaLengkap}</h3>
                <p className="text-xs text-gold-700/80 font-medium tracking-wide uppercase mt-1">Mempelai Pria</p>
                
                {(initialData.groom.fatherName || initialData.groom.motherName) && (
                  <div className="text-sm text-gray-600 mt-6 pt-4 border-t border-dashed border-gold-200/50 w-full flex flex-col items-center gap-3">
                    <p className="font-medium text-xs text-gray-400 uppercase tracking-wider">Putra tercinta dari:</p>
                    
                    <div className="flex gap-4 items-center justify-center">
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'groom')?.father_photo && (
                          <img 
                            src={initialData.parents.find(p => p.type === 'groom')?.father_photo} 
                            alt="Father" 
                            className="w-12 h-12 rounded-full object-cover border border-gold-200 mb-1 mx-auto"
                          />
                        )}
                        <p className="font-serif text-gray-800 text-xs sm:text-sm">Ayah: {initialData.groom.fatherName || '-'}</p>
                      </div>
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'groom')?.mother_photo && (
                          <img 
                            src={initialData.parents.find(p => p.type === 'groom')?.mother_photo} 
                            alt="Mother" 
                            className="w-12 h-12 rounded-full object-cover border border-gold-200 mb-1 mx-auto"
                          />
                        )}
                        <p className="font-serif text-gray-800 text-xs sm:text-sm">Ibu: {initialData.groom.motherName || '-'}</p>
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
                className="flex flex-col items-center p-6 rounded-2xl border border-gold-100/50 bg-[#FDFCF9]/50 shadow-xs"
              >
                {initialData.event.bride_image ? (
                  <img 
                    src={initialData.event.bride_image} 
                    alt={initialData.bride.namaLengkap} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gold-300 mb-6 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gold-50 border border-gold-300 rounded-full flex items-center justify-center mb-6 text-gold-600 text-3xl font-serif font-bold">
                    I
                  </div>
                )}
                <h3 className="text-2xl font-serif font-semibold text-gold-600">{initialData.bride.namaLengkap}</h3>
                <p className="text-xs text-gold-700/80 font-medium tracking-wide uppercase mt-1">Mempelai Wanita</p>

                {(initialData.bride.fatherName || initialData.bride.motherName) && (
                  <div className="text-sm text-gray-600 mt-6 pt-4 border-t border-dashed border-gold-200/50 w-full flex flex-col items-center gap-3">
                    <p className="font-medium text-xs text-gray-400 uppercase tracking-wider">Putri tercinta dari:</p>
                    
                    <div className="flex gap-4 items-center justify-center">
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'bride')?.father_photo && (
                          <img 
                            src={initialData.parents.find(p => p.type === 'bride')?.father_photo} 
                            alt="Father" 
                            className="w-12 h-12 rounded-full object-cover border border-gold-200 mb-1 mx-auto"
                          />
                        )}
                        <p className="font-serif text-gray-800 text-xs sm:text-sm">Ayah: {initialData.bride.fatherName || '-'}</p>
                      </div>
                      <div className="text-center">
                        {initialData.parents.find(p => p.type === 'bride')?.mother_photo && (
                          <img 
                            src={initialData.parents.find(p => p.type === 'bride')?.mother_photo} 
                            alt="Mother" 
                            className="w-12 h-12 rounded-full object-cover border border-gold-200 mb-1 mx-auto"
                          />
                        )}
                        <p className="font-serif text-gray-800 text-xs sm:text-sm">Ibu: {initialData.bride.motherName || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          {/* 4. OUR STORY TIMELINE */}
          {initialData.event.story_meet && (
            <section className="w-full max-w-4xl px-6 py-24 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12 text-center"
              >
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${styles.headingColor}`}>Kisah Cinta Kami</h2>
                <div className="w-12 h-0.5 gold-bg-gradient mx-auto mt-4" />
              </motion.div>

              <div className="relative border-l-2 border-gold-200 max-w-lg mx-auto flex flex-col gap-12 py-4">
                {initialData.event.story_meet && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative pl-8"
                  >
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full gold-bg-gradient border-2 border-white" />
                    <h3 className="text-lg font-serif font-bold text-gold-600">Awal Bertemu</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-2">{initialData.event.story_meet}</p>
                  </motion.div>
                )}

                {initialData.event.story_proposal && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative pl-8"
                  >
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full gold-bg-gradient border-2 border-white" />
                    <h3 className="text-lg font-serif font-bold text-gold-600">Lamaran</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-2">{initialData.event.story_proposal}</p>
                  </motion.div>
                )}

                {initialData.event.story_marriage && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative pl-8"
                  >
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full gold-bg-gradient border-2 border-white" />
                    <h3 className="text-lg font-serif font-bold text-gold-600">Cerita Singkat Hingga Menikah</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-2">{initialData.event.story_marriage}</p>
                  </motion.div>
                )}
              </div>
            </section>
          )}

          {/* 5. EVENT DETAIL ACARA */}
          <section className={`w-full max-w-4xl px-6 py-24 flex flex-col items-center rounded-3xl my-8 ${styles.cardBg}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${styles.headingColor}`}>Detail Acara</h2>
              <div className="w-12 h-0.5 gold-bg-gradient mx-auto mt-4" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/40 border border-gold-100/50 shadow-xs"
              >
                <Clock className="w-8 h-8 text-gold-500 mb-4" />
                <h3 className="text-2xl font-serif font-bold text-gold-600 mb-2">Akad Nikah</h3>
                <div className="w-8 h-px bg-gold-200 my-2" />
                <p className="text-sm font-semibold text-gray-700">{formatIndoDate(initialData.event.event_date)}</p>
                <p className="text-sm text-gray-500 mt-1">{initialData.event.event_time}</p>
                
                {/* Google Calendar Link Integration */}
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 px-5 py-2 rounded-full bg-gold-500 text-white font-bold text-xs tracking-wider uppercase hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Simpan Kalender
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/40 border border-gold-100/50 shadow-xs"
              >
                <MapPin className="w-8 h-8 text-gold-500 mb-4" />
                <h3 className="text-2xl font-serif font-bold text-gold-600 mb-2">Lokasi Acara</h3>
                <div className="w-8 h-px bg-gold-200 my-2" />
                <p className="text-sm font-bold text-gray-800">{initialData.event.location}</p>
                <p className="text-xs text-gray-500 mt-1 px-4 leading-relaxed">{initialData.event.address}</p>

                {initialData.event.google_maps && (
                  <div className="mt-5 flex flex-col items-center w-full gap-4">
                    {/* Google Maps embed preview link or map preview container */}
                    <a
                      href={initialData.event.google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 rounded-full border border-gold-400 hover:bg-gold-50/20 text-gold-600 font-semibold text-xs tracking-wider uppercase transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Lihat Peta Lokasi
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          {/* 6. PHOTO GALLERY GRID */}
          {showGallery && (
            <section className="w-full max-w-4xl px-6 py-24 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12 text-center"
              >
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-wide ${styles.headingColor}`}>Galeri Prewedding</h2>
                <div className="w-12 h-0.5 gold-bg-gradient mx-auto mt-4" />
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {initialData.gallery.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    onClick={() => setLightboxImage(item.image_url)}
                    className="aspect-square relative rounded-xl overflow-hidden shadow-xs hover:shadow-md cursor-zoom-in group border border-gold-100/30"
                  >
                    <img 
                      src={item.image_url} 
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white/80" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 7. RSVP REGISTRY FORM */}
          {showRSVP && (
            <section className={`w-full max-w-2xl px-6 py-24 rounded-3xl my-8 border border-gold-50/50 shadow-sm ${styles.cardBg}`}>
              <div className="text-center mb-10">
                <Heart className="w-8 h-8 text-gold-500 mx-auto mb-4" />
                <h2 className={`text-3xl font-bold tracking-wide ${styles.headingColor}`}>Konfirmasi RSVP</h2>
                <p className="text-xs text-gray-500 mt-2">Silakan konfirmasi rencana kehadiran Anda.</p>
              </div>

              {rsvpSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gold-50/40 border border-gold-200 rounded-xl p-8 text-center text-gold-800"
                >
                  <Check className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold font-serif">Konfirmasi Tersimpan!</h3>
                  <p className="text-sm mt-2">Terima kasih atas konfirmasi kehadiran Anda.</p>
                  <button 
                    onClick={() => setRsvpSuccess(false)}
                    className="mt-6 text-xs font-bold uppercase tracking-wider text-gold-600 underline cursor-pointer"
                  >
                    Kirim tanggapan baru
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleRsvpSubmit(onRSVPSubmit)} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      {...registerRsvp('guest_name', { required: true })}
                      className="w-full px-4 py-3 rounded-lg border border-gold-200 focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white/50 text-sm text-gray-700"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1.5">Status Kehadiran</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center justify-center p-3 border border-gold-200 rounded-lg cursor-pointer bg-white/55 hover:bg-gold-50/20 font-medium text-sm text-gray-700">
                        <input 
                          type="radio" 
                          value="true" 
                          className="mr-2 accent-gold-500" 
                          {...registerRsvp('attendance')}
                          defaultChecked
                        />
                        Hadir
                      </label>
                      <label className="flex items-center justify-center p-3 border border-gold-200 rounded-lg cursor-pointer bg-white/55 hover:bg-gold-50/20 font-medium text-sm text-gray-700">
                        <input 
                          type="radio" 
                          value="false" 
                          className="mr-2 accent-gold-500" 
                          {...registerRsvp('attendance')}
                        />
                        Tidak Hadir
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1.5">Jumlah Tamu</label>
                    <select
                      {...registerRsvp('guest_count')}
                      className="w-full px-4 py-3 rounded-lg border border-gold-200 focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white/50 text-sm text-gray-600"
                    >
                      <option value="1">1 Orang</option>
                      <option value="2">2 Orang</option>
                      <option value="3">3 Orang</option>
                      <option value="4">4 Orang</option>
                      <option value="5">5 Orang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1.5">Doa & Ucapan Restu</label>
                    <textarea
                      rows={4}
                      {...registerRsvp('message')}
                      className="w-full px-4 py-3 rounded-lg border border-gold-200 focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white/50 text-sm text-gray-700"
                      placeholder="Ketik doa restu Anda..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className="w-full py-3.5 rounded-full gold-bg-gradient text-white font-bold text-sm tracking-widest uppercase hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {rsvpSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* 8. LIVE GUESTBOOK mesaj list */}
          {showGuestbook && (
            <section className="w-full max-w-2xl px-6 py-24 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10 text-center"
              >
                <h2 className={`text-3xl font-bold tracking-wide ${styles.headingColor}`}>Doa & Ucapan Restu</h2>
                <div className="w-12 h-0.5 gold-bg-gradient mx-auto mt-4" />
              </motion.div>

              <form onSubmit={handleWishSubmit(onWishSubmit)} className={`w-full flex flex-col gap-4 p-6 rounded-2xl border border-gold-50/50 shadow-xs mb-8 ${styles.cardBg}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      {...registerWish('guest_name', { required: true })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gold-200 bg-white/55 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Tulis ucapan selamat..."
                      {...registerWish('message', { required: true })}
                      className="w-full flex-grow px-4 py-2.5 rounded-lg border border-gold-200 bg-white/55 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={guestbookSubmitting}
                      className="px-4 bg-gold-500 hover:bg-gold-600 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Guestbook list display */}
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
                      className="p-4 bg-white/60 border border-gold-50/50 rounded-xl shadow-xs text-left"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-serif font-bold text-gold-700 text-sm">{wish.guest_name}</span>
                        <span className="text-[10px] text-gray-400">
                          {wish.created_at ? new Date(wish.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'Baru saja'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{wish.message}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* 9. DIGITAL ENVELOPE SEC */}
          {showGift && (
            <section className={`w-full max-w-lg px-6 py-24 rounded-3xl border shadow-sm my-8 ${styles.cardBg}`}>
              <div className="text-center mb-10">
                <Heart className="w-8 h-8 text-gold-500 mx-auto mb-4" />
                <h2 className={`text-3xl font-bold tracking-wide ${styles.headingColor}`}>Kado Digital & Angpau</h2>
                <p className="text-xs text-gray-500 mt-2">Bagi Anda yang ingin mentransfer tanda kasih.</p>
              </div>

              <div className="flex flex-col gap-6 items-center">
                {initialData.giftAccounts.map((gift, idx) => (
                  <motion.div
                    key={gift.id || idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full max-w-sm p-6 rounded-2xl bg-white border border-gold-200/50 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold-50/30 rounded-full -mr-8 -mt-8 pointer-events-none" />
                    
                    <span className="text-xs font-bold text-gold-600 tracking-wider uppercase">Rekening Transfer</span>
                    <h3 className="text-lg font-serif font-bold text-gray-800 mt-2">{gift.bank_name}</h3>
                    
                    <div className="flex items-center justify-between bg-gold-50/15 p-3 rounded-lg border border-gold-100 mt-4">
                      <span className="font-mono text-sm sm:text-base font-bold text-gray-700 tracking-wider">
                        {gift.account_number}
                      </span>
                      <button
                        onClick={() => copyAccountNumber(gift.account_number, idx)}
                        className="p-2 rounded-md hover:bg-gold-100/50 text-gold-500 transition-colors cursor-pointer"
                        title="Copy Account Number"
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
                      <div className="mt-6 flex flex-col items-center border-t border-dashed border-gold-200/60 pt-6">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">QRIS Digital</span>
                        <img 
                          src={gift.qris_image} 
                          alt="QRIS Code"
                          className="w-40 h-40 object-contain border border-gold-100 p-2 rounded-xl"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 10. PENUTUP GREETING */}
          <footer className="w-full text-center px-6 py-20 relative bg-black/5 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto flex flex-col items-center"
            >
              <Heart className="w-6 h-6 text-gold-500 mb-6 fill-gold-100" />
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {initialData.closingMessage}
              </p>

              <h3 className={`text-4xl font-bold tracking-wide mt-4 ${styles.headingColor}`}>
                {initialData.groom.namaPanggilan} & {initialData.bride.namaPanggilan}
              </h3>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2">
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
                <motion.img
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  src={lightboxImage}
                  alt="Enlarged view"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
