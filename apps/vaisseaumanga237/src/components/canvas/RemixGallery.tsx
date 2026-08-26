'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { RemixData } from './RemixClientPage';

interface Props {
  remixes:       RemixData[];
  votedPhotoIds: string[];
  currentUserId: string;
  onVoteSuccess: (remixId: string, photoId: string) => void;
}

export function RemixGallery({ remixes, votedPhotoIds, currentUserId, onVoteSuccess }: Props) {
  const [voting, setVoting] = useState<string | null>(null);
  const [err,    setErr]    = useState<string | null>(null);

  const voted = new Set(votedPhotoIds);

  // Top remix par photo_id (pour la couronne)
  const topPerPhoto = new Map<string, string>();
  for (const r of remixes) {
    const current = topPerPhoto.get(r.photo_id);
    if (!current || r.votes_count > (remixes.find(x => x.id === current)?.votes_count ?? 0)) {
      if (r.votes_count > 0) topPerPhoto.set(r.photo_id, r.id);
    }
  }

  async function vote(remix: RemixData) {
    if (voted.has(remix.photo_id) || remix.user_id === currentUserId) return;
    setVoting(remix.id);
    setErr(null);

    const res  = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remixId: remix.id, photoId: remix.photo_id }),
    });
    const json = await res.json() as { error?: string };

    if (!res.ok) {
      setErr(json.error ?? 'Erreur lors du vote.');
      setVoting(null);
      return;
    }

    onVoteSuccess(remix.id, remix.photo_id);
    setVoting(null);
  }

  if (remixes.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 20px',
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '16px',
      }}>
        <p style={{ color: '#333', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Aucun remix partagé pour l&apos;instant — soyez le premier !
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {err && (
        <p style={{ fontSize: '0.82rem', color: '#f87171', textAlign: 'center' }}>{err}</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '12px',
      }}>
        {remixes.map(r => {
          const isOwn    = r.user_id === currentUserId;
          const hasVoted = voted.has(r.photo_id);
          const isVoting = voting === r.id;
          const isWinner = topPerPhoto.get(r.photo_id) === r.id;

          return (
            <article
              key={r.id}
              style={{
                background: '#0a0a0a',
                border: `1px solid ${isWinner ? 'rgba(249,115,22,0.35)' : '#1a1a1a'}`,
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: isWinner ? '0 0 20px rgba(249,115,22,0.08)' : 'none',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '4/3', background: '#111' }}>
                <Image
                  src={r.image_url}
                  alt={`Remix par ${r.profiles?.pseudo ?? 'inconnu'}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {isWinner && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#f97316',
                    border: '1px solid rgba(249,115,22,0.4)',
                    letterSpacing: '1px',
                  }}>
                    👑 TOP
                  </div>
                )}
              </div>

              <div style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <span style={{ fontSize: '0.78rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  par{' '}
                  <span style={{ fontWeight: 700, color: '#888' }}>
                    {r.profiles?.pseudo ?? '—'}
                  </span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', fontVariantNumeric: 'tabular-nums' }}>
                    {r.votes_count}
                  </span>
                  <button
                    onClick={() => vote(r)}
                    disabled={isOwn || hasVoted || isVoting}
                    title={
                      isOwn      ? 'Votre remix'
                      : hasVoted ? 'Déjà voté pour cette photo'
                                 : 'Voter'
                    }
                    aria-label={`Voter pour le remix de ${r.profiles?.pseudo ?? 'inconnu'}`}
                    style={{
                      background: hasVoted
                        ? 'rgba(249,115,22,0.1)'
                        : isOwn
                          ? '#111'
                          : 'rgba(249,115,22,0.08)',
                      border: `1px solid ${hasVoted ? 'rgba(249,115,22,0.4)' : isOwn ? '#222' : 'rgba(249,115,22,0.25)'}`,
                      color: hasVoted ? '#f97316' : isOwn ? '#333' : '#f97316',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isOwn || hasVoted ? 'default' : isVoting ? 'wait' : 'pointer',
                      opacity: isOwn ? 0.4 : 1,
                      transition: 'background 0.15s, border-color 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isVoting ? '…' : hasVoted ? '✓ Voté' : '♥ Voter'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
