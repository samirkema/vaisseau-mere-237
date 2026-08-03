import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

export async function Navbar() {
  const profile = await getProfile();
  const isNft = profile?.subscription_tier === 'nft';

  return (
    <nav style={{
      background: '#111',
      borderBottom: '2px solid rgba(249,115,22,0.3)',
      boxShadow: '0 0 15px rgba(249,115,22,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          fontWeight: 'bold',
          fontSize: '1.1rem',
          color: '#f97316',
          textDecoration: 'none',
          textShadow: '0 0 10px rgba(249,115,22,0.5)',
          letterSpacing: '3px',
        }}>
          OTAKU SHOP STUDIO
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.875rem' }}>
          <Link href="/galerie" style={{ color: '#aaa', textDecoration: 'none' }}
            className="hover:text-white transition-colors">Galerie</Link>
          <Link href="/aide" style={{ color: '#aaa', textDecoration: 'none' }}
            className="hover:text-white transition-colors">Aide</Link>

          {profile ? (
            <>
              {isNft && (
                <>
                  <Link href="/manga" style={{ color: '#aaa', textDecoration: 'none' }}
                    className="hover:text-white transition-colors">Manga</Link>
                  <Link href="/jeux" style={{ color: '#aaa', textDecoration: 'none' }}
                    className="hover:text-white transition-colors">Jeux</Link>
                  <Link href="/club-vip" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}
                    className="hover:text-white transition-colors">Club VIP</Link>
                </>
              )}
              {isAdmin(profile.role) && (
                <Link href="/admin" style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:text-white transition-colors">Admin</Link>
              )}
              <Link href="/compte" style={{
                color: '#f97316',
                textDecoration: 'none',
                fontWeight: 600,
                textShadow: '0 0 8px rgba(249,115,22,0.4)',
              }}>
                {profile.pseudo}
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ color: '#aaa', textDecoration: 'none' }}
                className="hover:text-white transition-colors">Connexion</Link>
              <Link href="/auth/register" style={{
                background: 'transparent',
                border: '1.5px solid #f97316',
                color: '#f97316',
                padding: '6px 16px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}>
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
