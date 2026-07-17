'use client';

import React, { useState } from 'react';
import { getAllThemes, ThemeConfig } from '@/themes';
import { WeddingData, ThemeSettings } from '@/types/wedding';
import InvitationPage from '../InvitationPage';
import { X, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeGalleryProps {
  weddingData: WeddingData;
  loadData: () => void;
}

export default function ThemeGallery({ weddingData, loadData }: ThemeGalleryProps) {
  const themes = getAllThemes();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'traditional' | 'luxury' | 'modern' | 'religious'>('all');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeThemeId = weddingData.event.theme || 'elegant-gold';
  const themeSettings = weddingData.themeSettings || { gallery_layout: 'grid', effect: 'none' };

  // Filtered themes
  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(t => t.category === selectedCategory);

  const handleApplyTheme = async (themeId: string) => {
    setSavingId(themeId);
    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: {
            ...weddingData.event,
            theme: themeId
          }
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to apply theme:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateSettings = async (field: keyof ThemeSettings, value: string) => {
    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeSettings: {
            ...themeSettings,
            [field]: value
          }
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update theme settings:', err);
    }
  };

  const categories: { id: 'all' | 'traditional' | 'luxury' | 'modern' | 'religious'; name: string }[] = [
    { id: 'all', name: 'Semua Kategori' },
    { id: 'traditional', name: '🏛 Tradisional' },
    { id: 'luxury', name: '✨ Luxury' },
    { id: 'modern', name: '🌿 Modern' },
    { id: 'religious', name: '🕌 Religious' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Settings: Layout & Particle Effects */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tata Letak Galeri (Layout)</label>
          <select
            value={themeSettings.gallery_layout}
            onChange={(e) => handleUpdateSettings('gallery_layout', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 bg-gray-50/50"
          >
            <option value="grid">Classic Grid</option>
            <option value="masonry">Masonry</option>
            <option value="pinterest">Pinterest</option>
            <option value="carousel">Carousel</option>
            <option value="album">Album</option>
            <option value="scroll">Horizontal Scroll</option>
            <option value="polaroid">Polaroid Frames</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Efek Animasi Latar Belakang</label>
          <select
            value={themeSettings.effect}
            onChange={(e) => handleUpdateSettings('effect', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 bg-gray-50/50"
          >
            <option value="none">Tanpa Efek (None)</option>
            <option value="sakura">Sakura (Cherry Blossom)</option>
            <option value="rose">Rose Petal (Kelopak Mawar)</option>
            <option value="confetti">Confetti (Pesta)</option>
            <option value="sparkle">Sparkle (Kilau Emas)</option>
            <option value="snow">Snow (Salju)</option>
            <option value="bubble">Bubble (Gelembung Sabun)</option>
            <option value="fireflies">Fireflies (Kunang-Kunang)</option>
            <option value="lantern">Lantern (Lampion Terbang)</option>
          </select>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap tracking-wide cursor-pointer transition-all ${
              selectedCategory === cat.id
                ? 'bg-gold-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredThemes.map((t) => {
          const isActive = t.id === activeThemeId;
          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isActive ? 'ring-2 ring-gold-500 border-transparent' : 'border-gray-200'
              }`}
            >
              <div>
                {/* Visual placeholder color based card banner */}
                <div 
                  className="h-28 w-full p-4 flex flex-col justify-between"
                  style={{ backgroundColor: t.colors.secondary }}
                >
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md w-fit bg-black/5 text-gray-600">
                    {t.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.colors.accent }} />
                  </div>
                </div>

                <div className="p-5 text-left">
                  <h3 className="font-serif font-bold text-gray-800 text-base">{t.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed min-h-[40px]">{t.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => setPreviewThemeId(t.id)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs tracking-wider uppercase transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => handleApplyTheme(t.id)}
                  disabled={isActive || savingId !== null}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isActive 
                      ? 'bg-green-50 text-green-600 cursor-default font-black' 
                      : 'bg-gold-500 text-white hover:bg-gold-600 active:scale-95 shadow-sm'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Aktif
                    </>
                  ) : savingId === t.id ? (
                    'Saving...'
                  ) : (
                    'Gunakan'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {previewThemeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end sm:justify-center p-0 sm:p-4"
          >
            {/* Header controls bar */}
            <div className="bg-white/95 border-b border-gray-100 p-4 flex items-center justify-between shadow-md relative z-10 w-full max-w-5xl mx-auto rounded-t-2xl sm:rounded-2xl sm:mb-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-serif font-bold text-gray-800">Preview Tema:</span>
                <span className="px-3 py-1 bg-gold-50 border border-gold-200 text-gold-700 text-xs font-bold rounded-full">
                  {themes.find(t => t.id === previewThemeId)?.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleApplyTheme(previewThemeId);
                    setPreviewThemeId(null);
                  }}
                  className="px-5 py-2 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs tracking-widest uppercase cursor-pointer"
                >
                  Gunakan Tema Ini
                </button>
                <button
                  onClick={() => setPreviewThemeId(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render Preview Frame */}
            <div className="w-full max-w-5xl mx-auto flex-grow bg-white sm:rounded-2xl overflow-y-auto shadow-2xl relative border border-gray-100 max-h-[85vh]">
              <InvitationPage
                initialData={weddingData}
                guestName="Agung Priyadi &amp; Istri"
                previewThemeId={previewThemeId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
