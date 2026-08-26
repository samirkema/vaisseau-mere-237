import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { isSubscriber, isNftHolder } from '@/lib/roles';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';
import { WalletConnect } from './WalletConnect';

export const metadata = { title: 'Mon compte — Vaisseau Manga 237' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ComptePage() {
  const profile = await getProfile();
  if (!profile) redirect('/auth/login');

  // `subscribed` pilote l'affichage du bloc d'abonnement (un compte 'subscriber'
  // hérité doit encore voir son statut et sa date d'expiration).
  const subscribed = isSubscriber(profile.subscription_tier, profile.subscription_expires_at);
  // `hasContentAccess` reflète l'accès réel au contenu — même critère que le
  // middleware et les Server Components. Les deux ne coïncident pas pour un
  // compte 'subscriber' hérité, d'où la distinction.
  const hasContentAccess = isNftHolder(profile.subscription_tier);

  const tierLabel: Record<string, string> = {
    free: 'Gratuit', subscriber: 'Abonné', nft: 'NFT',
  };
  const tierColor: Record<string, string> = {
    free: '#888', subscriber: '#f97316', nft: '#fb923c',
  };

  return (
    <>
      <style>{`
        .compte-card { transition: border-color 0.2s; }
        .compte-card:hover { border-color: rgba(249,115,22,0.3) !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.08) !important; border-color: rgba(239,68,68,0.6) !important; }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', padding: '60px 20px 80px', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>

          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(249,115,22,0.1)',
              border: '2px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem', fontWeight: 900, color: '#f97316',
            }}>
              {profile.pseudo[0].toUpperCase()}
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '3px', color: '#fff', margin: '0 0 6px' }}>
              {profile.pseudo.toUpperCase()}
            </h1>
            <span style={{
              display: 'inline-block',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px',
              padding: '3px 12px', borderRadius: '20px',
              background: 'rgba(249,115,22,0.08)',
              border: `1px solid ${tierColor[profile.subscription_tier]}40`,
              color: tierColor[profile.subscription_tier],
            }}>
              {tierLabel[profile.subscription_tier].toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* ABONNEMENT */}
            <div className="compte-card" style={{
              background: '#0a0a0a', border: '1px solid #1a1a1a',
              borderRadius: '16px', padding: '24px',
            }}>
              <h2 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', color: '#444', textTransform: 'uppercase', marginBottom: '16px' }}>
                Abonnement
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Statut actif */}
                {subscribed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#666' }}>Statut</span>
                      {/* Le badge doit refléter l'accès RÉEL au contenu, réservé au
                          tier 'nft' (middleware.ts:59). Afficher « ✓ Actif » à un
                          compte 'subscriber' contredirait le message explicatif
                          affiché juste en dessous. */}
                      {hasContentAccess ? (
                        <span style={{ color: '#f97316', fontWeight: 700 }}>✓ Actif</span>
                      ) : (
                        <span style={{ color: '#b45309', fontWeight: 700 }}>Accès NFT requis</span>
                      )}
                    </div>
                    {profile.subscription_tier === 'subscriber' && profile.subscription_expires_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: '#666' }}>Expire le</span>
                        <span style={{ color: '#ccc', fontWeight: 600 }}>{formatDate(profile.subscription_expires_at)}</span>
                      </div>
                    )}
                    {profile.subscription_tier === 'subscriber' && (
                      <p style={{ color: '#666', fontSize: '0.75rem', lineHeight: 1.5, margin: '6px 0 0', padding: '10px 12px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '8px' }}>
                        L&apos;accès aux mangas est désormais exclusivement réservé aux détenteurs de NFT. Connectez votre wallet ci-dessous pour obtenir l&apos;accès.
                      </p>
                    )}
                    {profile.subscription_tier === 'nft' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: '#666' }}>Wallet</span>
                        <span style={{ color: '#fb923c', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {profile.wallet_address
                            ? profile.wallet_address.slice(0, 6) + '…' + profile.wallet_address.slice(-4)
                            : '—'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* NFT Holder — tout le monde sauf déjà NFT */}
                {profile.subscription_tier !== 'nft' && (
                  <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
                    <p style={{ color: '#555', fontSize: '0.78rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                      NFT Holder
                    </p>
                    <WalletConnect userId={profile.id} />
                  </div>
                )}

              </div>
            </div>

            {/* INFOS COMPTE */}
            <div className="compte-card" style={{
              background: '#0a0a0a', border: '1px solid #1a1a1a',
              borderRadius: '16px', padding: '24px',
            }}>
              <h2 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', color: '#444', textTransform: 'uppercase', marginBottom: '16px' }}>
                Informations
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#666' }}>Pseudo</span>
                  <span style={{ color: '#ccc', fontWeight: 600 }}>{profile.pseudo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#666' }}>Membre depuis</span>
                  <span style={{ color: '#ccc', fontWeight: 600 }}>{formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>

            {/* DÉCONNEXION */}
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px' }}>
              <LogoutButton />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
