import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Galerie — Vaisseau Manga 237' };

export default async function GaleriePage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('tableaux')
    .select('id, title, thumbnail, price_eur, available')
    .eq('available', true)
    .order('created_at', { ascending: true });

  type Tableau = { id: string; title: string; thumbnail: string; price_eur: number | null };
  const tableaux: Tableau[] = (data ?? []).map((t: Tableau) => ({
    ...t,
    // thumbnail peut être une URL complète (via l'upload admin) ou un path relatif
    thumbnail: t.thumbnail.startsWith('http')
      ? t.thumbnail
      : supabase.storage.from('tableaux').getPublicUrl(t.thumbnail).data.publicUrl,
  }));

  return (
    <>
      <style>{`
        .tableau-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s; }
        .tableau-card:hover { border-color: rgba(249,115,22,0.4) !important; box-shadow: 0 4px 24px rgba(249,115,22,0.1); transform: translateY(-3px); }
        .tableau-card:hover .tableau-thumb { transform: scale(1.04); }
        .tableau-thumb { transition: transform 0.3s; }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', padding: '60px 20px 80px', fontFamily: "'Segoe UI', sans-serif" }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto 48px' }}>
          <p style={{ color: '#333', fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Collection originale
          </p>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '6px', color: '#fff', margin: '0 0 12px',
          }}>GALERIE</h1>
          <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 auto 16px', opacity: 0.6 }} />
          <p style={{ color: '#444', fontSize: '0.85rem' }}>
            Tableaux et photomontages disponibles à la vente
          </p>
        </div>

        {/* GRILLE */}
        {tableaux.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#333', fontSize: '0.85rem' }}>
            Aucun tableau disponible pour le moment.
          </div>
        ) : (
          <div style={{
            maxWidth: '1100px', margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {tableaux.map((t) => (
              <Link key={t.id} href={`/galerie/${t.id}`} style={{ textDecoration: 'none' }}>
                <article className="tableau-card" style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}>
                  <div style={{ overflow: 'hidden', aspectRatio: '3/4', background: '#111' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.thumbnail}
                      alt={t.title}
                      className="tableau-thumb"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>
                      {t.title}
                    </p>
                    {t.price_eur != null && (
                      <p style={{ color: '#f97316', fontSize: '0.78rem', fontWeight: 600 }}>
                        À partir de {t.price_eur}€
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
