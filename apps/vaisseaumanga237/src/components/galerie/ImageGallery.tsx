'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  title:  string;
}

export function ImageGallery({ images, title }: Props) {
  const [selected, setSelected] = useState(0);

  const current = images[selected] ?? images[0];

  return (
    <div>
      {/* Image principale */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={title}
        style={{
          width: '100%', display: 'block',
          maxHeight: '70vh', objectFit: 'contain',
          background: '#050505',
        }}
      />

      {/* Bande de vignettes (visible seulement si plusieurs images) */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: '6px', padding: '10px 12px',
          overflowX: 'auto', background: '#050505',
        }}>
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                flex: '0 0 auto',
                border: `2px solid ${i === selected ? '#f97316' : 'transparent'}`,
                borderRadius: '6px', overflow: 'hidden',
                cursor: 'pointer', background: 'none', padding: 0,
                opacity: i === selected ? 1 : 0.55,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${title} — photo ${i + 1}`}
                style={{ width: '64px', height: '48px', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
