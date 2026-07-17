'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { WeddingData, LoveStory } from '@/types/wedding';
import { Trash2, ArrowUp, ArrowDown, Edit3, Upload, Check, ImageIcon } from 'lucide-react';

interface LoveStoryManagerProps {
  weddingData: WeddingData;
  loadData: () => void;
}

export default function LoveStoryManager({ weddingData, loadData }: LoveStoryManagerProps) {
  const [stories, setStories] = useState<LoveStory[]>([]);
  const [editingStory, setEditingStory] = useState<Partial<LoveStory> | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [storyDate, setStoryDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (weddingData.loveStories) {
      setStories([...weddingData.loveStories].sort((a, b) => a.sort_order - b.sort_order));
    } else {
      setStories([]);
    }
  }, [weddingData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'wedding-info');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setImageUrl(json.url);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSaving(true);
    try {
      let updatedStories: LoveStory[] = [];
      const defaultSortOrder = stories.length > 0 ? Math.max(...stories.map(s => s.sort_order)) + 1 : 0;

      if (editingStory && editingStory.id) {
        // Editing existing story
        updatedStories = stories.map(s => 
          s.id === editingStory.id 
            ? { ...s, title, story_date: storyDate, description, image_url: imageUrl } 
            : s
        );
      } else {
        // Adding new story
        const newStory: LoveStory = {
          title,
          story_date: storyDate,
          description,
          image_url: imageUrl || undefined,
          sort_order: defaultSortOrder,
        };
        updatedStories = [...stories, newStory];
      }

      // Re-normalize sort orders by index to prevent collisions
      updatedStories = updatedStories
        .map((s, idx) => ({ ...s, sort_order: idx }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loveStories: updatedStories }),
      });

      if (res.ok) {
        resetForm();
        loadData();
      }
    } catch (err) {
      console.error('Failed to save story:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (story: LoveStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setStoryDate(story.story_date);
    setDescription(story.description);
    setImageUrl(story.image_url || '');
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Hapus cerita ini dari timeline?')) return;
    try {
      const updatedStories = stories
        .filter(s => s.id !== id)
        .map((s, idx) => ({ ...s, sort_order: idx }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loveStories: updatedStories }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newStories = [...stories];
    const swapTarget = direction === 'up' ? index - 1 : index + 1;
    
    if (swapTarget < 0 || swapTarget >= newStories.length) return;

    // Swap positions
    const temp = newStories[index];
    newStories[index] = newStories[swapTarget];
    newStories[swapTarget] = temp;

    // Normalize sort orders
    const updatedStories = newStories.map((s, idx) => ({
      ...s,
      sort_order: idx
    }));

    try {
      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loveStories: updatedStories }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update timeline order:', err);
    }
  };

  const resetForm = () => {
    setEditingStory(null);
    setTitle('');
    setStoryDate('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      
      {/* Dynamic Form Editor */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 self-start">
        <h3 className="font-serif font-bold text-gray-800 text-lg">
          {editingStory ? '✏️ Edit Momen Cerita' : '➕ Tambah Momen Cerita'}
        </h3>
        
        <form onSubmit={handleSaveStory} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Judul Momen</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Contoh: Awal Bertemu"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal / Penanda Waktu</label>
            <input
              type="text"
              value={storyDate}
              onChange={(e) => setStoryDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Contoh: Januari 2024 atau 12.12.2024"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi Cerita</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
              placeholder="Ceritakan momen indah ini..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Foto Momen (Opsional)</label>
            <div className="flex flex-col gap-3">
              {imageUrl && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <Image src={imageUrl} alt="Upload preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gold-500 p-4 rounded-xl cursor-pointer text-gray-500 text-xs font-semibold hover:text-gold-600 transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengunggah...' : 'Pilih & Unggah Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {editingStory && (
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
              {saving ? 'Menyimpan...' : 'Simpan Momen'}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline List View */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <h3 className="font-serif font-bold text-gray-800 text-lg">📈 Timeline Cerita</h3>
        
        {stories.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-white">
            <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400 italic">Belum ada momen dalam cerita. Tambahkan momen pertama Anda di form sebelah kiri.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stories.map((story, idx) => (
              <div 
                key={story.id || idx}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
              >
                <div className="flex gap-4 items-center flex-grow text-left">
                  {story.image_url ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
                      <Image src={story.image_url} alt="" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0 text-gold-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase text-gold-600 tracking-wider bg-gold-50 px-2 py-0.5 rounded-md">
                      {story.story_date}
                    </span>
                    <h4 className="font-bold text-gray-800 mt-1.5 text-sm">{story.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{story.description}</p>
                  </div>
                </div>

                {/* Operations / Actions */}
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
                    disabled={idx === stories.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(story)}
                    className="p-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 rounded-lg text-indigo-600 cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id || '')}
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
