'use client';

import { useRef, useState } from 'react';

export type UploadResult =
  | { type: 'cover';   url: string }
  | { type: 'page';    path: string }
  | { type: 'tableau'; url: string; thumbnailUrl: string; tableauId: string };

interface Props {
  type:         'cover' | 'page' | 'tableau';
  workId?:      string;
  pageNumber?:  number;
  tableauId?:   string;
  label?:       string;
  onUpload:     (result: UploadResult) => void;
}

export function UploadZone({ type, workId, pageNumber, tableauId, label, onUpload }: Props) {
  const inputRef            = useRef<HTMLInputElement>(null);
  const [dragging, setDrag] = useState(false);
  const [loading,  setLoad] = useState(false);
  const [err,      setErr]  = useState<string | null>(null);

  async function upload(file: File) {
    setLoad(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      if (workId)     form.append('workId',     workId);
      if (pageNumber) form.append('pageNumber', String(pageNumber));
      if (tableauId)  form.append('tableauId',  tableauId);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* réponse non-JSON (erreur serveur texte brut) */ }
      if (!res.ok) {
        setErr((json.error as string) ?? `Erreur ${res.status} — vérifiez les variables d'environnement Vercel`);
        return;
      }
      onUpload({ type, ...json } as UploadResult);
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setLoad(false);
    }
  }

  function onFiles(files: FileList | null) {
    if (files?.[0]) upload(files[0]);
  }

  return (
    <div className="space-y-1">
      <div
        role="button"
        tabIndex={0}
        aria-label={label ?? 'Zone de dépôt'}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors
          ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'}`}
      >
        {loading ? (
          <span className="text-sm text-indigo-600 animate-pulse">Conversion et upload…</span>
        ) : (
          <>
            <span className="text-2xl select-none">&#8679;</span>
            <span className="text-sm text-gray-500">{label ?? 'Glisser une image ou cliquer'}</span>
            <span className="text-xs text-gray-400">JPEG · PNG · WebP · GIF — max 25 Mo</span>
          </>
        )}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
