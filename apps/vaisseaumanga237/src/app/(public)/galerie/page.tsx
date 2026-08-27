import Link from 'next/link';

export const metadata = { title: 'Découvrez nos travaux — Vaisseau Manga 237' };

export default function GaleriePage() {
  return (
    <>
      <style>{`
        .portal-card {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .portal-card:hover {
          transform: translateY(-4px);
          border-color: rgba(249,115,22,0.6) !important;
          box-shadow: 0 12px 32px rgba(249,115,22,0.15);
        }
        .btn-portal-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f97316;
          color: #000;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          padding: 12px 20px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .btn-portal-primary:hover {
          background: #fb923c;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(249,115,22,0.4);
        }
        .btn-portal-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(249,115,22,0.08);
          border: 1px solid rgba(249,115,22,0.3);
          color: #f97316;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          padding: 12px 20px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-portal-secondary:hover {
          background: rgba(249,115,22,0.18);
          border-color: #f97316;
          color: #fff;
          transform: translateY(-2px);
        }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', padding: '60px 20px 90px', fontFamily: "'Segoe UI', sans-serif" }}>

        {/* ── EN-TÊTE PRINCIPAL ── */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.25)',
            padding: '6px 16px',
            borderRadius: '24px',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', color: '#f97316' }}>
              ✨ À VENIR · PORTFOLIO EN COURS DE CRÉATION
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '6px',
            color: '#fff',
            margin: '0 0 16px',
            textShadow: '0 0 30px rgba(249,115,22,0.25)',
          }}>
            DÉCOUVREZ NOS TRAVAUX
          </h1>

          <div style={{ width: '48px', height: '2px', background: '#f97316', margin: '0 auto 24px', opacity: 0.8 }} />

          <p style={{
            color: '#aaa',
            fontSize: '1rem',
            lineHeight: 1.8,
            maxWidth: '680px',
            margin: '0 auto 28px',
          }}>
            Un grand portfolio immersif présentant l’ensemble de nos réalisations visuelles (illustrations manga originales, photomontages, directions artistiques et concepts afro-futuristes) est actuellement en préparation.
          </p>

          <p style={{
            color: '#666',
            fontSize: '0.85rem',
            lineHeight: 1.6,
          }}>
            En attendant le déploiement de la galerie complète, retrouvez nos œuvres disponibles et notre catalogue de lecture ci-dessous :
          </p>
        </div>

        {/* ── CARTES D'ACTIONS ── */}
        <div style={{
          maxWidth: '760px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>

          {/* CARTE 1 : BOUTIQUE / SHOP */}
          <div className="portal-card" style={{
            background: '#0a0a0a',
            border: '1px solid #1c1c1c',
            borderRadius: '18px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
                <span className="emoji">🛍️</span>
              </div>
              <h2 style={{
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '12px',
              }}>
                Boutique Officielle
              </h2>
              <p style={{ color: '#777', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: '28px' }}>
                Découvrez et commandez les tirages d’art et tableaux manga remix actuels du collectif (Deku Yaoundé, Naruto Alloco...).
              </p>
            </div>
            <a
              href="https://vaisseau-mere-237.vercel.app/shop.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-portal-primary"
            >
              Accéder au Shop ↗
            </a>
          </div>

          {/* CARTE 2 : LIRE LES MANGAS */}
          <div className="portal-card" style={{
            background: '#0a0a0a',
            border: '1px solid #1c1c1c',
            borderRadius: '18px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
                <span className="emoji">📖</span>
              </div>
              <h2 style={{
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '12px',
              }}>
                Lire les Mangas
              </h2>
              <p style={{ color: '#777', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: '28px' }}>
                Explorez le catalogue de mangas, webtoons et bandes dessinées en lecture streaming numérique haute définition.
              </p>
            </div>
            <Link href="/manga" className="btn-portal-secondary">
              Lire les Mangas →
            </Link>
          </div>

        </div>

        {/* ── RETOUR ACCUEIL ── */}
        <div style={{ textAlign: 'center', marginTop: '64px' }}>
          <Link href="/" style={{
            color: '#555',
            fontSize: '0.85rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>

      </div>
    </>
  );
}
