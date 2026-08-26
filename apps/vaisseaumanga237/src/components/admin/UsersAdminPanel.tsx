'use client';

import { useState } from 'react';

interface UserProfile {
  id:                      string;
  pseudo:                  string;
  role:                    string;
  subscription_tier:       string;
  subscription_expires_at: string | null;
  wallet_address:          string | null;
  created_at:              string;
}

interface Props {
  initialUsers: UserProfile[];
  total:        number;
  isSuperAdmin: boolean;
}

const TIER_LABELS: Record<string, string> = { free: 'Gratuit', subscriber: 'Abonné', nft: 'NFT' };
const ROLE_LABELS: Record<string, string> = { user: 'Utilisateur', admin: 'Admin', superadmin: 'Super Admin' };

export function UsersAdminPanel({ initialUsers, total, isSuperAdmin }: Props) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [err,   setErr]   = useState<string | null>(null);

  async function changeTier(userId: string, tier: string) {
    setErr(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription_tier: tier }),
    });
    const json = await res.json();
    if (!res.ok) { setErr(json.error ?? 'Erreur'); return; }
    setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u));
  }

  async function changeRole(userId: string, role: string) {
    setErr(null);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const json = await res.json();
    if (!res.ok) { setErr(json.error ?? 'Erreur'); return; }
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString('fr')} comptes au total</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{err}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pseudo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Abonnement</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Wallet</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <span className="block">{u.pseudo}</span>
                  <span className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3">
                  {isSuperAdmin ? (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600">{ROLE_LABELS[u.role] ?? u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.subscription_tier}
                    onChange={e => changeTier(u.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="free">Gratuit</option>
                    <option value="subscriber">Abonné</option>
                    <option value="nft">NFT</option>
                  </select>
                  {u.subscription_expires_at && (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      exp. {new Date(u.subscription_expires_at).toLocaleDateString('fr')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                  {u.wallet_address ? `${u.wallet_address.slice(0, 6)}…${u.wallet_address.slice(-4)}` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(u.created_at).toLocaleDateString('fr')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
