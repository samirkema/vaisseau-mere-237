import { Suspense } from 'react';
import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { WorkCard } from '@/components/catalogue/WorkCard';
import type { MangaKind, Database } from '@/lib/supabase/types';

export const metadata = { title: 'Vaisseau Manga 237 — Mangas, Webtoons & BD' };

type WorkRow = Pick<
  Database['public']['Tables']['manga_works']['Row'],
  'id' | 'title' | 'description' | 'cover_url' | 'kind' | 'views_count'
>;

function buildSearchOrFilter(q: string): string {
  const safe    = q.replace(/[(),\s]/g, '');
  const escaped = safe.replace(/[%_\\]/g, '\\$&');
  return `search_vector.wfts.${safe},title.ilike.%${escaped}%,description.ilike.%${escaped}%`;
}

async function CatalogueSection({ kind, label, icon, q }: {
  kind: MangaKind; label: string; icon: string; q: string;
}) {
  const supabase = await createClient();
  const baseQuery = supabase
    .from('manga_works')
    .select('id, title, description, cover_url, kind, views_count')
    .eq('published', true)
    .eq('kind', kind)
    .order('views_count', { ascending: false })
    .limit(6);

  const { data: works, error } = await (
    q.length >= 3 ? baseQuery.or(buildSearchOrFilter(q)) : baseQuery
  );

  if (error || !works?.length) return null;
  const list = works as WorkRow[];

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
          {icon} {label}
        </h2>
        <Link href={`/manga?kind=${kind}`} style={{ fontSize: '0.78rem', color: '#f97316', textDecoration: 'none' }}>
          Voir tout →
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
        {list.map((work) => <WorkCard key={work.id} work={work} />)}
      </div>
    </section>
  );
}

async function SearchResults({ q }: { q: string }) {
  if (q.length < 3) return null;
  const supabase = await createClient();
  const { data: rawWorks, error } = await supabase
    .from('manga_works')
    .select('id, title, description, cover_url, kind, views_count')
    .eq('published', true)
    .or(buildSearchOrFilter(q))
    .order('views_count', { ascending: false })
    .limit(24);

  if (error) return <p style={{ color: '#f87171', textAlign: 'center', padding: '40px 0' }}>Erreur lors de la recherche.</p>;
  const works = (rawWorks ?? []) as WorkRow[];
  if (!works.length) return <p style={{ color: '#555', textAlign: 'center', padding: '40px 0' }}>Aucun résultat pour «{q}».</p>;

  return (
    <section>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
        {works.length} résultat{works.length > 1 ? 's' : ''} pour «{q}»
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
        {works.map((work) => <WorkCard key={work.id} work={work} />)}
      </div>
    </section>
  );
}

const ACTIONS = [
  { id: 'galerie',  href: '/galerie', icon: '🖼️',  title: 'DÉCOUVREZ NOS TRAVAUX', desc: 'Collection complète de tableaux et œuvres physiques.', accent: '#f97316', requiresSub: false },
  { id: 'manga',    href: '/manga',   icon: '📖',  title: 'MANGA',                 desc: 'Mangas, webtoons et BD en streaming illimité.',        accent: '#f97316', requiresSub: true  },
  { id: 'aide',     href: '/aide',    icon: '💡',  title: 'AIDE',                  desc: 'Guide complet sur la plateforme et le concept NFT.',   accent: '#f97316', requiresSub: false },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? '').trim();

  const profile = await getProfile();
  const isNft = profile?.subscription_tier === 'nft';

  return (
    <>
      <style>{`
        .action-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s; }
        .action-card:hover { border-color: rgba(249,115,22,0.5) !important; box-shadow: 0 0 24px rgba(249,115,22,0.12); transform: translateY(-3px); }
        .action-card:hover .action-icon { text-shadow: 0 0 20px rgba(249,115,22,0.6); }
        .compte-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s; }
        .compte-card:hover { border-color: rgba(251,146,60,0.5) !important; box-shadow: 0 0 24px rgba(251,146,60,0.12); transform: translateY(-3px); }
        .search-input:focus { border-color: rgba(249,115,22,0.5) !important; box-shadow: 0 0 12px rgba(249,115,22,0.1); }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', padding: '70px 20px 56px' }}>
          <p style={{ color: '#333', fontSize: '0.75rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Streaming · Tableaux · Manga
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '6px',
            color: '#f97316',
            textShadow: '0 0 30px rgba(249,115,22,0.4)',
            margin: '0 0 14px',
          }}>
            VAISSEAU MANGA 237
          </h1>
          <p style={{ color: '#555', fontSize: '0.8rem', letterSpacing: '2px', margin: '10px 0 0' }}>
            Le 9ème art débloqué par la blockchain
          </p>
          <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '14px auto 0' }} />
        </div>

        {/* ── GRILLE D'ACTIONS (4 CARTES) ── */}
        <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '0 20px 72px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

            {ACTIONS.map((box) => {
              const locked = box.requiresSub && !isNft;
              return (
                <div key={box.id} className="action-card" style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  opacity: locked ? 0.55 : 1,
                }}>
                  <Link href={locked ? '/compte' : box.href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="action-icon" style={{ fontSize: '1.8rem', marginBottom: '14px' }}>
                      <span className="emoji">{box.icon}</span>
                    </div>
                    <h2 style={{
                      color: locked ? '#333' : '#f97316',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '2.5px',
                      marginBottom: '8px',
                    }}>
                      {box.title}
                    </h2>
                    <p style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {box.desc}
                    </p>
                  </Link>
                  {locked && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#333', fontSize: '0.75rem' }}><span className="emoji">🔒</span> NFT</span>
                      <Link href="/compte" style={{ color: '#f97316', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                        En savoir plus →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {/* MON COMPTE */}
            <div className="compte-card" style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '28px 24px',
            }}>
              <Link href="/compte" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '14px' }}>
                  <span className="emoji">{profile ? '👤' : '🔑'}</span>
                </div>
                <h2 style={{
                  color: '#fb923c',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '2.5px',
                  marginBottom: '8px',
                }}>
                  {profile ? profile.pseudo.toUpperCase() : 'MON COMPTE'}
                </h2>
                <p style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  {profile && isNft
                    ? <><span className="emoji">⭐</span> Accès NFT actif</>
                    : profile
                    ? 'Obtenez votre NFT.'
                    : 'Connexion ou inscription.'}
                </p>
              </Link>
            </div>

          </div>
        </div>

        {/* ── CATALOGUE ── */}
        <div style={{ borderTop: '1px solid #111', padding: '60px 20px 80px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '0.75rem', letterSpacing: '4px', color: '#333', textTransform: 'uppercase', marginBottom: '8px' }}>
                Catalogue
              </h2>
              <form>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Rechercher un titre…"
                  className="search-input"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '24px',
                    padding: '10px 20px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    width: '100%',
                    maxWidth: '400px',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              {q.length >= 3 ? (
                <Suspense fallback={<p style={{ color: '#333', textAlign: 'center' }}>Recherche…</p>}>
                  <SearchResults q={q} />
                </Suspense>
              ) : (
                <>
                  <Suspense fallback={<div style={{ height: '180px', background: '#0a0a0a', borderRadius: '12px' }} />}>
                    <CatalogueSection kind="manga" label="Mangas" icon="📖" q={q} />
                  </Suspense>
                  <Suspense fallback={<div style={{ height: '180px', background: '#0a0a0a', borderRadius: '12px' }} />}>
                    <CatalogueSection kind="webtoon" label="Webtoons" icon="📱" q={q} />
                  </Suspense>
                  <Suspense fallback={<div style={{ height: '180px', background: '#0a0a0a', borderRadius: '12px' }} />}>
                    <CatalogueSection kind="bd" label="BD" icon="🎨" q={q} />
                  </Suspense>
                </>
              )}
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
