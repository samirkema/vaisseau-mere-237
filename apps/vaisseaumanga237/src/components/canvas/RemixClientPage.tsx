'use client';
import { useState } from 'react';
import { RemixStudio } from './RemixStudio';
import { RemixGallery } from './RemixGallery';

export interface RemixData {
  id:          string;
  user_id:     string;
  photo_id:    string;
  image_path:  string;
  votes_count: number;
  created_at:  string;
  image_url:   string;
  profiles:    { pseudo: string } | null;
}

interface Tableau {
  id:        string;
  title:     string;
  thumbnail: string;
}

interface Props {
  tableaux:       Tableau[];
  initialRemixes: RemixData[];
  votedPhotoIds:  string[];
  currentUserId:  string;
}

export function RemixClientPage({ tableaux, initialRemixes, votedPhotoIds, currentUserId }: Props) {
  const [remixes, setRemixes] = useState<RemixData[]>(initialRemixes);
  const [voted,   setVoted]   = useState<string[]>(votedPhotoIds);

  function handleCreated(remix: RemixData) {
    setRemixes(prev => [remix, ...prev]);
  }

  function handleVoteSuccess(remixId: string, photoId: string) {
    setRemixes(prev =>
      prev.map(r => r.id === remixId ? { ...r, votes_count: r.votes_count + 1 } : r),
    );
    setVoted(prev => [...prev, photoId]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* STUDIO */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '3px', color: '#f97316', textTransform: 'uppercase', margin: 0 }}>
            Studio
          </h2>
          <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
        </div>
        <RemixStudio tableaux={tableaux} onCreated={handleCreated} />
      </section>

      {/* GALERIE */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '3px', color: '#f97316', textTransform: 'uppercase', margin: 0 }}>
            Galerie des remixes
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#333' }}>({remixes.length})</span>
          <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
        </div>
        <RemixGallery
          remixes={remixes}
          votedPhotoIds={voted}
          currentUserId={currentUserId}
          onVoteSuccess={handleVoteSuccess}
        />
      </section>

    </div>
  );
}
