import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { isSubscriber } from '@/lib/roles';
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

  const subscribed = isSubscriber(profile.subscription_tier, profile.subscription_expires_at);

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
                      <span style={{ color: '#f97316', fontWeight: 700 }}>✓ Actif</span>
                    </div>
                    {profile.subscription_tier === 'subscriber' && profile.subscription_expires_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: '#666' }}>Expire le</span>
                        <span style={{ color: '#ccc', fontWeight: 600 }}>{formatDate(profile.subscription_expires_at)}</span>
                      </div>
                    )}
                    {profile.subscription_tier === 'subscriber' && (
                      <p style={{ color: '#666', fontSize: '0.75rem', lineHeight: 1.5, margin: '6px 0 0', padding: '10px 12px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '8px' }}>
                        L&apos;accès au contenu (manga, jeux, Club VIP) est désormais exclusivement réservé aux détenteurs de NFT. Connectez votre wallet ci-dessous pour obtenir l&apos;accès.
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

            {/* CLUB VIP */}
            {profile.subscription_tier === 'nft' ? (
              <Link href="/club-vip" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(249,115,22,0.05)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '16px', padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="emoji" style={{ fontSize: '1.4rem' }}>👑</span>
                    <div>
                      <p style={{ color: '#f97316', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', margin: 0 }}>CLUB VIP</p>
                      <p style={{ color: '#555', fontSize: '0.75rem', margin: '2px 0 0' }}>Commandes sur mesure & événements</p>
                    </div>
                  </div>
                  <span style={{ color: '#f97316', fontSize: '1.1rem' }}>→</span>
                </div>
              </Link>
            ) : (
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '16px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: 0.45,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="emoji" style={{ fontSize: '1.4rem' }}>👑</span>
                  <div>
                    <p style={{ color: '#888', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', margin: 0 }}>CLUB VIP</p>
                    <p style={{ color: '#444', fontSize: '0.75rem', margin: '2px 0 0' }}>Réservé aux détenteurs de NFT</p>
                  </div>
                </div>
                <span style={{ color: '#333', fontSize: '0.75rem' }}>🔒</span>
              </div>
            )}

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
