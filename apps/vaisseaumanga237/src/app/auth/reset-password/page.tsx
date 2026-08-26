'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Toast, useToast } from '@/components/ui/Toast';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const { toast, show, hide } = useToast();

  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      show(error.message, 'error');
      setLoading(false);
      return;
    }

    setSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '1px' }}>Mot de passe oublié</h1>
          <p style={{ color: '#555', fontSize: '0.875rem' }}>
            Saisissez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '32px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f97316', fontWeight: 600, marginBottom: '8px' }}>Email envoyé !</p>
              <p style={{ color: '#555', fontSize: '0.875rem', marginBottom: '16px' }}>
                Vérifiez votre boîte mail. Le lien est valable 1 heure.
              </p>
              <Link href="/auth/login" style={{ color: '#f97316', fontSize: '0.875rem', textDecoration: 'none' }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '0.875rem' }}
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Envoyer le lien
                </Button>
                <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                  <Link href="/auth/login" style={{ color: '#f97316', textDecoration: 'none' }}>
                    Retour à la connexion
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
