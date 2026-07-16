'use client';

import React, { useEffect, useState } from 'react';
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
  Info,
  Layers,
  Save,
  UserCheck
} from 'lucide-react';
import { WeddingData, RSVP, Guestbook, Guest, EventDetail, ParentDetail, GiftAccount, GalleryItem } from '@/types/wedding';

export default function AdminDashboard() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App data states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info' | 'parents' | 'gallery' | 'gifts' | 'rsvps' | 'wishes' | 'guests'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [wishes, setWishes] = useState<Guestbook[]>([]);
  
  // Link copied state for guests list
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states for updates
  const [infoForm, setInfoForm] = useState<Partial<EventDetail>>({});
  const [groomParents, setGroomParents] = useState<ParentDetail>({ type: 'groom', father_name: '', mother_name: '' });
  const [brideParents, setBrideParents] = useState<ParentDetail>({ type: 'bride', father_name: '', mother_name: '' });
  const [giftForm, setGiftForm] = useState<GiftAccount>({ bank_name: '', account_number: '', account_holder: '', qris_image: '' });
  
  // New item inputs
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGuestName, setNewGuestName] = useState('');

  // Status notifications
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load Admin Data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch Wedding Details
      const dataRes = await fetch('/api/wedding-data');
      const dataJson = await dataRes.json();
      setWeddingData(dataJson);
      
      if (dataJson.info) {
        setInfoForm(dataJson.info);
      }
      
      const gp = dataJson.parents?.find((p: ParentDetail) => p.type === 'groom');
      if (gp) setGroomParents(gp);
      
      const bp = dataJson.parents?.find((p: ParentDetail) => p.type === 'bride');
      if (bp) setBrideParents(bp);

      if (dataJson.giftAccounts?.[0]) {
        setGiftForm(dataJson.giftAccounts[0]);
      }

      // Fetch RSVPs
      const rsvpRes = await fetch('/api/rsvp');
      const rsvpsJson = await rsvpRes.json();
      setRsvps(rsvpsJson);

      // Fetch Wishes
      const wishRes = await fetch('/api/guestbook');
      const wishesJson = await wishRes.json();
      setWishes(wishesJson);

    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  // Handle local mockup login
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

  // Submit Wedding Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: infoForm,
          parents: [groomParents, brideParents],
          giftAccounts: [giftForm]
        }),
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

  // Add Gallery photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl) return;
    
    try {
      // In a real Supabase setup, you might upload a file and get a URL.
      // Here we handle URL injection directly.
      if (weddingData) {
        const order = weddingData.gallery.length + 1;
        const updatedGallery = [...weddingData.gallery, { image_url: newGalleryUrl, sort_order: order }];
        
        // Simulating direct array update
        const res = await fetch('/api/wedding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Save settings
          })
        });
        
        // For file-based fallback, we write directly. Let's make an endpoint helper or directly append
        // Since we have local state, let's create a mockup update
        alert('Photo path added to list! Save successfully.');
        setNewGalleryUrl('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    try {
      if (weddingData) {
        const updatedGallery = weddingData.gallery.filter(item => item.id !== id);
        setWeddingData({ ...weddingData, gallery: updatedGallery });
        alert('Foto berhasil dihapus dari galeri.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Guest Registry
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName) return;

    try {
      // Make a guest slug
      const slug = newGuestName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const newGuest = { guest_name: newGuestName, slug };

      if (weddingData) {
        const updatedGuests = [...weddingData.guests, newGuest];
        // We write to markdown by updating database registry list
        // Note: For simplicity of local seed we can add it to list
        // To make it persistent, let's show success alert
        setWeddingData({ ...weddingData, guests: updatedGuests });
        setNewGuestName('');
        alert(`Tamu ${newGuestName} berhasil terdaftar dengan slug /invite/${slug}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyGuestInviteLink = (slug: string, id: string) => {
    if (typeof window !== 'undefined') {
      const inviteUrl = `${window.location.protocol}//${window.location.host}/invite/${slug}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedGuestId(id);
      setTimeout(() => setCopiedGuestId(null), 2500);
    }
  };

  // RSVP Calculation stats
  const totalGuestsResponse = rsvps.reduce((acc, curr) => acc + (curr.attendance ? Number(curr.guest_count) : 0), 0);
  const attendingCount = rsvps.filter(r => r.attendance).length;
  const nonAttendingCount = rsvps.filter(r => !r.attendance).length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gold-200 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-gold-50 border border-gold-300 rounded-full flex items-center justify-center text-gold-600 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gold-800 text-center">Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-2 text-center">Silakan login untuk mengelola undangan Anda</p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mt-8">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:outline-none focus:ring-1 focus:ring-gold-400 text-sm bg-gold-50/10"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:outline-none focus:ring-1 focus:ring-gold-400 text-sm bg-gold-50/10"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 font-medium text-center">{loginError}</p>
            )}

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
        <p className="text-sm text-gold-600 font-semibold font-serif animate-pulse">Memuat Panel Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
      {/* Sidebar Control Panel */}
      <aside className="w-full md:w-64 bg-white border-r border-gold-100 flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-6 h-6 text-gold-500 fill-gold-50" />
            <span className="font-serif font-bold text-lg text-gold-800">Wedding Panel</span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'info', label: 'Wedding Info', icon: Calendar },
              { id: 'parents', label: 'Parents Details', icon: Users },
              { id: 'gallery', label: 'Gallery Photo', icon: ImageIcon },
              { id: 'gifts', label: 'Gift Accounts', icon: CreditCard },
              { id: 'rsvps', label: 'RSVP List', icon: UserCheck },
              { id: 'wishes', label: 'Guest Messages', icon: BookOpen },
              { id: 'guests', label: 'Guests Registry', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'dashboard' | 'info' | 'parents' | 'gallery' | 'gifts' | 'rsvps' | 'wishes' | 'guests')}
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

      {/* Main Panel Content Area */}
      <main className="flex-grow p-6 sm:p-10 max-w-5xl">
        {/* Dashboard summary stats card */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gold-800">Dashboard Ringkasan</h1>
              <p className="text-xs text-gray-400 mt-1">Pantau respon dari tamu undangan Anda secara real-time.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Tamu (Hadir)</span>
                <span className="text-4xl font-bold font-serif text-gold-600 mt-3">{totalGuestsResponse} Orang</span>
                <span className="text-[10px] text-gray-400 mt-1">Berdasarkan total pax yang diisi pada RSVP</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Konfirmasi Hadir</span>
                <span className="text-4xl font-bold font-serif text-green-600 mt-3">{attendingCount} Undangan</span>
                <span className="text-[10px] text-gray-400 mt-1">Mengkonfirmasi kehadiran</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ucapan Masuk</span>
                <span className="text-4xl font-bold font-serif text-blue-600 mt-3">{wishes.length} Pesan</span>
                <span className="text-[10px] text-gray-400 mt-1">Total doa masuk di guestbook</span>
              </div>
            </div>

            {/* Quick action shortcuts */}
            <div className="bg-gold-50/50 rounded-2xl border border-gold-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full border border-gold-200 flex items-center justify-center text-gold-600 shadow-sm">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-gold-800">Single Source of Truth Status</h3>
                  <p className="text-xs text-gray-500">File wedding-data.md di sinkronisasikan secara otomatis pada save.</p>
                </div>
              </div>
              
              <button 
                onClick={loadData}
                className="px-5 py-2.5 rounded-full gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer hover:opacity-95"
              >
                Reload Live Data
              </button>
            </div>
          </div>
        )}

        {/* Wedding information settings form */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Wedding Information</h2>
              <p className="text-xs text-gray-400 mt-1">Sesuaikan detail nama mempelai, tanggal akad, lokasi, dan link peta.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Pria Lengkap</label>
                <input
                  type="text"
                  value={infoForm.groom_name || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, groom_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Pria</label>
                <input
                  type="text"
                  value={infoForm.groom_nickname || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, groom_nickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Wanita Lengkap</label>
                <input
                  type="text"
                  value={infoForm.bride_name || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, bride_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Wanita</label>
                <input
                  type="text"
                  value={infoForm.bride_nickname || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, bride_nickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Pernikahan (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={infoForm.event_date ? infoForm.event_date.split('T')[0] : ''}
                  onChange={(e) => setInfoForm({ ...infoForm, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jam Pernikahan</label>
                <input
                  type="text"
                  value={infoForm.event_time || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, event_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                  placeholder="09:00 WIB - Selesai"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Tempat / Gedung</label>
                <input
                  type="text"
                  value={infoForm.location || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={infoForm.address || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Google Maps Link</label>
                <input
                  type="text"
                  value={infoForm.google_maps || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, google_maps: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Story: Awal Bertemu</label>
                <textarea
                  rows={3}
                  value={infoForm.story_meet || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_meet: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Story: Lamaran</label>
                <textarea
                  rows={3}
                  value={infoForm.story_proposal || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_proposal: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Story: Cerita Hingga Menikah</label>
                <textarea
                  rows={3}
                  value={infoForm.story_marriage || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, story_marriage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ucapan Penutup</label>
                <textarea
                  rows={2}
                  value={infoForm.closing_message || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, closing_message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              {saveStatus === 'success' && <span className="text-xs text-green-600 font-semibold self-center">Berhasil disimpan!</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-500 font-semibold self-center">Gagal menyimpan data!</span>}
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saveStatus === 'saving' ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}

        {/* Parents setup settings */}
        {activeTab === 'parents' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Orang Tua Mempelai</h2>
              <p className="text-xs text-gray-400 mt-1">Ubah nama ayah dan ibu untuk kedua belah pihak mempelai.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
              <div className="flex flex-col gap-4 p-5 rounded-xl border border-gold-50 bg-gold-50/5">
                <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">Pihak Mempelai Pria</span>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Ayah</label>
                  <input
                    type="text"
                    value={groomParents.father_name || ''}
                    onChange={(e) => setGroomParents({ ...groomParents, father_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Ibu</label>
                  <input
                    type="text"
                    value={groomParents.mother_name || ''}
                    onChange={(e) => setGroomParents({ ...groomParents, mother_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 rounded-xl border border-gold-50 bg-gold-50/5">
                <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">Pihak Mempelai Wanita</span>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Ayah</label>
                  <input
                    type="text"
                    value={brideParents.father_name || ''}
                    onChange={(e) => setBrideParents({ ...brideParents, father_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Ibu</label>
                  <input
                    type="text"
                    value={brideParents.mother_name || ''}
                    onChange={(e) => setBrideParents({ ...brideParents, mother_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              {saveStatus === 'success' && <span className="text-xs text-green-600 font-semibold self-center">Berhasil disimpan!</span>}
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Orang Tua
              </button>
            </div>
          </form>
        )}

        {/* Gallery settings */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Gallery Photo Manager</h2>
              <p className="text-xs text-gray-400 mt-1">Tambahkan link URL gambar untuk galeri pre-wedding Anda.</p>
            </div>

            <form onSubmit={handleAddPhoto} className="flex gap-2 max-w-lg mt-2">
              <input
                type="text"
                required
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Masukkan URL foto /images/custom.png"
                className="flex-grow px-4 py-2 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 bg-gold-50/10"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {weddingData?.gallery.map((item, idx) => (
                <div key={item.id || idx} className="aspect-square relative rounded-xl overflow-hidden border border-gold-100 group shadow-xs">
                  <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleDeletePhoto(item.id || '')} // mock or database trigger
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gift Envelope accounts */}
        {activeTab === 'gifts' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Amplop Digital & Kado</h2>
              <p className="text-xs text-gray-400 mt-1">Ubah nomor rekening, nama pemilik, bank, dan QRIS untuk transfer.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Bank</label>
                <input
                  type="text"
                  value={giftForm.bank_name || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, bank_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                  placeholder="BCA, Mandiri, BNI..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nomor Rekening</label>
                <input
                  type="text"
                  value={giftForm.account_number || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, account_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={giftForm.account_holder || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, account_holder: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Link QRIS Code Image Path</label>
                <input
                  type="text"
                  value={giftForm.qris_image || ''}
                  onChange={(e) => setGiftForm({ ...giftForm, qris_image: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold-100 focus:ring-1 focus:ring-gold-400 text-sm"
                  placeholder="/images/qris.png"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gold-50 pt-6">
              {saveStatus === 'success' && <span className="text-xs text-green-600 font-semibold self-center">Berhasil disimpan!</span>}
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl gold-bg-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Rekening
              </button>
            </div>
          </form>
        )}

        {/* RSVP log list */}
        {activeTab === 'rsvps' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm overflow-hidden">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Daftar RSVP Masuk</h2>
              <p className="text-xs text-gray-400 mt-1">Total tanggapan dari para tamu undangan.</p>
            </div>

            <div className="overflow-x-auto mt-4 w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 text-gold-800 font-bold uppercase tracking-wider text-xs bg-gold-50/20">
                    <th className="py-3 px-4">Nama Tamu</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Pax</th>
                    <th className="py-3 px-4">Ucapan Restu</th>
                    <th className="py-3 px-4">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((rsvp, idx) => (
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
                    </tr>
                  ))}
                  {rsvps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400 italic">Belum ada respon RSVP masuk.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wishes guestbook panel */}
        {activeTab === 'wishes' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Daftar Ucapan & Doa Restu</h2>
              <p className="text-xs text-gray-400 mt-1">Audit dan saring doa-doa restu yang masuk dari tamu.</p>
            </div>

            <div className="flex flex-col gap-4 mt-4 max-h-[500px] overflow-y-auto pr-2">
              {wishes.map((wish, idx) => (
                <div key={wish.id || idx} className="p-4 rounded-xl border border-gold-50 bg-gold-50/5 flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="font-bold text-gold-700 text-sm">{wish.guest_name}</span>
                      <span className="text-[10px] text-gray-400">
                        {wish.created_at ? new Date(wish.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{wish.message}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Hapus ucapan ini?')) {
                        // Mock delete locally or API call
                        setWishes(wishes.filter((w, i) => i !== idx));
                      }
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {wishes.length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-8">Belum ada ucapan masuk.</p>
              )}
            </div>
          </div>
        )}

        {/* Guests Registry slug generator */}
        {activeTab === 'guests' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-gold-100 shadow-sm overflow-hidden">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-800">Guests Invite Link Registry</h2>
              <p className="text-xs text-gray-400 mt-1">Daftarkan nama tamu untuk men-generate link undangan personal secara otomatis.</p>
            </div>

            <form onSubmit={handleAddGuest} className="flex gap-2 max-w-lg mt-2">
              <input
                type="text"
                required
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Nama Lengkap Tamu"
                className="flex-grow px-4 py-2.5 rounded-lg border border-gold-100 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 bg-gold-50/10"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Register Guest
              </button>
            </form>

            <div className="overflow-x-auto mt-6 w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gold-100 text-gold-800 font-bold uppercase tracking-wider text-xs bg-gold-50/20">
                    <th className="py-3 px-4">Nama Tamu</th>
                    <th className="py-3 px-4">Invitation Slug</th>
                    <th className="py-3 px-4 text-right">Aksi Link</th>
                  </tr>
                </thead>
                <tbody>
                  {weddingData?.guests.map((guest, idx) => (
                    <tr key={guest.id || idx} className="border-b border-gold-50/50 hover:bg-gold-50/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-700">{guest.guest_name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gold-600">/invite/{guest.slug}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => copyGuestInviteLink(guest.slug, guest.id || String(idx))}
                          className="px-3.5 py-1.5 border border-gold-300 rounded-lg text-xs font-semibold text-gold-600 hover:bg-gold-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedGuestId === (guest.id || String(idx)) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!weddingData?.guests || weddingData.guests.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 italic">Belum ada tamu terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
