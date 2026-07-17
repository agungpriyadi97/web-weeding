'use client';

import React, { useState, useEffect } from 'react';
import { WeddingData, WeddingEvent } from '@/types/wedding';
import { Plus, Trash2, Edit3, Check, Calendar, MapPin, Clock, ArrowUp, ArrowDown } from 'lucide-react';

interface EventManagerProps {
  weddingData: WeddingData;
  loadData: () => void;
}

export default function EventManager({ weddingData, loadData }: EventManagerProps) {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<Partial<WeddingEvent> | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (weddingData.events) {
      setEvents([...weddingData.events].sort((a, b) => a.sort_order - b.sort_order));
    } else {
      setEvents([]);
    }
  }, [weddingData]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventDate || !eventTime.trim() || !location.trim() || !address.trim() || !googleMapsUrl.trim()) {
      alert('Mohon isi semua field acara!');
      return;
    }

    setSaving(true);
    try {
      let updatedEvents: WeddingEvent[] = [];
      const defaultSortOrder = events.length > 0 ? Math.max(...events.map(ev => ev.sort_order)) + 1 : 0;

      if (editingEvent && editingEvent.id) {
        // Editing existing event
        updatedEvents = events.map(ev => 
          ev.id === editingEvent.id 
            ? { ...ev, name, event_date: eventDate, event_time: eventTime, location, address, google_maps_url: googleMapsUrl } 
            : ev
        );
      } else {
        // Adding new event
        const newEvent: WeddingEvent = {
          name,
          event_date: eventDate,
          event_time: eventTime,
          location,
          address,
          google_maps_url: googleMapsUrl,
          sort_order: defaultSortOrder
        };
        updatedEvents = [...events, newEvent];
      }

      // Re-normalize indices
      updatedEvents = updatedEvents.map((ev, idx) => ({ ...ev, sort_order: idx }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents }),
      });

      if (res.ok) {
        resetForm();
        loadData();
      }
    } catch (err) {
      console.error('Failed to save event:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (ev: WeddingEvent) => {
    setEditingEvent(ev);
    setName(ev.name);
    setEventDate(ev.event_date);
    setEventTime(ev.event_time);
    setLocation(ev.location);
    setAddress(ev.address);
    setGoogleMapsUrl(ev.google_maps_url);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Hapus acara ini?')) return;
    try {
      const updatedEvents = events
        .filter(ev => ev.id !== id)
        .map((ev, idx) => ({ ...ev, sort_order: idx }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newEvents = [...events];
    const swapTarget = direction === 'up' ? index - 1 : index + 1;
    
    if (swapTarget < 0 || swapTarget >= newEvents.length) return;

    // Swap positions
    const temp = newEvents[index];
    newEvents[index] = newEvents[swapTarget];
    newEvents[swapTarget] = temp;

    // Normalize sort orders
    const updatedEvents = newEvents.map((ev, idx) => ({
      ...ev,
      sort_order: idx
    }));

    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update event order:', err);
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    setName('');
    setEventDate('');
    setEventTime('');
    setLocation('');
    setAddress('');
    setGoogleMapsUrl('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Editor Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 self-start">
        <h3 className="font-serif font-bold text-gray-800 text-lg">
          {editingEvent ? '✏️ Edit Acara' : '➕ Tambah Acara Baru'}
        </h3>

        <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Acara</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Contoh: Akad Nikah, Resepsi, Siraman"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Waktu / Jam</label>
              <input
                type="text"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
                placeholder="09:00 - Selesai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lokasi</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Contoh: Hotel Mulia Senayan"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
            <textarea
              rows={3}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Jalan Asia Afrika Senayan..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Link Google Maps</label>
            <input
              type="url"
              required
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex gap-2 mt-2">
            {editingEvent && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-grow py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Acara'}
            </button>
          </div>
        </form>
      </div>

      {/* Events List View */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <h3 className="font-serif font-bold text-gray-800 text-lg">📅 Daftar Acara</h3>

        {events.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-white">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400 italic">Belum ada acara kustom. Gunakan form sebelah kiri untuk menambahkan Akad/Resepsi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
              >
                <div className="flex-grow flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800 text-base">{ev.name}</h4>
                    <span className="px-2 py-0.5 bg-gold-50 border border-gold-200 text-gold-700 font-bold rounded-full text-[9px] uppercase tracking-wider">
                      Urutan #{idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gold-500" />
                      {ev.event_date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold-500" />
                      {ev.event_time}
                    </span>
                    <span className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      {ev.location} ({ev.address})
                    </span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={idx === events.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(ev)}
                    className="p-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 rounded-lg text-indigo-600 cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.id || '')}
                    className="p-2 bg-red-50 border border-red-150 hover:bg-red-100 rounded-lg text-red-600 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
