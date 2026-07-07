'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { UploadZone } from './UploadZone';

interface MangaWork {
  id:         string;
  title:      string;
  kind:       string;
  language:   string;
  published:  boolean;
  views_count: number;
  cover_url:  string | null;
  created_at: string;
}

interface Props { initialWorks: MangaWork[] }

const KIND_LABELS: Record<string, string> = {
  manga:         'Manga',
  webtoon:       'Webtoon',
  bd:            'BD',
  artbook: 'Artbook',
};

export function MangaAdminPanel({ initialWorks }: Props) {
  const [works,       setWorks]     = useState<MangaWork[]>(initialWorks);
  const [showForm,    setShowForm]  = useState(false);
  const [title,       setTitle]     = useState('');
  const [kind,        setKind]      = useState<'manga' | 'webtoon' | 'bd' | 'artbook'>('manga');
  const [language,    setLang]      = useState('fr');
  const [description, setDesc]      = useState('');
  const [coverUrl,    setCoverUrl]  = useState('');
  const [saving,      setSaving]    = useState(false);
  const [formErr,     setFormErr]   = useState<string | null>(null);
  const tmpIdRef = useRef(crypto.randomUUID());

  async function createWork() {
    if (!title.trim()) { setFormErr('Le titre est requis'); return; }
    setSaving(true); setFormErr(null);
    try {
      const res = await fetch('/api/admin/manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, kind, language, description, cover_url: coverUrl }),
      });
      const json = await res.json();
      if (!res.ok) { setFormErr(json.error ?? 'Erreur'); return; }
      setWorks([json.work, ...works]);
      setTitle(''); setDesc(''); setCoverUrl(''); setShowForm(false);
      tmpIdRef.current = crypto.randomUUID();
    } catch { setFormErr('Erreur réseau'); }
    finally { setSaving(false); }
  }

  async function togglePublished(work: MangaWork) {
    const res = await fetch(`/api/admin/manga/${work.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !work.published }),
    });
    if (res.ok) {
      setWorks(works.map(w => w.id === work.id ? { ...w, published: !w.published } : w));
    }
  }

  async function deleteWork(id: string) {
    if (!confirm('Supprimer cette œuvre et toutes ses planches ?')) return;
    const res = await fetch(`/api/admin/manga/${id}`, { method: 'DELETE' });
    if (res.ok) setWorks(works.filter(w => w.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Mangas</h1>
        <button
          onClick={() => {
            if (showForm) { setTitle(''); setDesc(''); setCoverUrl(''); tmpIdRef.current = crypto.randomUUID(); }
            setShowForm(!showForm); setFormErr(null);
          }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Annuler' : '+ Nouvelle œuvre'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Nouvelle œuvre</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Titre *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Type *</label>
              <select value={kind} onChange={e => setKind(e.target.value as typeof kind)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="manga">Manga</option>
                <option value="webtoon">Webtoon</option>
                <option value="bd">BD</option>
                <option value="artbook">Artbook</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Langue *</label>
              <input value={language} onChange={e => setLang(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
          </div>
          {coverUrl && (
            <p className="text-xs text-green-600">Couverture uploadée ✓</p>
          )}
          <UploadZone
            type="cover"
            workId={tmpIdRef.current}
            label="Couverture (optionnel — uploadez après création si besoin)"
            onUpload={(r) => { if (r.type === 'cover') setCoverUrl(r.url); }}
          />
          {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          <button onClick={createWork} disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Création…' : 'Créer l\'œuvre'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Vues</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {works.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune œuvre</td></tr>
            )}
            {works.map(w => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/admin/manga/${w.id}`} className="hover:text-indigo-600">{w.title}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{KIND_LABELS[w.kind] ?? w.kind}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    w.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {w.published ? 'Publié' : 'Brouillon'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{(w.views_count ?? 0).toLocaleString('fr')}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => togglePublished(w)}
                    className="text-xs text-indigo-600 hover:underline">
                    {w.published ? 'Dépublier' : 'Publier'}
                  </button>
                  <Link href={`/admin/manga/${w.id}`} className="text-xs text-gray-600 hover:underline">Planches</Link>
                  <button onClick={() => deleteWork(w.id)}
                    className="text-xs text-red-500 hover:underline">Suppr.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
