'use client';

import { useState } from 'react';
import type { DisplayConfig } from '@/lib/supabase/types';

interface Props {
  workId:        string;
  initialConfig: DisplayConfig | null;
}

const THEME_OPTIONS  = [
  { value: 'dark',  label: 'Sombre (défaut)' },
  { value: 'light', label: 'Clair' },
  { value: 'sepia', label: 'Sépia' },
] as const;

const GAP_OPTIONS = [
  { value: 'compact',  label: 'Compact' },
  { value: 'normal',   label: 'Normal (défaut)' },
  { value: 'spacious', label: 'Spacieux' },
] as const;

const WIDTH_OPTIONS = [
  { value: 'narrow', label: 'Étroit (512 px)' },
  { value: 'medium', label: 'Moyen (672 px — défaut)' },
  { value: 'wide',   label: 'Large (896 px)' },
] as const;

const THEME_BG: Record<string, string> = {
  dark:  '#0a0a0f',
  light: '#ffffff',
  sepia: '#f4ecd8',
};

export function DisplayConfigEditor({ workId, initialConfig }: Props) {
  const [cfg,    setCfg]   = useState<DisplayConfig>(initialConfig ?? {});
  const [saving, setSave]  = useState(false);
  const [msg,    setMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof DisplayConfig>(key: K, val: DisplayConfig[K] | '') {
    setCfg(prev => {
      const next = { ...prev };
      if (val === '' || val === undefined) delete next[key];
      else (next[key] as DisplayConfig[K]) = val as DisplayConfig[K];
      return next;
    });
  }

  async function save(configOverride?: DisplayConfig | null) {
    setSave(true); setMsg(null);
    const payload = configOverride !== undefined ? configOverride
      : Object.keys(cfg).length ? cfg : null;
    const res = await fetch(`/api/admin/manga/${workId}/display`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_config: payload }),
    });
    const json = await res.json();
    setMsg(res.ok
      ? { ok: true, text: payload === null ? 'Config réinitialisée ✓' : 'Enregistré ✓' }
      : { ok: false, text: json.error ?? 'Erreur' });
    if (res.ok && payload === null) setCfg({});
    setSave(false);
  }

  const previewBg   = cfg.backgroundColor || THEME_BG[cfg.theme ?? 'dark'] || '#0a0a0f';
  const previewAccent = cfg.accentColor || '#6366f1';
  const previewText = (cfg.theme === 'light' || cfg.theme === 'sepia') ? '#111827' : '#e5e7eb';

  return (
    <div className="space-y-6">
      {/* Aperçu */}
      <div
        className="rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3 transition-colors"
        style={{ backgroundColor: previewBg, color: previewText }}
        aria-label="Aperçu du thème lecteur"
      >
        <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: previewAccent }} aria-hidden="true" />
        <span className="text-sm font-medium">Aperçu — {cfg.theme ?? 'dark'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thème */}
        <div className="space-y-1">
          <label htmlFor="dc-theme" className="text-xs font-medium text-gray-700">Thème de base</label>
          <select id="dc-theme" value={cfg.theme ?? ''}
            onChange={e => set('theme', (e.target.value as DisplayConfig['theme']) || '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Défaut (sombre)</option>
            {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Espacement */}
        <div className="space-y-1">
          <label htmlFor="dc-gap" className="text-xs font-medium text-gray-700">Espacement entre planches</label>
          <select id="dc-gap" value={cfg.pageGap ?? ''}
            onChange={e => set('pageGap', (e.target.value as DisplayConfig['pageGap']) || '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Défaut (normal)</option>
            {GAP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Largeur */}
        <div className="space-y-1">
          <label htmlFor="dc-width" className="text-xs font-medium text-gray-700">Largeur maximale</label>
          <select id="dc-width" value={cfg.maxWidth ?? ''}
            onChange={e => set('maxWidth', (e.target.value as DisplayConfig['maxWidth']) || '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Défaut (moyen, 672 px)</option>
            {WIDTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Couleur de fond */}
        <div className="space-y-1">
          <label htmlFor="dc-bg" className="text-xs font-medium text-gray-700">Couleur de fond (override)</label>
          <div className="flex items-center gap-2">
            <input id="dc-bg" type="color" value={cfg.backgroundColor || '#0a0a0f'}
              onChange={e => set('backgroundColor', e.target.value)}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5" />
            <input type="text" value={cfg.backgroundColor ?? ''}
              onChange={e => set('backgroundColor', e.target.value || '')}
              placeholder="Vide = thème"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        {/* Couleur d'accent */}
        <div className="space-y-1">
          <label htmlFor="dc-accent" className="text-xs font-medium text-gray-700">Couleur d'accent (override)</label>
          <div className="flex items-center gap-2">
            <input id="dc-accent" type="color" value={cfg.accentColor || '#6366f1'}
              onChange={e => set('accentColor', e.target.value)}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5" />
            <input type="text" value={cfg.accentColor ?? ''}
              onChange={e => set('accentColor', e.target.value || '')}
              placeholder="Vide = défaut (indigo)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}

      <div className="flex gap-3">
        <button onClick={() => save()} disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button onClick={() => save(null)} disabled={saving}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
