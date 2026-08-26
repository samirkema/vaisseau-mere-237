import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/types';

type WorkRow = Pick<
  Database['public']['Tables']['manga_works']['Row'],
  'id' | 'title' | 'description' | 'cover_url' | 'kind' | 'views_count'
>;

const KIND_LABEL: Record<string, string> = {
  manga:   'Manga',
  webtoon: 'Webtoon',
  bd:      'BD',
};

export function WorkCard({ work }: { work: WorkRow }) {
  return (
    <Link href={`/manga/${work.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article style={{
        background: '#0d0d0d',
        border: '1px solid #1e1e1e',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      }} className="work-card">
        <div style={{ position: 'relative', aspectRatio: '2/3', background: '#111' }}>
          {work.cover_url ? (
            <Image
              src={work.cover_url}
              alt={work.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
              className="work-card-img"
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', color: '#2a2a2a',
            }}>
              {work.kind === 'webtoon' ? '📱' : work.kind === 'bd' ? '🎨' : '📖'}
            </div>
          )}
          <span style={{
            position: 'absolute', top: '6px', left: '6px',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            color: '#f97316',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(249,115,22,0.2)',
            letterSpacing: '0.5px',
          }}>
            {KIND_LABEL[work.kind] ?? work.kind}
          </span>
        </div>
        <div style={{ padding: '10px 10px 8px' }}>
          <h3 style={{
            fontWeight: 600,
            fontSize: '0.8rem',
            color: '#e0e0e0',
            lineHeight: 1.3,
            marginBottom: '4px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {work.title}
          </h3>
          <p style={{ fontSize: '0.7rem', color: '#444' }}>
            {work.views_count.toLocaleString('fr-FR')} vues
          </p>
        </div>
      </article>
      <style>{`
        .work-card:hover {
          border-color: rgba(249,115,22,0.4) !important;
          box-shadow: 0 4px 20px rgba(249,115,22,0.1);
          transform: translateY(-2px);
        }
        .work-card:hover .work-card-img {
          transform: scale(1.05);
        }
      `}</style>
    </Link>
  );
}
