'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ActivationForm() {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Erreur inconnue');
      } else {
        const exp = new Date(json.expiresAt).toLocaleDateString('fr-FR');
        setSuccess(`Abonnement activé jusqu'au ${exp} !`);
        setCode('');
        router.refresh();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#f87171',
          fontSize: '0.82rem',
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.35)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#f97316',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}>
          {success}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="OTAKU-XXXX-XXXX"
          style={{
            flex: 1,
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#e0e0e0',
            fontSize: '0.875rem',
            letterSpacing: '1px',
          }}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            background: loading ? '#1a1a1a' : '#f97316',
            color: loading ? '#555' : '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '1px',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '…' : 'ACTIVER'}
        </button>
      </div>
    </form>
  );
}
