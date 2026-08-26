'use client';

import { useState } from 'react';

interface Permission {
  id:         string;
  user_id:    string;
  granted_by: string | null;
  created_at: string;
  profiles:   { pseudo: string } | null;
}

interface AdminUser {
  id:     string;
  pseudo: string;
  role:   string;
}

interface Props {
  workId:             string;
  initialPermissions: Permission[];
  allAdmins:          AdminUser[];
}

export function PermissionsManager({ workId, initialPermissions, allAdmins }: Props) {
  const [perms,      setPerms]  = useState<Permission[]>(initialPermissions);
  const [selected,   setSelect] = useState('');
  const [saving,     setSaving] = useState(false);
  const [err,        setErr]    = useState<string | null>(null);

  const granted   = new Set(perms.map(p => p.user_id));
  const available = allAdmins.filter(a => !granted.has(a.id));

  async function grant() {
    if (!selected) return;
    setSaving(true); setErr(null);
    const res = await fetch(`/api/admin/manga/${workId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected }),
    });
    const json = await res.json();
    if (!res.ok) { setErr(json.error ?? 'Erreur'); setSaving(false); return; }
    setPerms([...perms, json.permission]);
    setSelect('');
    setSaving(false);
  }

  async function revoke(userId: string) {
    setSaving(true); setErr(null);
    const res = await fetch(`/api/admin/manga/${workId}/permissions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setPerms(perms.filter(p => p.user_id !== userId));
    else setErr('Erreur lors de la révocation');
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Permissions d'affichage déléguées</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Ces admins peuvent modifier la configuration d'affichage de cette œuvre (US 4.2).
        </p>
      </div>

      {perms.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aucune permission déléguée.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
          {perms.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-white">
              <span className="text-sm font-medium text-gray-900">
                {p.profiles?.pseudo ?? `${p.user_id.slice(0, 8)}…`}
              </span>
              <button onClick={() => revoke(p.user_id)} disabled={saving}
                className="text-xs text-red-500 hover:underline disabled:opacity-50">
                Révoquer
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <select value={selected} onChange={e => setSelect(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Choisir un admin à qui octroyer la permission">
            <option value="">— Choisir un admin —</option>
            {available.map(a => (
              <option key={a.id} value={a.id}>{a.pseudo} ({a.role})</option>
            ))}
          </select>
          <button onClick={grant} disabled={!selected || saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            Octroyer
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
