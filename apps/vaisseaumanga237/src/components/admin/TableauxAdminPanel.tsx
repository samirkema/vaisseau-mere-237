'use client';

import { useRef, useState } from 'react';
import { UploadZone } from './UploadZone';

interface FormatEntry {
  label:     string;
  price_eur: number;
}

interface Tableau {
  id:         string;
  title:      string;
  artist:     string | null;
  thumbnail:  string;
  price_eur:  number | null;
  formats:    FormatEntry[] | null;
  images:     string[] | null;
  available:  boolean;
  created_at: string;
}

interface FormatInput { label: string; price_eur: string }

interface Props { initialTableaux: Tableau[] }

export function TableauxAdminPanel({ initialTableaux }: Props) {
  const [items,       setItems]     = useState<Tableau[]>(initialTableaux);
  const [showForm,    setShowForm]  = useState(false);
  const [title,       setTitle]     = useState('');
  const [artist,      setArtist]    = useState('');
  const [description, setDesc]      = useState('');
  const [formats,     setFormats]   = useState<FormatInput[]>([{ label: '', price_eur: '' }]);
  const [uploadedMain,  setMain]    = useState('');
  const [uploadedThumb, setThumb]   = useState('');
  const [uploadedTid,   setTid]     = useState('');
  const [extraImages,   setExtras]  = useState<string[]>([]);
  const [extraLoading,  setExtLoad] = useState(false);
  const [extraErr,      setExtErr]  = useState<string | null>(null);
  const extraInputRef               = useRef<HTMLInputElement>(null);
  const [saving,      setSaving]    = useState(false);
  const [formErr,     setFormErr]   = useState<string | null>(null);

  function addFormat() {
    setFormats(prev => [...prev, { label: '', price_eur: '' }]);
  }
  function removeFormat(i: number) {
    setFormats(prev => prev.length <= 1 ? prev : prev.filter((_, j) => j !== i));
  }
  function updateFormat(i: number, field: keyof FormatInput, value: string) {
    setFormats(prev => prev.map((f, j) => j === i ? { ...f, [field]: value } : f));
  }

  async function uploadExtra(file: File) {
    if (!uploadedTid) return;
    setExtLoad(true); setExtErr(null);
    try {
      const slot = crypto.randomUUID();
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'tableau');
      form.append('tableauId', uploadedTid);
      form.append('slot', slot);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /**/ }
      if (!res.ok) { setExtErr((json.error as string) ?? `Erreur ${res.status}`); return; }
      setExtras(prev => [...prev, json.url as string]);
    } catch (err) {
      setExtErr(err instanceof Error ? err.message : 'Erreur réseau');
    } finally { setExtLoad(false); }
  }

  function resetForm() {
    setTitle(''); setArtist(''); setDesc('');
    setFormats([{ label: '', price_eur: '' }]);
    setMain(''); setThumb(''); setTid('');
    setExtras([]); setExtErr(null); setFormErr(null);
  }

  async function createTableau() {
    if (!title.trim()) { setFormErr('Le titre est requis'); return; }
    if (!uploadedMain) { setFormErr('Une image principale est requise'); return; }

    const validFormats = formats
      .filter(f => f.label.trim() && f.price_eur.trim())
      .map(f => ({ label: f.label.trim(), price_eur: parseFloat(f.price_eur) }))
      .filter(f => Number.isFinite(f.price_eur) && f.price_eur > 0);

    setSaving(true); setFormErr(null);
    try {
      const res = await fetch('/api/admin/tableaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, artist: artist || null, description: description || null,
          main_image: uploadedMain, thumbnail: uploadedThumb,
          formats: validFormats.length > 0 ? validFormats : null,
          images:  extraImages.length > 0 ? extraImages : null,
        }),
      });
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /**/ }
      if (!res.ok) { setFormErr((json.error as string) ?? `Erreur ${res.status}`); return; }
      setItems([json.tableau as Tableau, ...items]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormErr(`Erreur : ${err instanceof Error ? err.message : 'connexion impossible'}`);
    } finally { setSaving(false); }
  }

  async function toggleAvailable(item: Tableau) {
    const res = await fetch(`/api/admin/tableaux/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !item.available }),
    });
    if (res.ok) setItems(items.map(t => t.id === item.id ? { ...t, available: !t.available } : t));
  }

  async function deleteTableau(id: string) {
    if (!confirm('Supprimer ce tableau ?')) return;
    const res = await fetch(`/api/admin/tableaux/${id}`, { method: 'DELETE' });
    if (res.ok) setItems(items.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Tableaux</h1>
        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
          {showForm ? 'Annuler' : '+ Nouveau tableau'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Nouveau tableau</h2>

          {/* INFOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Titre *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Artiste</label>
              <input value={artist} onChange={e => setArtist(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
          </div>

          {/* FORMATS */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Formats & Prix</label>
            {formats.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={f.label} onChange={e => updateFormat(i, 'label', e.target.value)}
                  placeholder="Ex : A4 (21×30 cm)"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <div className="flex items-center gap-1">
                  <input type="number" min="0" step="0.01" value={f.price_eur}
                    onChange={e => updateFormat(i, 'price_eur', e.target.value)}
                    placeholder="Prix"
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <span className="text-xs text-gray-500">€</span>
                </div>
                <button onClick={() => removeFormat(i)} disabled={formats.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none px-1">×</button>
              </div>
            ))}
            <button onClick={addFormat} className="text-xs text-indigo-600 hover:underline">
              + Ajouter un format
            </button>
          </div>

          {/* IMAGE PRINCIPALE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Image principale *</label>
            {uploadedMain
              ? <p className="text-xs text-green-600 py-2">Image principale uploadée ✓ (thumbnail généré)</p>
              : (
                <UploadZone
                  type="tableau"
                  tableauId={uploadedTid || undefined}
                  label="Image principale — WebP + thumbnail générés automatiquement"
                  onUpload={(r) => {
                    if (r.type === 'tableau') {
                      setMain(r.url); setThumb(r.thumbnailUrl); setTid(r.tableauId);
                    }
                  }}
                />
              )
            }
          </div>

          {/* PHOTOS SUPPLÉMENTAIRES */}
          {uploadedMain && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Photos supplémentaires</label>
              <div className="flex flex-wrap gap-2 items-center">
                {extraImages.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                    <button onClick={() => setExtras(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center leading-none">
                      ×
                    </button>
                  </div>
                ))}
                <label className={`w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors
                  ${extraLoading ? 'border-gray-200 opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}`}>
                  {extraLoading
                    ? <span className="text-xs text-indigo-500 animate-pulse">…</span>
                    : <span className="text-2xl text-gray-400 leading-none">+</span>
                  }
                  <input ref={extraInputRef} type="file" className="sr-only"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    disabled={extraLoading}
                    onChange={e => { if (e.target.files?.[0]) { uploadExtra(e.target.files[0]); e.target.value = ''; } }} />
                </label>
              </div>
              {extraErr && <p className="text-xs text-red-600">{extraErr}</p>}
              {extraImages.length > 0 && (
                <p className="text-xs text-gray-400">{extraImages.length} photo{extraImages.length > 1 ? 's' : ''} supplémentaire{extraImages.length > 1 ? 's' : ''}</p>
              )}
            </div>
          )}

          {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          <button onClick={createTableau} disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Création…' : 'Créer le tableau'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-16">Thumb</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Artiste</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Photos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Aucun tableau</td></tr>
            )}
            {items.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {t.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail} alt="" className="w-12 h-8 object-cover rounded" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                <td className="px-4 py-3 text-gray-500">{t.artist ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {1 + (t.images?.length ?? 0)} photo{(1 + (t.images?.length ?? 0)) > 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {t.formats && t.formats.length > 0 ? (
                    <span className="text-xs">
                      {t.formats.length} format{t.formats.length > 1 ? 's' : ''}
                      {t.price_eur != null && ` — à partir de ${t.price_eur.toFixed(2)} €`}
                    </span>
                  ) : t.price_eur != null ? (
                    `${t.price_eur.toFixed(2)} €`
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    t.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.available ? 'Disponible' : 'Indisponible'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => toggleAvailable(t)} className="text-xs text-indigo-600 hover:underline">
                    {t.available ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => deleteTableau(t.id)} className="text-xs text-red-500 hover:underline">
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
