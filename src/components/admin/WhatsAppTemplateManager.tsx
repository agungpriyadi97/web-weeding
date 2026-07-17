'use client';

import React, { useState, useEffect } from 'react';
import { WeddingData, WhatsAppTemplate } from '@/types/wedding';
import { Save, Info, Trash2, Check } from 'lucide-react';

interface WhatsAppTemplateManagerProps {
  weddingData: WeddingData;
  loadData: () => void;
}

const fallbackTemplate = `Kepada Yth.\nBapak/Ibu/Saudara/i\n*{{GUEST_NAME}}*\n\n*Assalamualaikum Warahmatullahi Wabarakatuh*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:\n\n*{{GROOM_NAME}} & {{BRIDE_NAME}}*\n\nDetail undangan dapat diakses melalui tautan berikut:\n{{INVITATION_URL}}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\n*Wassalamualaikum Warahmatullahi Wabarakatuh*\n\nTerima kasih.`;

export default function WhatsAppTemplateManager({ weddingData, loadData }: WhatsAppTemplateManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [editingText, setEditingText] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper to generate a valid v4 UUID client-side
  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    if (weddingData.whatsappTemplates && weddingData.whatsappTemplates.length > 0) {
      setTemplates(weddingData.whatsappTemplates);
      
      const savedActiveId = weddingData.themeSettings?.active_whatsapp_template_id || 
                            weddingData.whatsappTemplates.find(t => t.is_default)?.id || 
                            weddingData.whatsappTemplates[0].id || '';
      
      setActiveTemplateId(savedActiveId);
      
      const activeTpl = weddingData.whatsappTemplates.find(t => t.id === savedActiveId);
      if (activeTpl) {
        setEditingText(activeTpl.template_text);
        setTemplateName(activeTpl.name);
      }
    } else {
      // Setup fallback template state
      setTemplates([{
        id: 'fallback-tpl',
        name: 'Template Formal',
        template_text: fallbackTemplate,
        is_default: true
      }]);
      setActiveTemplateId('fallback-tpl');
      setEditingText(fallbackTemplate);
      setTemplateName('Template Formal');
    }
  }, [weddingData]);

  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    const selected = templates.find(t => t.id === id);
    if (selected) {
      setEditingText(selected.template_text);
      setTemplateName(selected.name);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let payloadTemplates = [...templates];
      let selectedId = activeTemplateId;
      
      if (activeTemplateId === 'fallback-tpl') {
        // Saving fallback for first time as a real record
        const newId = generateUUID();
        const newTpl: WhatsAppTemplate = {
          id: newId,
          name: templateName,
          template_text: editingText,
          is_default: true
        };
        payloadTemplates = [newTpl];
        selectedId = newId;
        setActiveTemplateId(newId);
      } else {
        payloadTemplates = templates.map(t => 
          t.id === activeTemplateId 
            ? { ...t, name: templateName, template_text: editingText } 
            : t
        );
      }

      // Enforce only one template is marked is_default if payload has it
      // Let's set the selected active template as is_default for fallback safety
      payloadTemplates = payloadTemplates.map(t => ({
        ...t,
        is_default: t.id === selectedId
      }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappTemplates: payloadTemplates,
          themeSettings: {
            ...weddingData.themeSettings,
            active_whatsapp_template_id: selectedId
          }
        })
      });

      if (res.ok) {
        alert('Template pesan WhatsApp berhasil disimpan!');
        loadData();
      }
    } catch (err) {
      console.error('Failed to save whatsapp template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewTemplate = () => {
    const newId = generateUUID();
    const newTpl: WhatsAppTemplate = {
      id: newId,
      name: 'Template Baru',
      template_text: fallbackTemplate,
      is_default: false
    };
    
    setTemplates([...templates, newTpl]);
    setActiveTemplateId(newId);
    setTemplateName('Template Baru');
    setEditingText(fallbackTemplate);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (id === 'fallback-tpl') {
      alert('Template default tidak dapat dihapus.');
      return;
    }
    if (!confirm('Hapus template WhatsApp ini?')) return;

    try {
      const updatedTemplates = templates.filter(t => t.id !== id);
      
      // Select another template as active if we deleted the current one
      let newActiveId = activeTemplateId;
      if (activeTemplateId === id) {
        newActiveId = updatedTemplates[0]?.id || 'fallback-tpl';
        const selected = updatedTemplates[0];
        if (selected) {
          setEditingText(selected.template_text);
          setTemplateName(selected.name);
        } else {
          setEditingText(fallbackTemplate);
          setTemplateName('Template Formal');
        }
      }
      setActiveTemplateId(newActiveId);

      // Make sure at least one default remains
      const finalizedTemplates = updatedTemplates.map((t, idx) => ({
        ...t,
        is_default: idx === 0
      }));

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappTemplates: finalizedTemplates,
          themeSettings: {
            ...weddingData.themeSettings,
            active_whatsapp_template_id: newActiveId === 'fallback-tpl' ? null : newActiveId
          }
        })
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const currentDbActiveId = weddingData.themeSettings?.active_whatsapp_template_id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Template Selectors Panel */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 self-start w-full">
        <h3 className="font-serif font-bold text-gray-800 text-lg">📝 WhatsApp Template</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Pilih template pesan untuk membagikan undangan Anda ke daftar tamu undangan via WhatsApp.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          {templates.map(t => {
            const isCurrentlySelected = activeTemplateId === t.id;
            const isSavedActive = currentDbActiveId === t.id || (t.is_default && !currentDbActiveId);
            
            return (
              <div key={t.id} className="relative group w-full flex items-center">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(t.id || '')}
                  className={`w-full p-4 pr-12 rounded-xl border text-left text-xs font-bold uppercase tracking-wider transition-all flex flex-col gap-1 cursor-pointer ${
                    isCurrentlySelected
                      ? 'border-gold-500 bg-gold-50/40 text-gold-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate max-w-[150px] sm:max-w-none">{t.name}</span>
                  {isSavedActive && (
                    <span className="text-[9px] bg-green-150 text-green-700 px-2 py-0.5 rounded-full lowercase w-fit font-semibold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> aktif
                    </span>
                  )}
                </button>
                {t.id !== 'fallback-tpl' && templates.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t.id || '');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-75 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title="Hapus Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleCreateNewTemplate}
            className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold-500 text-gray-500 hover:text-gold-600 transition-colors text-xs font-semibold text-center cursor-pointer"
          >
            + Buat Template Baru
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 w-full">
        <h3 className="font-serif font-bold text-gray-800 text-lg">✏️ Edit Text Template</h3>
        
        <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">Nama Template</label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 bg-white"
              placeholder="Contoh: Template Undangan Formal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">Isi Template Pesan</label>
            <textarea
              rows={12}
              required
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 font-mono text-gray-700 leading-relaxed bg-white"
            />
          </div>

          <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold">Daftar Variabel Placeholder:</p>
              <ul className="list-disc pl-4 mt-1 flex flex-col gap-1 font-sans">
                <li><code className="font-bold font-mono">{"{{GUEST_NAME}}"}</code> : Diganti otomatis dengan Nama Tamu.</li>
                <li><code className="font-bold font-mono">{"{{GROOM_NAME}}"}</code> : Diganti dengan Nama Pengantin Pria.</li>
                <li><code className="font-bold font-mono">{"{{BRIDE_NAME}}"}</code> : Diganti dengan Nama Pengantin Wanita.</li>
                <li><code className="font-bold font-mono">{"{{INVITATION_URL}}"}</code> : Link unik undangan tamu.</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan & Aktifkan Template'}
          </button>
        </form>
      </div>
    </div>
  );
}
