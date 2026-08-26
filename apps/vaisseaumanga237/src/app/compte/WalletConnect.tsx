'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

export function WalletConnect({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    setError(null);
    setLoading(true);

    try {
      if (!window.ethereum) {
        setError('Aucun wallet détecté. Installe MetaMask ou un wallet compatible dans ton navigateur.');
        return;
      }

      // 1. Demander accès au wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts || accounts.length === 0) {
        setError('Aucun compte MetaMask trouvé.');
        return;
      }
      const walletAddress = accounts[0];

      // 2. Créer un message horodaté et lié à l'utilisateur (anti-replay)
      const message = `Vaisseau Manga 237 — Vérification wallet\nAdresse : ${walletAddress}\nUser : ${userId}\nTimestamp : ${Date.now()}`;

      // 3. Signer le message via MetaMask (personal_sign = EIP-191)
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      // 4. Envoyer au serveur pour vérification NFT
      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature, message }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Erreur de vérification.');
        return;
      }

      setSuccess(true);
      router.refresh();

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 4001) {
        setError('Signature refusée dans MetaMask.');
      } else {
        setError('Erreur lors de la connexion au wallet.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        background: 'rgba(249,115,22,0.08)',
        border: '1px solid rgba(249,115,22,0.35)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#f97316',
        fontSize: '0.82rem',
        fontWeight: 600,
        textAlign: 'center',
      }}>
        ✓ NFT vérifié — abonnement activé !
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          background: loading ? '#1a1a1a' : 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '8px',
          padding: '12px',
          color: loading ? '#555' : '#f97316',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '1px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>💎</span>
        {loading ? 'Vérification…' : 'CONNECTER MON WALLET'}
      </button>
      <p style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
        Nécessite un NFT SWAP-SWAP sur Ethereum mainnet
      </p>
    </div>
  );
}
