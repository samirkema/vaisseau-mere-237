import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = { title: 'Inscription — Vaisseau Manga 237' };

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '1px' }}>Créer un compte</h1>
          <p style={{ color: '#555', fontSize: '0.875rem' }}>Rejoignez la communauté Vaisseau Manga 237</p>
        </div>
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '32px' }}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
