import Image from 'next/image';
import type { Database } from '@/lib/supabase/types';

type TableauRow = Pick<
  Database['public']['Tables']['tableaux']['Row'],
  'id' | 'title' | 'description' | 'artist' | 'thumbnail' | 'price_eur' | 'available'
>;

export function TableauCard({ tableau }: { tableau: TableauRow }) {
  return (
    <article style={{
      background: '#0d0d0d',
      border: '1px solid #1e1e1e',
      borderRadius: '14px',
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
    }} className="tableau-card">
      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#111' }}>
        <Image
          src={tableau.thumbnail}
          alt={tableau.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
          className="tableau-card-img"
        />
        {!tableau.available && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(0,0,0,0.7)',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #333',
            }}>
              Vendu
            </span>
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontWeight: 600, color: '#e0e0e0', fontSize: '0.9rem', marginBottom: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {tableau.title}
        </h3>
        {tableau.artist && (
          <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '4px' }}>{tableau.artist}</p>
        )}
        {tableau.description && (
          <p style={{
            fontSize: '0.75rem', color: '#555', lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            marginBottom: '8px',
          }}>
            {tableau.description}
          </p>
        )}
        {tableau.price_eur != null && (
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f97316', marginTop: '8px' }}>
            {tableau.price_eur.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        )}
      </div>
      <style>{`
        .tableau-card:hover {
          border-color: rgba(249,115,22,0.4) !important;
          box-shadow: 0 4px 20px rgba(249,115,22,0.1);
          transform: translateY(-3px);
        }
        .tableau-card:hover .tableau-card-img {
          transform: scale(1.05);
        }
      `}</style>
    </article>
  );
}
