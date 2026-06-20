'use client';

import { useState } from 'react';

interface FormatEntry { label: string; price_eur: number }

interface Props {
  tableauId: string;
  formats:   FormatEntry[];
  priceEur:  number | null;
}

export function TableauCheckout({ tableauId, formats, priceEur }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState<'stripe' | 'crypto' | null>(null);
  const [err,     setErr]     = useState<string | null>(null);

  const hasFormats   = formats.length > 0;
  const currentPrice = hasFormats ? formats[selectedIdx]?.price_eur : priceEur;

  async function pay(type: 'stripe' | 'crypto') {
    if (!email.trim() || !email.includes('@')) {
      setErr('Merci de saisir votre adresse email avant de payer.');
      return;
    }
    setLoading(type);
    setErr(null);
    try {
      const res = await fetch(`/api/payment/tableau/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableauId, formatIndex: selectedIdx, customerEmail: email.trim() }),
      });
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* */ }
      if (!res.ok) { setErr((json.error as string) ?? `Erreur ${res.status}`); return; }
      window.location.href = json.url as string;
    } catch {
      setErr('Connexion impossible — réessayez');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Sélecteur de format */}
      {hasFormats && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Choisir un format
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {formats.map((f, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                  border: `1px solid ${i === selectedIdx ? 'rgba(249,115,22,0.6)' : '#1e1e1e'}`,
                  background: i === selectedIdx ? 'rgba(249,115,22,0.08)' : '#0a0a0a',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ color: i === selectedIdx ? '#fff' : '#bbb', fontSize: '0.875rem' }}>{f.label}</span>
                <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.875rem' }}>{f.price_eur} €</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prix sélectionné */}
      {currentPrice != null && (
        <p style={{ textAlign: 'center', color: '#f97316', fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>
          {currentPrice} €
        </p>
      )}

      {/* Message livraison */}
      <div style={{
        background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)',
        borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
      }}>
        <p style={{ color: '#aaa', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
          Dès votre achat confirmé, nous vous contacterons par email pour régler les détails et organiser la livraison.
        </p>
      </div>

      {/* Email */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', color: '#555', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Votre email *
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          style={{
            width: '100%', padding: '11px 14px', borderRadius: '8px',
            border: '1px solid #1e1e1e', background: '#0a0a0a',
            color: '#fff', fontSize: '0.875rem', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Boutons de paiement */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => pay('stripe')}
          disabled={loading !== null}
          style={{
            display: 'block', width: '100%', padding: '14px',
            borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(249,115,22,0.3)',
            background: loading === 'stripe' ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)',
            color: '#f97316', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px',
            transition: 'background 0.2s',
          }}
        >
          {loading === 'stripe' ? 'Redirection…' : 'PAYER PAR CARTE (STRIPE)'}
        </button>

        <button
          onClick={() => pay('crypto')}
          disabled={loading !== null}
          style={{
            display: 'block', width: '100%', padding: '14px',
            borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(99,102,241,0.3)',
            background: loading === 'crypto' ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.05)',
            color: '#818cf8', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px',
            transition: 'background 0.2s',
          }}
        >
          {loading === 'crypto' ? 'Redirection…' : 'PAYER EN CRYPTO (BTC / ETH…)'}
        </button>
      </div>

      {err && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', marginTop: '10px' }}>{err}</p>
      )}
    </div>
  );
}
