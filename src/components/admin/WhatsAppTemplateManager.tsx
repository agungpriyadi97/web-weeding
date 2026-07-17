'use client';

import React, { useState, useEffect } from 'react';
import { WeddingData, WhatsAppTemplate } from '@/types/wedding';
import { Check, Save, Info } from 'lucide-react';

interface WhatsAppTemplateManagerProps {
  weddingData: WeddingData;
  loadData: () => void;
}

export default function WhatsAppTemplateManager({ weddingData, loadData }: WhatsAppTemplateManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [editingText, setEditingText] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

  const fallbackTemplate = `Kepada Yth.\nBapak/Ibu/Saudara/i\n*{{GUEST_NAME}}*\n\n*Assalamualaikum Warahmatullahi Wabarakatuh*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:\n\n*{{GROOM_NAME}} & {{BRIDE_NAME}}*\n\nDetail undangan dapat diakses melalui tautan berikut:\n{{INVITATION_URL}}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\n*Wassalamualaikum Warahmatullahi Wabarakatuh*\n\nTerima kasih.`;

  useEffect(() => {
    if (weddingData.whatsappTemplates && weddingData.whatsappTemplates.length > 0) {
      setTemplates(weddingData.whatsappTemplates);
      
      const activeId = weddingData.themeSettings?.active_whatsapp_template_id || 
                       weddingData.whatsappTemplates.find(t => t.is_default)?.id || 
                       weddingData.whatsappTemplates[0].id || '';
      
      setActiveTemplateId(activeId);
      
      const activeTpl = weddingData.whatsappTemplates.find(t => t.id === activeId);
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
      
      if (activeTemplateId === 'fallback-tpl') {
        // Saving fallback for first time as a real record
        const newTpl: WhatsAppTemplate = {
          name: templateName,
          template_text: editingText,
          is_default: true
        };
        payloadTemplates = [newTpl];
      } else {
        payloadTemplates = templates.map(t => 
          t.id === activeTemplateId 
            ? { ...t, name: templateName, template_text: editingText } 
            : t
        );
      }

      const res = await fetch('/api/wedding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappTemplates: payloadTemplates,
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
    const newId = `new-tpl-${Date.now()}`;
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Template Selectors Panel */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 self-start">
        <h3 className="font-serif font-bold text-gray-800 text-lg">📝 WhatsApp Template</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Pilih template pesan untuk membagikan undangan Anda ke daftar tamu undangan via WhatsApp.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id || '')}
              className={`p-4 rounded-xl border text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                activeTemplateId === t.id
                  ? 'border-gold-500 bg-gold-50/40 text-gold-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.name}
              {t.is_default && <span className="text-[9px] bg-gold-200/50 text-gold-800 px-2 py-0.5 rounded-full lowercase">default</span>}
            </button>
          ))}

          <button
            onClick={handleCreateNewTemplate}
            className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold-500 text-gray-500 hover:text-gold-600 transition-colors text-xs font-semibold text-center cursor-pointer"
          >
            + Buat Template Baru
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-serif font-bold text-gray-800 text-lg">✏️ Edit Text Template</h3>
        
        <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">Nama Template</label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500"
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-1 focus:ring-gold-500 font-mono text-gray-700 leading-relaxed"
            />
          </div>

          <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold">Daftar Variabel Placeholder:</p>
              <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
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
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
}
