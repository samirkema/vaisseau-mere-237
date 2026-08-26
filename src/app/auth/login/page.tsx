import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Connexion — Vaisseau Manga 237' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '1px' }}>Connexion</h1>
          <p style={{ color: '#555', fontSize: '0.875rem' }}>Accédez à votre espace Vaisseau Manga 237</p>
        </div>

        {registered && (
          <div style={{
            background: 'rgba(249,115,22,0.05)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#f97316',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            Compte créé ! Vérifiez votre email pour l&apos;activer, puis connectez-vous.
          </div>
        )}

        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '32px' }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
