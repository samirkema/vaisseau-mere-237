import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { isNftHolder } from '@/lib/roles';

export const metadata = { title: 'Immersion — Otaku Shop Studio' };

const GAMES = [
  {
    id: 'my-remix',
    href: '/my-remix',
    icon: '🎨',
    tag: 'DISPONIBLE',
    title: 'MY REMIX',
    desc: 'Dessinez sur nos photos, soumettez votre photomontage et votez pour les meilleures créations.',
    meta: ['Photomontage', 'Vote communauté'],
    available: true,
  },
  {
    id: 'soon',
    href: '#',
    icon: '?',
    tag: 'BIENTÔT',
    title: 'À VENIR',
    desc: 'Un nouveau jeu arrive dans la zone Immersion. Restez connectés.',
    meta: [],
    available: false,
  },
];

export default async function JeuxPage() {
  const profile = await getProfile();
  if (!profile || !isNftHolder(profile.subscription_tier)) {
    redirect('/compte');
  }

  return (
    <>
      <style>{`
        .game-card-available { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s; }
        .game-card-available:hover { border-color: rgba(249,115,22,0.5) !important; box-shadow: 0 0 24px rgba(249,115,22,0.12); transform: translateY(-3px); }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', padding: '70px 20px 56px' }}>
          <p style={{ color: '#333', fontSize: '0.75rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Zone exclusive NFT
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '6px',
            color: '#fff',
            margin: '0 0 14px',
          }}>
            IMMERSION
          </h1>
          <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 auto 18px', opacity: 0.6 }} />
          <p style={{ color: '#444', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Exprimez votre talent, affrontez la communauté et vivez l&apos;univers Otaku Shop.
          </p>
        </div>

        {/* GRILLE */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>

            {GAMES.map((game) => (
              <div
                key={game.id}
                className={game.available ? 'game-card-available' : undefined}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  opacity: game.available ? 1 : 0.35,
                }}
              >
                {game.available ? (
                  <Link href={game.href} style={{ textDecoration: 'none', display: 'block' }}>
                    <GameCardContent game={game} />
                  </Link>
                ) : (
                  <GameCardContent game={game} />
                )}
              </div>
            ))}

          </div>
        </div>

      </div>
    </>
  );
}

function GameCardContent({ game }: { game: typeof GAMES[number] }) {
  return (
    <>
      <div style={{ fontSize: '2rem', marginBottom: '16px' }}><span className="emoji">{game.icon}</span></div>
      <div style={{
        display: 'inline-block',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '1.5px',
        padding: '3px 10px',
        borderRadius: '20px',
        marginBottom: '12px',
        background: game.available ? 'rgba(249,115,22,0.08)' : 'rgba(80,80,80,0.1)',
        color: game.available ? '#f97316' : '#444',
        border: `1px solid ${game.available ? 'rgba(249,115,22,0.2)' : '#222'}`,
      }}>
        {game.tag}
      </div>
      <h2 style={{
        fontSize: '1.1rem',
        fontWeight: 900,
        letterSpacing: '2px',
        color: game.available ? '#fff' : '#2a2a2a',
        marginBottom: '10px',
      }}>
        {game.title}
      </h2>
      <p style={{ fontSize: '0.82rem', color: game.available ? '#555' : '#222', lineHeight: 1.6, marginBottom: '16px' }}>
        {game.desc}
      </p>
      {game.meta.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {game.meta.map(tag => (
            <span key={tag} style={{
              fontSize: '0.7rem', color: '#444', background: '#111',
              border: '1px solid #1e1e1e', padding: '3px 10px', borderRadius: '20px',
            }}>{tag}</span>
          ))}
        </div>
      )}
      {game.available && (
        <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: '#f97316' }}>
          JOUER →
        </p>
      )}
    </>
  );
}
