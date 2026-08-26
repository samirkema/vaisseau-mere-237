'use client';

import { useState } from 'react';
import { UploadZone } from './UploadZone';

interface MangaPage {
  id:          string;
  page_number: number;
  image_url:   string;
}

interface MangaWork {
  id:          string;
  title:       string;
  kind:        string;
  language:    string;
  published:   boolean;
  description: string | null;
  cover_url:   string | null;
}

interface Props {
  work:         MangaWork;
  initialPages: MangaPage[];
}

export function MangaPagesManager({ work, initialPages }: Props) {
  const [pages,     setPages]    = useState<MangaPage[]>(initialPages);
  const [published, setPub]      = useState(work.published);
  const [nextPage,  setNextPage] = useState(
    initialPages.length > 0 ? Math.max(...initialPages.map(p => p.page_number)) + 1 : 1,
  );
  const [saving,    setSaving]   = useState(false);
  const [err,       setErr]      = useState<string | null>(null);

  async function deletePage(pageId: string) {
    if (!confirm('Supprimer cette planche ?')) return;
    const res = await fetch(`/api/admin/manga/${work.id}/pages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId }),
    });
    if (res.ok) setPages(pages.filter(p => p.id !== pageId));
  }

  async function togglePublish() {
    setSaving(true);
    const res = await fetch(`/api/admin/manga/${work.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    });
    if (res.ok) setPub(!published);
    setSaving(false);
  }

  async function afterPageUpload(path: string) {
    setErr(null);
    const res = await fetch(`/api/admin/manga/${work.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_number: nextPage, image_url: path }),
    });
    const json = await res.json();
    if (!res.ok) { setErr(json.error ?? 'Erreur'); return; }
    setPages([...pages, json.page].sort((a, b) => a.page_number - b.page_number));
    setNextPage(nextPage + 1);
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{work.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{work.kind} · {work.language}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {published ? 'Publié' : 'Brouillon'}
          </span>
          <button onClick={togglePublish} disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {saving ? '…' : published ? 'Dépublier' : 'Publier'}
          </button>
        </div>
      </div>

      {/* Upload nouvelle planche */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Ajouter planche n°{nextPage}
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500">N° page :</label>
          <input
            type="number" min={1} max={10000} value={nextPage}
            onChange={e => setNextPage(parseInt(e.target.value, 10) || 1)}
            className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <UploadZone
          type="page"
          workId={work.id}
          pageNumber={nextPage}
          label={`Planche n°${nextPage} — glisser ou cliquer`}
          onUpload={(r) => { if (r.type === 'page') afterPageUpload(r.path); }}
        />
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>

      {/* Liste des planches */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Planches ({pages.length})
        </h2>
        {pages.length === 0 && (
          <p className="text-sm text-gray-400">Aucune planche uploadée.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pages.map(p => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[3/4]">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-mono">p.{p.page_number}</span>
              </div>
              <button
                onClick={() => deletePage(p.id)}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                #{p.page_number}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
