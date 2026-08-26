import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/auth';

export const metadata = { title: 'Club VIP — Vaisseau Manga 237' };

export default async function ClubVipPage() {
  const profile = await getProfile();

  if (!profile) redirect('/auth/login');
  if (profile.subscription_tier !== 'nft') redirect('/compte');

  return (
    <>
      <style>{`
        .vip-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s; }
        .vip-card-active:hover { border-color: rgba(249,115,22,0.5) !important; box-shadow: 0 0 28px rgba(249,115,22,0.1); transform: translateY(-3px); }
        .vip-steps-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .vip-step-num { min-width: 24px; height: 24px; border-radius: 50%; background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.3); color: #f97316; font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', sans-serif", padding: '60px 20px 80px' }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 56px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}><span className="emoji">👑</span></div>
          <span style={{
            display: 'inline-block',
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px',
            padding: '4px 14px', borderRadius: '20px', marginBottom: '16px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.25)',
            color: '#f97316',
          }}>ACCÈS NFT</span>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900, letterSpacing: '6px',
            color: '#fff', margin: '0 0 14px',
          }}>CLUB VIP</h1>
          <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 auto 18px', opacity: 0.6 }} />
          <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Bienvenue dans l&apos;espace exclusif des détenteurs de NFT Vaisseau Manga 237.<br />
            Des avantages uniques, pensés pour les vrais passionnés.
          </p>
        </div>

        {/* CARDS */}
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>

          {/* COMMANDES SUR MESURE */}
          <div className="vip-card vip-card-active" style={{
            background: '#0a0a0a',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '18px', padding: '32px 28px',
          }}>
            <span style={{
              display: 'inline-block', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1.5px',
              padding: '3px 12px', borderRadius: '20px', marginBottom: '16px',
              background: 'rgba(249,115,22,0.08)', color: '#f97316',
              border: '1px solid rgba(249,115,22,0.2)',
            }}>✓ DISPONIBLE</span>
            <div style={{ fontSize: '2rem', marginBottom: '14px' }}><span className="emoji">🎨</span></div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '12px', color: '#fff' }}>
              Commandes Sur Mesure
            </h2>
            <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '20px' }}>
              Donnez vie à votre vision avec une œuvre 100% personnalisée : tableau, photomontage ou illustration sur mesure selon vos idées, vos dimensions et votre style.
            </p>
            <div style={{ marginBottom: '20px' }}>
              {[
                'Partagez votre idée & références',
                'Devis & accord sur le prix',
                'Création avec suivi en temps réel',
              ].map((step, i) => (
                <div key={i} className="vip-steps-item">
                  <div className="vip-step-num">{i + 1}</div>
                  <span style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <p style={{ color: '#444', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: '20px', fontStyle: 'italic' }}>
              ⚡ Prix et délais négociés selon la complexité du projet. Un acompte sera demandé après validation.
            </p>
            <a
              href="mailto:kilimangarocontact@gmail.com?subject=Commande Sur Mesure - Club VIP NFT"
              style={{
                display: 'block', textAlign: 'center',
                background: '#f97316', color: '#000',
                borderRadius: '8px', padding: '12px',
                fontSize: '0.85rem', fontWeight: 800,
                letterSpacing: '1px', textDecoration: 'none',
              }}
            >
              <span className="emoji">✉️</span> LANCER MON PROJET
            </a>
          </div>

          {/* ÉVÉNEMENTS EXCLUSIFS */}
          <div className="vip-card" style={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '18px', padding: '32px 28px',
            opacity: 0.7,
          }}>
            <span style={{
              display: 'inline-block', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1.5px',
              padding: '3px 12px', borderRadius: '20px', marginBottom: '16px',
              background: 'rgba(80,80,80,0.1)', color: '#555',
              border: '1px solid #222',
            }}>BIENTÔT</span>
            <div style={{ fontSize: '2rem', marginBottom: '14px' }}><span className="emoji">🎭</span></div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '12px', color: '#fff' }}>
              Événements Exclusifs
            </h2>
            <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '16px' }}>
              Des expériences uniques réservées aux membres VIP :
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '🏛️ Entrées dans des musées partenaires',
                '📚 Conventions manga & dédicaces',
                '🎌 Sorties culturelles à thème japonais',
                '🎨 Ateliers dessin & création artistique',
                '⭐ Avant-premières et accès anticipés',
              ].map((item, i) => (
                <li key={i} style={{ color: '#444', fontSize: '0.82rem' }}>{item}</li>
              ))}
            </ul>
            <p style={{ color: '#333', fontSize: '0.78rem', fontStyle: 'italic' }}>
              Les membres NFT seront notifiés en priorité.
            </p>
          </div>

        </div>

        {/* RETOUR */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link href="/compte" style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Retour au compte
          </Link>
        </div>

      </div>
    </>
  );
}
