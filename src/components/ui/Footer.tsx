import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #1a1a1a',
      padding: '28px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '0.78rem',
        marginBottom: '10px',
      }}>
        <Link href="/mentions-legales" style={{ color: '#666', textDecoration: 'none' }}>Mentions légales</Link>
        <Link href="/cgv" style={{ color: '#666', textDecoration: 'none' }}>CGV</Link>
        <Link href="/politique-de-confidentialite" style={{ color: '#666', textDecoration: 'none' }}>Confidentialité</Link>
        <Link href="/aide" style={{ color: '#666', textDecoration: 'none' }}>Aide</Link>
      </div>
      <p style={{ color: '#444', fontSize: '0.72rem' }}>
        © {new Date().getFullYear()} Otaku Shop — Samir Tamboura, entrepreneur individuel
      </p>
    </footer>
  );
}
