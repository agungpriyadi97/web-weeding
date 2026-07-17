'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Settings, 
  Users, 
  Image as ImageIcon, 
  BookOpen, 
  Heart, 
  Calendar, 
  CreditCard, 
  LogOut, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Layers,
  Save,
  UserCheck,
  Upload,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Printer,
  Grid,
  X,
  Music,
  MessageSquare
} from 'lucide-react';
import { WeddingData, RSVP, Guestbook, Guest, EventDetail, ParentDetail, GiftAccount, AnalyticsLog, MempelaiDetail } from '@/types/wedding';
import { supabase } from '@/utils/supabaseClient';

// Premium subcomponents
import ThemeGallery from '@/components/admin/ThemeGallery';
import LoveStoryManager from '@/components/admin/LoveStoryManager';
import EventManager from '@/components/admin/EventManager';
import WhatsAppTemplateManager from '@/components/admin/WhatsAppTemplateManager';


export default function AdminDashboard() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App data states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info' | 'parents' | 'gallery' | 'gifts' | 'rsvps' | 'wishes' | 'guests' | 'theme' | 'settings' | 'music' | 'love_story' | 'events' | 'whatsapp'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);
  
  // Lists
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [wishes, setWishes] = useState<Guestbook[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<AnalyticsLog[]>([]);

  // Search & Filter states
  const [rsvpSearch, setRsvpSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'hadir' | 'absen'>('all');
  const [wishSearch, setWishSearch] = useState('');
  const [wishFilter, setWishFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [guestSearch, setGuestSearch] = useState('');

  // Bulk actions selection sets
  // Link copied states
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [qrCodeModalUrl, setQrCodeModalUrl] = useState<string | null>(null);

  // Form states for updates
  const [infoForm, setInfoForm] = useState<Partial<EventDetail>>({});
  const [parentsList, setParentsList] = useState<ParentDetail[]>([]);
  const [giftsList, setGiftsList] = useState<GiftAccount[]>([]);
  
  // New item inputs
  const [newGuestName, setNewGuestName] = useState('');

  // Guest inline editing states
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState('');
  
  // Custom theme editor state
  const [selectedTheme, setSelectedTheme] = useState('elegant-gold');

  // Status notifications
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load Admin Data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch Wedding Details
      const dataRes = await fetch('/api/wedding-data');
      const dataJson = await dataRes.json();
      
      if (dataJson.error) {
        console.error('API Error in wedding-data:', dataJson.error);
        setWeddingData({
          groom: {} as MempelaiDetail,
          bride: {} as MempelaiDetail,
          event: {} as EventDetail,
          parents: [],
          gallery: [],
          giftAccounts: [],
          guests: [],
          closingMessage: ''
        });
      } else {
        const mappedData: WeddingData = {
          groom: {
            namaLengkap: dataJson.info?.groom_name || '',
            namaPanggilan: dataJson.info?.groom_nickname || '',
            fatherName: dataJson.parents?.find((p: ParentDetail) => p.type === 'groom')?.father_name,
            motherName: dataJson.parents?.find((p: ParentDetail) => p.type === 'groom')?.mother_name,
            fatherPhoto: dataJson.parents?.find((p: ParentDetail) => p.type === 'groom')?.father_photo,
            motherPhoto: dataJson.parents?.find((p: ParentDetail) => p.type === 'groom')?.mother_photo,
          },
          bride: {
            namaLengkap: dataJson.info?.bride_name || '',
            namaPanggilan: dataJson.info?.bride_nickname || '',
            fatherName: dataJson.parents?.find((p: ParentDetail) => p.type === 'bride')?.father_name,
            motherName: dataJson.parents?.find((p: ParentDetail) => p.type === 'bride')?.mother_name,
            fatherPhoto: dataJson.parents?.find((p: ParentDetail) => p.type === 'bride')?.father_photo,
            motherPhoto: dataJson.parents?.find((p: ParentDetail) => p.type === 'bride')?.mother_photo,
          },
          event: dataJson.info || {},
          parents: dataJson.parents || [],
          gallery: dataJson.gallery || [],
          giftAccounts: dataJson.giftAccounts || [],
          guests: dataJson.guests || [],
          closingMessage: dataJson.info?.closing_message || '',
          loveStories: dataJson.loveStories || [],
          events: dataJson.events || [],
          whatsappTemplates: dataJson.whatsappTemplates || [],
          themeSettings: dataJson.themeSettings,
        };
        setWeddingData(mappedData);
        
        if (dataJson.info) {
          const infoWithDefaults = {
            enable_music: true,
            enable_countdown: true,
            enable_guestbook: true,
            enable_rsvp: true,
            enable_gift: true,
            maintenance_mode: false,
            ...dataJson.info
          };
          setInfoForm(infoWithDefaults);
          setSelectedTheme(dataJson.info.theme || 'elegant-gold');
        }
        
        if (Array.isArray(dataJson.parents)) {
          setParentsList(dataJson.parents);
        }
        
        if (Array.isArray(dataJson.giftAccounts)) {
          setGiftsList(dataJson.giftAccounts);
        }
      }
      
      // Fetch RSVPs
      const rsvpRes = await fetch('/api/rsvp');
      const rsvpsJson = await rsvpRes.json();
      if (Array.isArray(rsvpsJson)) {
        setRsvps(rsvpsJson);
      } else {
        console.error('RSVP API Error:', rsvpsJson?.error || 'Invalid response');
        setRsvps([]);
      }

      // Fetch Wishes (All, including unapproved for administration)
      const wishRes = await fetch('/api/guestbook?all=true');
      const wishesJson = await wishRes.json();
      if (Array.isArray(wishesJson)) {
        setWishes(wishesJson);
      } else {
        console.error('Guestbook API Error:', wishesJson?.error || 'Invalid response');
        setWishes([]);
      }

      // Fetch Analytics logs
      const analyticsRes = await fetch('/api/analytics');
      const analyticsJson = await analyticsRes.json();
      if (Array.isArray(analyticsJson)) {
        setAnalyticsLogs(analyticsJson);
      } else {
        setAnalyticsLogs([]);
      }

    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    loadData();

    const rsvpChannel = supabase
      .channel('realtime-rsvp-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvp' }, () => {
        loadData();
      })
      .subscribe();

    const guestbookChannel = supabase
      .channel('realtime-guestbook-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook' }, () => {
        loadData();
      })
      .subscribe();

    const infoChannel = supabase
      .channel('realtime-wedding-info-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wedding_info' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rsvpChannel);
      supabase.removeChannel(guestbookChannel);
      supabase.removeChannel(infoChannel);
    };
  }, [isLoggedIn]);

  // Handle local authentication bypass
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'adminpassword') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Kredensial salah. Gunakan admin / adminpassword');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // Upload handler wrapper calling api
  const uploadFile = async (file: File, bucket: string, field?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (field) {
      formData.append('field', field);
    }
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const json = await res.json();
    return json.url;
  };

  // Trigger file upload and set field path
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: string, field: string, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaveStatus('saving');
      const url = await uploadFile(file, bucket, field);
      callback(url);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
      loadData();
    } catch (err) {
      console.error('File upload error:', err);
      setSaveStatus('error');
    }
  };

  // Submit Wedding Settings & Info
  const handleSaveInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus('saving');
    try {
      const payload = {
        info: {
          ...infoForm,
          theme: selectedTheme
        },
        parents: parentsList,
        giftAccounts: giftsList
      };

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // -------------------------------------------------------------
  // GALLERY MANAGEMENT
  // -------------------------------------------------------------
  const handleAddGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !weddingData) return;
    
    setSaveStatus('saving');
    try {
      const urls: string[] = [];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!validTypes.includes(file.type)) {
          alert(`File ${file.name} tidak valid. Hanya JPG, PNG, WEBP.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} melebihi batas 10MB.`);
          continue;
        }
        const url = await uploadFile(file, 'gallery');
        urls.push(url);
      }

      if (urls.length === 0) {
        setSaveStatus('idle');
        return;
      }

      // Append new gallery items
      const startOrder = weddingData.gallery.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
      const newItems = urls.map((url, idx) => ({
        image_url: url,
        sort_order: startOrder + idx
      }));

      const updatedGallery = [...weddingData.gallery, ...newItems];

      // Save changes
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: infoForm,
          gallery: updatedGallery
        })
      });

      if (res.ok) {
        setSaveStatus('success');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleDeleteGalleryItem = async (imageUrl: string) => {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    setSaveStatus('saving');
    try {
      if (weddingData) {
        const updated = weddingData.gallery.filter(item => item.image_url !== imageUrl);
        const res = await fetch('/api/wedding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gallery: updated
          })
        });
        if (res.ok) {
          setSaveStatus('success');
          loadData();
        } else {
          setSaveStatus('error');
        }
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleSortGalleryItem = async (index: number, direction: 'left' | 'right') => {
    if (!weddingData) return;
    const gallery = [...weddingData.gallery];
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === gallery.length - 1) return;

    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    const temp = gallery[index];
    gallery[index] = gallery[targetIdx];
    gallery[targetIdx] = temp;

    // Reset sort_order fields
    gallery.forEach((item, idx) => {
      item.sort_order = idx;
    });

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery
        })
      });
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3' && !file.name.endsWith('.mp3')) {
      alert('File tidak valid. Hanya mendukung format MP3.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 20MB.');
      return;
    }

    setSaveStatus('saving');
    try {
      const url = await uploadFile(file, 'music');
      
      const updatedInfo = { ...infoForm, music_url: url };
      setInfoForm(updatedInfo);

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: updatedInfo
        }),
      });

      if (res.ok) {
        setSaveStatus('success');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleDeleteMusic = async () => {
    if (!confirm('Hapus musik latar ini?')) return;
    setSaveStatus('saving');
    try {
      const updatedInfo = { ...infoForm, music_url: '' };
      setInfoForm(updatedInfo);

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: updatedInfo
        }),
      });

      if (res.ok) {
        setSaveStatus('success');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // -------------------------------------------------------------
  // GIFT ACCOUNTS MANAGEMENT
  // -------------------------------------------------------------
  const handleAddGiftAccount = () => {
    const nextOrder = giftsList.reduce((max, a) => Math.max(max, a.sort_order), 0) + 1;
    const newAccount: GiftAccount = {
      bank_name: 'BCA',
      account_number: '',
      account_holder: '',
      qris_image: '',
      sort_order: nextOrder
    };
    setGiftsList([...giftsList, newAccount]);
  };

  const handleUpdateGiftField = (index: number, field: keyof GiftAccount, value: string | number) => {
    const updated = [...giftsList];
    updated[index] = { ...updated[index], [field]: value };
    setGiftsList(updated);
  };

  const handleDeleteGiftAccount = (index: number) => {
    if (!confirm('Hapus rekening bank ini?')) return;
    const updated = giftsList.filter((_, i) => i !== index);
    setGiftsList(updated);
  };

  const handleSortGifts = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === giftsList.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...giftsList];
    
    // Swap items
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Reset sort_order indexes
    updated.forEach((acc, idx) => {
      acc.sort_order = idx;
    });

    setGiftsList(updated);
  };

  // -------------------------------------------------------------
  // RSVP ACTIONS
  // -------------------------------------------------------------
  const handleDeleteRSVPItem = async (id: string) => {
    if (!confirm('Hapus tanggapan RSVP ini?')) return;
    try {
      await fetch(`/api/rsvp?id=${id}`, { method: 'DELETE' }); // Simulating delete query param
      // Note: local db deletion wrapper
      const rsvpRes = await fetch('/api/rsvp');
      const data = await rsvpRes.json();
      setRsvps(data);
      alert('Tanggapan RSVP berhasil dihapus.');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };



  const handleExportRsvpsToCSV = () => {
    let csv = 'Nama Tamu,Kehadiran,Jumlah Tamu,Pesan,Waktu\n';
    rsvps.forEach(r => {
      csv += `"${r.guest_name}","${r.attendance ? 'Hadir' : 'Tidak Hadir'}",${r.guest_count},"${(r.message || '').replace(/"/g, '""')}","${r.created_at || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'rsvp_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRSVPs = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // -------------------------------------------------------------
  // GUESTBOOK ACTIONS
  // -------------------------------------------------------------
  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_approved: !currentStatus
        })
      });
      // Toggle locally
      setWishes(wishes.map(w => w.id === id ? { ...w, is_approved: !currentStatus } : w));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWish = async (id: string) => {
    if (!confirm('Hapus pesan ini dari guestbook?')) return;
    try {
      const res = await fetch(`/api/guestbook?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWishes(wishes.filter(w => w.id !== id));
      } else {
        alert('Gagal menghapus pesan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus pesan.');
    }
  };

  const handleExportWishesToCSV = () => {
    let csv = 'Nama Tamu,Doa / Ucapan,Status,Waktu\n';
    wishes.forEach(w => {
      csv += `"${w.guest_name}","${w.message.replace(/"/g, '""')}","${w.is_approved ? 'Disetujui' : 'Disembunyikan'}","${w.created_at || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'guestbook_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // GUEST REGISTRY ACTIONS
  // -------------------------------------------------------------
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName || !weddingData) return;

    const slug = newGuestName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newGuest = { guest_name: newGuestName, slug };
    const updatedGuests = [...weddingData.guests, newGuest];

    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guests: updatedGuests
        })
      });
      if (res.ok) {
        setNewGuestName('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGuest = async (id: string) => {
    if (!editingGuestName.trim() || !weddingData) return;
    const slug = editingGuestName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const updated = weddingData.guests.map(g => g.id === id ? { ...g, guest_name: editingGuestName, slug } : g);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guests: updated
        })
      });
      if (res.ok) {
        setSaveStatus('success');
        setEditingGuestId(null);
        setTimeout(() => setSaveStatus('idle'), 2500);
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleDeleteGuestItem = async (id: string) => {
    if (!confirm('Hapus tamu ini dari registrasi?')) return;
    try {
      if (weddingData) {
        const updated = weddingData.guests.filter(g => g.id !== id);
        const res = await fetch('/api/wedding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guests: updated
          })
        });
        if (res.ok) {
          loadData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyGuestInviteLink = (guest: Guest, id: string, type: 'copy_link' | 'copy_text' | 'whatsapp') => {
    if (typeof window !== 'undefined') {
      const inviteUrl = `${window.location.protocol}//${window.location.host}/invite/${guest.slug}`;
      if (type === 'copy_link') {
        navigator.clipboard.writeText(inviteUrl);
        setCopiedGuestId(`link-${id}`);
        setTimeout(() => setCopiedGuestId(null), 2500);
        return;
      }

      const groomNick = weddingData?.event?.groom_nickname || 'Hery';
      const brideNick = weddingData?.event?.bride_nickname || 'Bella';
      
      const activeTemplate = weddingData?.whatsappTemplates?.find(t => t.id === weddingData?.themeSettings?.active_whatsapp_template_id) || 
                             weddingData?.whatsappTemplates?.find(t => t.is_default) ||
                             weddingData?.whatsappTemplates?.[0];
      
      let templateText = activeTemplate?.template_text || `Kepada Yth.\nBapak/Ibu/Saudara/i\n*{{GUEST_NAME}}*\n\n*Assalamualaikum Warahmatullahi Wabarakatuh*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:\n\n*{{GROOM_NAME}} & {{BRIDE_NAME}}*\n\nDetail undangan dapat diakses melalui tautan berikut:\n{{INVITATION_URL}}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\n*Wassalamualaikum Warahmatullahi Wabarakatuh*\n\nTerima kasih.`;
      
      templateText = templateText
        .replace(/\{\{GUEST_NAME\}\}/g, guest.guest_name)
        .replace(/\{\{GROOM_NAME\}\}/g, groomNick)
        .replace(/\{\{BRIDE_NAME\}\}/g, brideNick)
        .replace(/\{\{INVITATION_URL\}\}/g, inviteUrl);

      if (type === 'copy_text') {
        navigator.clipboard.writeText(templateText);
        setCopiedGuestId(`text-${id}`);
        setTimeout(() => setCopiedGuestId(null), 2500);
      } else if (type === 'whatsapp') {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(templateText)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  const handleExportGuestsToCSV = () => {
    let csv = 'Nama Tamu,Slug,Link Undangan\n';
    weddingData?.guests.forEach(g => {
      const inviteUrl = `${window.location.protocol}//${window.location.host}/invite/${g.slug}`;
      csv += `"${g.guest_name}","${g.slug}","${inviteUrl}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'guest_links.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportGuestsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !weddingData) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).slice(1);
        const importedList: Guest[] = [];

        lines.forEach(line => {
          if (!line.trim()) return;
          const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          const name = cols[0];
          if (name) {
            const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            importedList.push({ guest_name: name, slug });
          }
        });

        if (importedList.length > 0) {
          const updatedGuests = [...weddingData.guests, ...importedList];
          const res = await fetch('/api/wedding-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guests: updatedGuests
            })
          });

          if (res.ok) {
            alert(`Berhasil mengimpor ${importedList.length} nama tamu!`);
            loadData();
          }
        }
      } catch (err) {
        console.error('Failed to import CSV:', err);
      }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------
  // RENDER SVG ANALYTICS CHART
  // -------------------------------------------------------------
  const renderSVGChart = () => {
    if (analyticsLogs.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-xs text-gray-400 italic">Belum ada grafik kunjungan.</p>
        </div>
      );
    }

    // Group logs by date
    const dateCounts: Record<string, number> = {};
    analyticsLogs.forEach(log => {
      if (log.created_at) {
        const date = log.created_at.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dateCounts).sort().slice(-7);
    const maxVal = Math.max(...sortedDates.map(d => dateCounts[d]), 5);
    
    return (
      <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-xs">
        <h3 className="font-serif font-bold text-gray-800 text-sm mb-4">Grafik Kunjungan (7 Hari Terakhir)</h3>
        <svg className="w-full h-48 border-b border-gray-100" viewBox="0 0 400 150">
          {sortedDates.map((date, idx) => {
            const count = dateCounts[date] || 0;
            const x = 50 + idx * 45;
            const barHeight = (count / maxVal) * 100;
            const y = 120 - barHeight;
            return (
              <g key={idx} className="group cursor-pointer">
                <title>{`${date}: ${count} Kunjungan`}</title>
                <rect x={x} y={y} width="24" height={barHeight} className="fill-gold-400 hover:fill-gold-600 transition-colors" rx="3" />
                <text x={x + 12} y="136" className="text-[8px] fill-gray-400 font-sans" textAnchor="middle">
                  {date.split('-').slice(1).join('/')}
                </text>
                <text x={x + 12} y={y - 5} className="text-[8px] fill-gold-700 font-sans font-bold" textAnchor="middle">
                  {count}
                </text>
              </g>
            );
          })}
          <line x1="20" y1="120" x2="380" y2="120" className="stroke-gray-200" strokeWidth="1.5" />
        </svg>
      </div>
    );
  };

  // RSVP Calculation stats
  const attendingCount = rsvps.filter(r => r.attendance).length;
  const nonAttendingCount = rsvps.filter(r => !r.attendance).length;

  // Filtered lists
  const filteredRsvps = rsvps.filter(r => {
    const matchSearch = r.guest_name.toLowerCase().includes(rsvpSearch.toLowerCase());
    if (rsvpFilter === 'all') return matchSearch;
    if (rsvpFilter === 'hadir') return matchSearch && r.attendance;
    return matchSearch && !r.attendance;
  });

  const filteredWishes = wishes.filter(w => {
    const matchSearch = w.guest_name.toLowerCase().includes(wishSearch.toLowerCase()) || w.message.toLowerCase().includes(wishSearch.toLowerCase());
    if (wishFilter === 'all') return matchSearch;
    if (wishFilter === 'approved') return matchSearch && w.is_approved;
    return matchSearch && !w.is_approved;
  });

  const filteredGuests = (weddingData?.guests || []).filter(g => 
    g.guest_name.toLowerCase().includes(guestSearch.toLowerCase())
  );

  // Authentication Wall
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gold-200 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-gold-50 border border-gold-300 rounded-full flex items-center justify-center text-gold-600 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gold-800 text-center">Wedding Admin Control</h1>
          <p className="text-xs text-gray-400 mt-2 text-center">Gunakan credentials admin untuk masuk</p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mt-8">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm bg-gold-50/10 focus:outline-none focus:ring-1 focus:ring-gold-400"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm bg-gold-50/10 focus:outline-none focus:ring-1 focus:ring-gold-400"
                placeholder="••••••••"
              />
            </div>

            {loginError && <p className="text-xs text-red-500 font-medium text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl gold-bg-gradient text-white font-semibold text-sm tracking-wider uppercase shadow-lg hover:opacity-90 active:scale-98 transition-all mt-2 cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-sm text-gold-600 font-semibold font-serif animate-pulse">Memuat Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-white border-r border-gold-100 flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-6 h-6 text-gold-500 fill-gold-50" />
            <span className="font-serif font-bold text-lg text-gold-800">Console Admin</span>
          </div>

          <nav className="flex flex-col gap-1">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'info', label: 'Wedding Info', icon: Calendar },
              { id: 'parents', label: 'Parents details', icon: Users },
              { id: 'gallery', label: 'Gallery Uploader', icon: ImageIcon },
              { id: 'gifts', label: 'Gift Accounts', icon: CreditCard },
              { id: 'rsvps', label: 'RSVP Manager', icon: UserCheck },
              { id: 'wishes', label: 'Guestbook Wishes', icon: BookOpen },
              { id: 'guests', label: 'Guests Registry', icon: Users },
              { id: 'love_story', label: 'Love Story Timeline', icon: Heart },
              { id: 'events', label: 'Events List', icon: Calendar },
              { id: 'whatsapp', label: 'WhatsApp Template', icon: MessageSquare },
              { id: 'music', label: 'Music Upload', icon: Music },
              { id: 'theme', label: 'Design & Themes', icon: Grid },
              { id: 'settings', label: 'Website Settings', icon: Settings },
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gold-50 text-gold-700 font-semibold border-l-4 border-gold-500'
                      : 'text-gray-500 hover:bg-gold-50/20 hover:text-gold-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gold-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content Area */}
      <main className="flex-grow p-6 sm:p-10 max-w-5xl">
        {/* Save Status Notification overlay */}
        {saveStatus === 'saving' && (
          <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-gold-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xl animate-pulse">
            <Save className="w-4 h-4 animate-spin" /> Menyimpan perubahan...
          </div>
        )}

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gold-800">Wedding Dashboard</h1>
              <p className="text-xs text-gray-400 mt-1">Review ringkasan statistik kunjungan dan konfirmasi tamu.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Visitor</span>
                <span className="text-2xl font-bold font-serif text-gold-600 mt-2">{(weddingData?.event?.visitor_count || 0)}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total RSVP</span>
                <span className="text-2xl font-bold font-serif text-slate-600 mt-2">{rsvps.length}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">RSVP Hadir</span>
                <span className="text-2xl font-bold font-serif text-green-600 mt-2">{attendingCount}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">RSVP Absen</span>
                <span className="text-2xl font-bold font-serif text-red-500 mt-2">{nonAttendingCount}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Guestbook</span>
                <span className="text-2xl font-bold font-serif text-blue-600 mt-2">{wishes.length}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Gallery</span>
                <span className="text-2xl font-bold font-serif text-indigo-600 mt-2">{(weddingData?.gallery?.length || 0)}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gold-100 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Guests</span>
                <span className="text-2xl font-bold font-serif text-purple-600 mt-2">{(weddingData?.guests?.length || 0)}</span>
              </div>
            </div>

            {/* Custom lines visitor analytics logs graph chart */}
            {renderSVGChart()}
          </div>
        )}

        {/* 2. WEDDING INFORMATION */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Informasi Mempelai & Acara</h2>
              <p className="text-xs text-gray-400 mt-1">Ubah nama, tanggal, lokasi acara, dan upload foto mempelai pria/wanita.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {/* Photo Upload Pria */}
              <div className="p-4 border border-dashed border-gold-200 rounded-xl flex flex-col items-center gap-4 bg-gold-50/5">
                <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">Foto Groom / Pria</span>
                {infoForm.groom_image ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gold-300">
                    <Image src={infoForm.groom_image} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, groom_image: '' })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 font-serif text-xl">Pria</div>
                )}
                <label className="px-4 py-2 border border-gold-400 rounded-lg hover:bg-gold-50 text-gold-600 text-xs font-semibold tracking-wider uppercase cursor-pointer flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Upload Foto Pria
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'wedding-info', 'groom_image', (url) => setInfoForm({ ...infoForm, groom_image: url }))} />
                </label>
              </div>

              {/* Photo Upload Wanita */}
              <div className="p-4 border border-dashed border-gold-200 rounded-xl flex flex-col items-center gap-4 bg-gold-50/5">
                <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">Foto Bride / Wanita</span>
                {infoForm.bride_image ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gold-300">
                    <Image src={infoForm.bride_image} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, bride_image: '' })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 font-serif text-xl">Wanita</div>
                )}
                <label className="px-4 py-2 border border-gold-400 rounded-lg hover:bg-gold-50 text-gold-600 text-xs font-semibold tracking-wider uppercase cursor-pointer flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Upload Foto Wanita
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'wedding-info', 'bride_image', (url) => setInfoForm({ ...infoForm, bride_image: url }))} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap Groom</label>
                <input
                  type="text"
                  value={infoForm.groom_name || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, groom_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Groom</label>
                <input
                  type="text"
                  value={infoForm.groom_nickname || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, groom_nickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap Bride</label>
                <input
                  type="text"
                  value={infoForm.bride_name || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, bride_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Bride</label>
                <input
                  type="text"
                  value={infoForm.bride_nickname || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, bride_nickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Acara</label>
                <input
                  type="date"
                  value={infoForm.event_date ? infoForm.event_date.split('T')[0] : ''}
                  onChange={(e) => setInfoForm({ ...infoForm, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jam Acara</label>
                <input
                  type="text"
                  value={infoForm.event_time || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, event_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Tempat/Gedung</label>
                <input
                  type="text"
                  value={infoForm.location || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={infoForm.address || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Link Google Maps</label>
                <input
                  type="text"
                  value={infoForm.google_maps || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, google_maps: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kisah: Awal Bertemu</label>
                <textarea
                  rows={3}
                  value={infoForm.story_meet || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_meet: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kisah: Lamaran</label>
                <textarea
                  rows={3}
                  value={infoForm.story_proposal || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_proposal: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kisah: Menikah</label>
                <textarea
                  rows={3}
                  value={infoForm.story_marriage || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_marriage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pesan Penutup</label>
                <textarea
                  rows={2}
                  value={infoForm.closing_message || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, closing_message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Informasi
              </button>
            </div>
          </form>
        )}

        {/* 3. PARENTS DETAILS & PHOTO UPLOADS */}
        {activeTab === 'parents' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Orang Tua & Foto Keluarga</h2>
              <p className="text-xs text-gray-400 mt-1">Kelola nama dan upload foto orang tua/wali masing-masing mempelai.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
              {parentsList.map((parent, idx) => (
                <div key={parent.id || idx} className="flex flex-col gap-4 p-5 rounded-xl border border-gold-100 bg-gold-50/5">
                  <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
                    Pihak Mempelai {parent.type === 'groom' ? 'Pria' : 'Wanita'}
                  </span>

                  {/* Father fields */}
                  <div className="flex items-center gap-4 border-b border-dashed border-gold-200/50 pb-4">
                    <div className="flex-grow flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Ayah</label>
                        <input
                          type="text"
                          value={parent.father_name || ''}
                          onChange={(e) => {
                            const updated = [...parentsList];
                            updated[idx] = { ...updated[idx], father_name: e.target.value };
                            setParentsList(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-md border border-gold-100 text-sm"
                        />
                      </div>
                      <label className="px-3 py-1 bg-white border border-gold-300 rounded hover:bg-gold-50 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1 w-fit">
                        <Upload className="w-3 h-3" /> Foto Ayah
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'parents', `parents:${parent.type}:father_photo`, (url) => {
                          const updated = [...parentsList];
                          updated[idx] = { ...updated[idx], father_photo: url };
                          setParentsList(updated);
                        })} />
                      </label>
                    </div>

                    {parent.father_photo ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gold-200">
                        <Image src={parent.father_photo} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...parentsList];
                            updated[idx] = { ...updated[idx], father_photo: '' };
                            setParentsList(updated);
                          }}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 cursor-pointer z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-[10px] text-gold-400 uppercase font-bold">Ayah</div>
                    )}
                  </div>

                  {/* Mother fields */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex-grow flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Ibu</label>
                        <input
                          type="text"
                          value={parent.mother_name || ''}
                          onChange={(e) => {
                            const updated = [...parentsList];
                            updated[idx] = { ...updated[idx], mother_name: e.target.value };
                            setParentsList(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-md border border-gold-100 text-sm"
                        />
                      </div>
                      <label className="px-3 py-1 bg-white border border-gold-300 rounded hover:bg-gold-50 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1 w-fit">
                        <Upload className="w-3 h-3" /> Foto Ibu
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'parents', `parents:${parent.type}:mother_photo`, (url) => {
                          const updated = [...parentsList];
                          updated[idx] = { ...updated[idx], mother_photo: url };
                          setParentsList(updated);
                        })} />
                      </label>
                    </div>

                    {parent.mother_photo ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gold-200">
                        <Image src={parent.mother_photo} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...parentsList];
                            updated[idx] = { ...updated[idx], mother_photo: '' };
                            setParentsList(updated);
                          }}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 cursor-pointer z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-[10px] text-gold-400 uppercase font-bold">Ibu</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Orang Tua
              </button>
            </div>
          </form>
        )}

        {/* 4. UPGRADED GALLERY SECTION */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Gallery Photo Manager</h2>
              <p className="text-xs text-gray-400 mt-1">Upload multiple prewedding pictures. Drag & Drop upload falls back to local server if Supabase is unconfigured.</p>
            </div>

            {/* Drag and drop uploader box */}
            <div className="p-8 border-2 border-dashed border-gold-200 hover:border-gold-400 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative bg-gold-50/5">
              <Upload className="w-8 h-8 text-gold-500 mb-3" />
              <p className="text-sm font-semibold text-gray-700">Drag & Drop file foto Anda di sini</p>
              <p className="text-xs text-gray-400 mt-1">Mendukung format PNG, JPG, JPEG. Bisa upload banyak file sekaligus.</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddGalleryPhotos}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Thumbnail grids */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {weddingData?.gallery.map((item, idx) => (
                <div key={item.id || idx} className="aspect-square relative rounded-xl overflow-hidden border border-gold-100 group shadow-xs">
                  <Image src={item.image_url} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleSortGalleryItem(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1.5 bg-white text-gold-600 rounded-full hover:bg-gold-50 transition-colors shadow-lg cursor-pointer disabled:opacity-30"
                      title="Geser Kiri"
                    >
                      ◀
                    </button>
                    <button 
                      onClick={() => setQrCodeModalUrl(item.image_url)} // View zoom lightbox preview
                      className="p-1.5 bg-white text-gold-600 rounded-full hover:bg-gold-50 transition-colors shadow-lg cursor-pointer"
                      title="Lihat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleSortGalleryItem(idx, 'right')}
                      disabled={idx === (weddingData?.gallery.length || 0) - 1}
                      className="p-1.5 bg-white text-gold-600 rounded-full hover:bg-gold-50 transition-colors shadow-lg cursor-pointer disabled:opacity-30"
                      title="Geser Kanan"
                    >
                      ▶
                    </button>
                    <button 
                      onClick={() => handleDeleteGalleryItem(item.image_url)}
                      className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. MULTIPLE BANK ACCOUNT MANAGEMENT & QRIS */}
        {activeTab === 'gifts' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div className="flex justify-between items-center border-b border-gold-50 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-800">Amplop Digital / Angpau</h2>
                <p className="text-xs text-gray-400 mt-1">Kelola beberapa rekening bank penerima hadiah, urutkan rekening, dan upload QRIS.</p>
              </div>
              <button
                type="button"
                onClick={handleAddGiftAccount}
                className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Rekening
              </button>
            </div>

            <div className="flex flex-col gap-6 mt-4">
              {giftsList.map((gift, idx) => (
                <div key={gift.id || idx} className="p-6 rounded-xl border border-gold-100 bg-[#FDFCF9]/30 relative flex flex-col sm:flex-row gap-6">
                  {/* Sorting inputs & deletion panel */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleSortGifts(idx, 'up')}
                      className="p-1.5 border border-gold-200 hover:bg-gold-50 text-gold-600 disabled:opacity-30 rounded cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === giftsList.length - 1}
                      onClick={() => handleSortGifts(idx, 'down')}
                      className="p-1.5 border border-gold-200 hover:bg-gold-50 text-gold-600 disabled:opacity-30 rounded cursor-pointer"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGiftAccount(idx)}
                      className="p-1.5 border border-red-200 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Bank / E-Wallet</label>
                      <input
                        type="text"
                        required
                        value={gift.bank_name || ''}
                        onChange={(e) => handleUpdateGiftField(idx, 'bank_name', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                        placeholder="BCA, Mandiri, OVO, ShopeePay..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        required
                        value={gift.account_number || ''}
                        onChange={(e) => handleUpdateGiftField(idx, 'account_number', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        required
                        value={gift.account_holder || ''}
                        onChange={(e) => handleUpdateGiftField(idx, 'account_holder', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                      />
                    </div>
                  </div>

                  {/* QRIS Upload Box */}
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gold-200 rounded-xl bg-white shrink-0 sm:w-44 text-center">
                    <span className="text-[10px] font-bold text-gold-700 uppercase tracking-wider mb-2">QRIS Code</span>
                    {gift.qris_image ? (
                      <div className="relative group w-20 h-20 mb-2 border border-gold-100 p-1 rounded-lg">
                        <Image src={gift.qris_image} alt="" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => handleUpdateGiftField(idx, 'qris_image', '')}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-gold-200 rounded-lg flex items-center justify-center text-gold-400 mb-2">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <label className="px-3 py-1 bg-gold-50 border border-gold-300 rounded hover:bg-gold-100 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload QRIS
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, 'qris', `gift_accounts:${idx}:qris_image`, (url) => handleUpdateGiftField(idx, 'qris_image', url))} 
                      />
                    </label>
                  </div>
                </div>
              ))}

              {giftsList.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-6">Belum ada rekening terdaftar. Silakan tambahkan rekening bank baru.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Rekening & QRIS
              </button>
            </div>
          </form>
        )}

        {/* 6. ADVANCED RSVP MANAGEMENT & FILTERS */}
        {activeTab === 'rsvps' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold-50 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-800">RSVP Manager</h2>
                <p className="text-xs text-gray-400 mt-1">Audit konfirmasi kehadiran tamu. Saring, cetak, dan ekspor data.</p>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleExportRsvpsToCSV}
                  className="px-4 py-2 border border-gold-300 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={handlePrintRSVPs}
                  className="px-4 py-2 border border-gold-300 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Report
                </button>
              </div>
            </div>

            {/* Filters panel */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-gold-50/10 p-4 rounded-xl border border-gold-50">
              <div className="flex-grow w-full">
                <input
                  type="text"
                  placeholder="Cari nama tamu..."
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setRsvpFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${rsvpFilter === 'all' ? 'bg-gold-500 border-gold-500 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setRsvpFilter('hadir')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${rsvpFilter === 'hadir' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Hadir
                </button>
                <button
                  onClick={() => setRsvpFilter('absen')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${rsvpFilter === 'absen' ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Absen
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 text-gold-800 font-bold uppercase tracking-wider text-xs bg-gold-50/20">
                    <th className="py-3 px-4">Nama Tamu</th>
                    <th className="py-3 px-4">Kehadiran</th>
                    <th className="py-3 px-4">Pax</th>
                    <th className="py-3 px-4">Pesan Restu</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRsvps.map((rsvp, idx) => (
                    <tr key={rsvp.id || idx} className="border-b border-gold-50/50 hover:bg-gold-50/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-700">{rsvp.guest_name}</td>
                      <td className="py-3.5 px-4">
                        {rsvp.attendance ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-green-50 text-green-600 rounded-full border border-green-200 uppercase">Hadir</span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-500 rounded-full border border-red-200 uppercase">Absen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">{rsvp.guest_count}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs truncate" title={rsvp.message}>{rsvp.message || '-'}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-400">
                        {rsvp.created_at ? new Date(rsvp.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRSVPItem(rsvp.id || '')}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRsvps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400 italic">Belum ada respon RSVP yang cocok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. UPGRADED GUESTBOOK - APPROVE & HIDE WISHES */}
        {activeTab === 'wishes' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold-50 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-800">Daftar Ucapan & Moderasi</h2>
                <p className="text-xs text-gray-400 mt-1">Audit doa restu dari para tamu. Anda dapat menyembunyikan/menampilkan pesan di landing page.</p>
              </div>
              
              <button
                onClick={handleExportWishesToCSV}
                className="px-4 py-2 border border-gold-300 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-gold-50/10 p-4 rounded-xl border border-gold-50">
              <div className="flex-grow w-full">
                <input
                  type="text"
                  placeholder="Cari pesan / nama pengirim..."
                  value={wishSearch}
                  onChange={(e) => setWishSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setWishFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${wishFilter === 'all' ? 'bg-gold-500 border-gold-500 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setWishFilter('approved')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${wishFilter === 'approved' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Ditampilkan
                </button>
                <button
                  onClick={() => setWishFilter('hidden')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${wishFilter === 'hidden' ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-gold-200 text-gold-600 hover:bg-gold-50'}`}
                >
                  Disembunyikan
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredWishes.map((wish, idx) => (
                <div key={wish.id || idx} className="p-4 rounded-xl border border-gold-50 bg-gold-50/5 flex justify-between items-start gap-4 shadow-2xs">
                  <div className="flex-grow">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="font-bold text-gold-700 text-sm">{wish.guest_name}</span>
                      <span className="text-[10px] text-gray-400">
                        {wish.created_at ? new Date(wish.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      {wish.is_approved ? (
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-green-50 text-green-600 rounded-full border border-green-200">VISIBLE</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-slate-100 text-slate-500 rounded-full border border-slate-200">HIDDEN</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{wish.message}</p>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleApproval(wish.id || '', wish.is_approved)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        wish.is_approved 
                          ? 'border-slate-300 hover:bg-slate-50 text-slate-500' 
                          : 'border-green-300 hover:bg-green-50 text-green-600'
                      }`}
                      title={wish.is_approved ? 'Sembunyikan Pesan' : 'Tampilkan Pesan'}
                    >
                      {wish.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteWish(wish.id || '')}
                      className="p-1.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredWishes.length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-8">Belum ada ucapan yang cocok.</p>
              )}
            </div>
          </div>
        )}

        {/* 8. GUEST REGISTRY & EXCEL CSV UPLOAD */}
        {activeTab === 'guests' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold-50 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gold-800">Daftar Link Undangan (Guests)</h2>
                <p className="text-xs text-gray-400 mt-1">Daftarkan nama tamu untuk link personal. Anda dapat mengimpor/ekspor data menggunakan file CSV.</p>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {/* Import CSV input */}
                <label className="px-4 py-2 border border-gold-300 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4" /> Import CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportGuestsCSV} />
                </label>
                
                <button
                  onClick={handleExportGuestsToCSV}
                  className="px-4 py-2 border border-gold-300 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Inputs & search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form onSubmit={handleAddGuest} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Nama Lengkap Tamu"
                  className="flex-grow px-3 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Register
                </button>
              </form>
              <div>
                <input
                  type="text"
                  placeholder="Cari tamu..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto w-full mt-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 text-gold-800 font-bold uppercase tracking-wider text-xs bg-gold-50/20">
                    <th className="py-3 px-4">Nama Tamu</th>
                    <th className="py-3 px-4">Invitation Slug</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest, idx) => (
                    <tr key={guest.id || idx} className="border-b border-gold-50/50 hover:bg-gold-50/10 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {editingGuestId === guest.id ? (
                          <input
                            type="text"
                            value={editingGuestName}
                            onChange={(e) => setEditingGuestName(e.target.value)}
                            className="px-2 py-1 border border-gold-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold-400"
                          />
                        ) : (
                          guest.guest_name
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gold-600">/invite/{guest.slug}</td>
                      <td className="py-3 px-4 text-right flex gap-1 justify-end items-center">
                        {editingGuestId === guest.id ? (
                          <button
                            onClick={() => handleUpdateGuest(guest.id || '')}
                            className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 cursor-pointer shadow-xs"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingGuestId(guest.id || '');
                              setEditingGuestName(guest.guest_name);
                            }}
                            className="px-2.5 py-1.5 border border-gold-300 rounded-lg text-xs font-semibold text-gold-600 hover:bg-gold-50 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                         <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const inviteUrl = `${window.location.protocol}//${window.location.host}/invite/${guest.slug}`;
                              setQrCodeModalUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteUrl)}`);
                            }
                          }}
                          className="px-2.5 py-1.5 border border-gold-250 rounded-lg text-xs font-bold text-gold-600 hover:bg-gold-50/40 cursor-pointer"
                          title="Generate QR Code"
                        >
                          QR
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => copyGuestInviteLink(guest, guest.id || String(idx), 'copy_link')}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1"
                          title="Copy Link Only"
                        >
                          {copiedGuestId === `link-${guest.id || String(idx)}` ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Link
                        </button>

                        {/* Copy WA Message */}
                        <button
                          onClick={() => copyGuestInviteLink(guest, guest.id || String(idx), 'copy_text')}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1"
                          title="Copy WhatsApp Text Message"
                        >
                          {copiedGuestId === `text-${guest.id || String(idx)}` ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Text
                        </button>

                        {/* Share WA */}
                        <button
                          onClick={() => copyGuestInviteLink(guest, guest.id || String(idx), 'whatsapp')}
                          className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          title="Share directly via WhatsApp"
                        >
                          Share
                        </button>

                        <button
                          onClick={() => handleDeleteGuestItem(guest.id || '')}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredGuests.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 italic">Belum ada tamu terdaftar yang cocok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. RUNTIME DYNAMIC DESIGN THEME SELECTION */}
        {activeTab === 'theme' && weddingData && (
          <ThemeGallery weddingData={weddingData} loadData={loadData} />
        )}

        {/* 12. LOVE STORY TIMELINE MANAGER */}
        {activeTab === 'love_story' && weddingData && (
          <LoveStoryManager weddingData={weddingData} loadData={loadData} />
        )}

        {/* 13. EVENTS LIST MANAGER */}
        {activeTab === 'events' && weddingData && (
          <EventManager weddingData={weddingData} loadData={loadData} />
        )}

        {/* 14. WHATSAPP TEMPLATE EDITOR */}
        {activeTab === 'whatsapp' && weddingData && (
          <WhatsAppTemplateManager weddingData={weddingData} loadData={loadData} />
        )}

        {/* 10. SYSTEM CONFIGURATION & WEB SETTINGS TOGGLES */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Website Configuration Settings</h2>
              <p className="text-xs text-gray-400 mt-1">Sesuaikan meta SEO, favicon, maintenance mode, audio link, dan toggles fitur utama.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {/* Feature toggles */}
              <div className="sm:col-span-2 p-5 rounded-xl border border-gold-50 bg-gold-50/5 flex flex-col gap-4">
                <span className="text-xs font-bold text-gold-700 uppercase tracking-wider mb-2">Feature Control Toggles</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={infoForm.enable_music ?? true}
                      onChange={(e) => setInfoForm({ ...infoForm, enable_music: e.target.checked })}
                      className="accent-gold-500 cursor-pointer"
                    />
                    Enable Background Music
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={infoForm.enable_countdown ?? true}
                      onChange={(e) => setInfoForm({ ...infoForm, enable_countdown: e.target.checked })}
                      className="accent-gold-500 cursor-pointer"
                    />
                    Enable Countdown Timer
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={infoForm.enable_rsvp ?? true}
                      onChange={(e) => setInfoForm({ ...infoForm, enable_rsvp: e.target.checked })}
                      className="accent-gold-500 cursor-pointer"
                    />
                    Enable RSVP Form
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={infoForm.enable_guestbook ?? true}
                      onChange={(e) => setInfoForm({ ...infoForm, enable_guestbook: e.target.checked })}
                      className="accent-gold-500 cursor-pointer"
                    />
                    Enable Guestbook Wall
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={infoForm.enable_gift ?? true}
                      onChange={(e) => setInfoForm({ ...infoForm, enable_gift: e.target.checked })}
                      className="accent-gold-500 cursor-pointer"
                    />
                    Enable Gift accounts
                  </label>

                  <label className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={infoForm.maintenance_mode ?? false}
                      onChange={(e) => setInfoForm({ ...infoForm, maintenance_mode: e.target.checked })}
                      className="accent-red-600 cursor-pointer"
                    />
                    Under Maintenance Mode
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Website Title (SEO)</label>
                <input
                  type="text"
                  value={infoForm.website_title || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, website_title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Background Music MP3 URL</label>
                <input
                  type="text"
                  value={infoForm.music_url || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, music_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meta Description (SEO)</label>
                <textarea
                  rows={2}
                  value={infoForm.meta_description || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, meta_description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SEO Keywords</label>
                <input
                  type="text"
                  value={infoForm.seo_keywords || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, seo_keywords: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                  placeholder="wedding, invitation, hery, bella..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Canonical URL</label>
                <input
                  type="text"
                  value={infoForm.canonical_url || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, canonical_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:ring-1 focus:ring-gold-400"
                  placeholder="https://wedding-hery-bella.com"
                />
              </div>

              {/* Upload settings: favicon, hero image, background image */}
              <div className="p-4 border border-dashed border-gold-200 rounded-xl flex items-center justify-between bg-gold-50/5">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">Website Favicon</span>
                  <label className="px-3 py-1.5 bg-white border border-gold-300 rounded hover:bg-gold-50 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1 w-fit">
                    <Upload className="w-3 h-3" /> Upload Favicon
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'wedding-info', 'favicon', (url) => setInfoForm({ ...infoForm, favicon: url }))} />
                  </label>
                </div>
                {infoForm.favicon && (
                  <div className="relative w-10 h-10 border border-gold-200 p-1 bg-white rounded overflow-hidden">
                    <Image src={infoForm.favicon} alt="" fill className="object-contain" />
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, favicon: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 cursor-pointer z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border border-dashed border-gold-200 rounded-xl flex items-center justify-between bg-gold-50/5">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">Cover Hero / OG Image</span>
                  <label className="px-3 py-1.5 bg-white border border-gold-300 rounded hover:bg-gold-50 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1 w-fit">
                    <Upload className="w-3 h-3" /> Upload Cover Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover', 'hero_image', (url) => setInfoForm({ ...infoForm, hero_image: url, og_image: url }))} />
                  </label>
                </div>
                {infoForm.hero_image && (
                  <div className="relative w-16 h-10 border border-gold-200 bg-white rounded overflow-hidden">
                    <Image src={infoForm.hero_image} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, hero_image: '', og_image: '' })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 cursor-pointer z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 p-4 border border-dashed border-gold-200 rounded-xl flex items-center justify-between bg-gold-50/5">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">Website Custom Background Image (Optional)</span>
                  <label className="px-3 py-1.5 bg-white border border-gold-300 rounded hover:bg-gold-50 text-[10px] font-bold text-gold-600 tracking-wider uppercase cursor-pointer flex items-center gap-1 w-fit">
                    <Upload className="w-3 h-3" /> Upload Background
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'wedding-info', 'background_image', (url) => setInfoForm({ ...infoForm, background_image: url }))} />
                  </label>
                </div>
                {infoForm.background_image && (
                  <div className="relative w-16 h-10 border border-gold-200 bg-white rounded overflow-hidden">
                    <Image src={infoForm.background_image} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, background_image: '' })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 cursor-pointer z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Konfigurasi
              </button>
            </div>
          </form>
        )}

        {/* 11. MUSIC UPLOAD SECTION */}
        {activeTab === 'music' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Background Music Manager</h2>
              <p className="text-xs text-gray-400 mt-1">Upload background music (MP3) for the digital invitation. Supported format: MP3 (Max 20MB).</p>
            </div>

            <div className="flex flex-col gap-6 mt-4 items-center">
              {infoForm.music_url ? (
                <div className="w-full max-w-md p-6 rounded-xl border border-gold-200 bg-gold-50/5 flex flex-col gap-4 items-center shadow-xs">
                  <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-full flex items-center justify-center font-bold text-lg animate-bounce">
                    🎵
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center truncate max-w-xs" title={infoForm.music_url}>
                    {infoForm.music_url.split('/').pop()}
                  </span>
                  
                  {/* Audio player preview */}
                  <audio src={infoForm.music_url} controls className="w-full mt-2" />

                  <div className="flex gap-3 w-full mt-4">
                    <label className="flex-1 py-2 border border-gold-400 hover:bg-gold-50/50 text-gold-600 rounded-lg text-xs font-semibold text-center cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Replace Music
                      <input 
                        type="file" 
                        accept="audio/mp3,audio/mpeg" 
                        className="hidden" 
                        onChange={handleMusicUpload} 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleDeleteMusic}
                      className="flex-1 py-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Music
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md p-8 border-2 border-dashed border-gold-200 hover:border-gold-400 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer relative bg-gold-50/5">
                  <Upload className="w-8 h-8 text-gold-500 mb-3" />
                  <p className="text-sm font-semibold text-gray-700">Pilih / Drag file musik MP3 di sini</p>
                  <p className="text-xs text-gray-400 mt-1">Hanya mendukung format MP3 (Maksimal 20MB).</p>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    onChange={handleMusicUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR CODE OVERLAY PREVIEW MODAL */}
        <AnimatePresence>
          {qrCodeModalUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrCodeModalUrl(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white p-6 rounded-2xl flex flex-col items-center max-w-sm w-full border border-gold-300 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()} // Stop bubble up
              >
                <button
                  onClick={() => setQrCodeModalUrl(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer bg-gray-50 rounded-full p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="font-serif font-bold text-gray-800 text-lg text-center mb-4">Peta / Preview QR Code</h3>
                <Image src={qrCodeModalUrl} alt="" width={240} height={240} className="object-contain border border-gold-100 p-2 rounded-xl mb-4" />
                
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Tamu dapat melakukan scan pada QR code ini untuk membuka link undangan digital personal mereka secara instan.
                </p>

                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const guestSlug = qrCodeModalUrl.split('data=')[1];
                      const guestObj = weddingData?.guests?.find(g => encodeURIComponent(guestSlug).includes(encodeURIComponent(g.slug)));
                      const guestNameStr = guestObj ? guestObj.guest_name : '';
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>QR Code - ${guestNameStr}</title>
                            <style>
                              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; text-align: center; margin: 0; }
                              .container { border: 2px solid #C5A059; padding: 30px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                              img { width: 250px; height: 250px; margin-top: 15px; }
                              h2 { color: #8C6A24; margin: 0 0 10px 0; }
                              p { color: #666; margin: 0; font-size: 14px; }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                              <h2>Undangan Pernikahan</h2>
                              <p>Kepada Yth. Bapak/Ibu/Saudara/i:</p>
                              <h3 style="margin: 5px 0 15px 0;">${guestNameStr}</h3>
                              <img src="${qrCodeModalUrl}" />
                            </div>
                            <script>
                              window.onload = function() {
                                window.print();
                                window.close();
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="w-full mt-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-sm"
                >
                  Print QR Code
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
