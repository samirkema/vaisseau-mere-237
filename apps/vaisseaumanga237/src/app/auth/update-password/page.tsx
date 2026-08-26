'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Toast, useToast } from '@/components/ui/Toast';

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router   = useRouter();
  const { toast, show, hide } = useToast();

  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [loading,  setLoading]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      show('Le mot de passe doit contenir au moins 8 caractères.', 'error');
      return;
    }
    if (password !== confirm) {
      show('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      show(error.message, 'error');
      return;
    }

    show('Mot de passe mis à jour !', 'success');
    setTimeout(() => router.push('/compte'), 1500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '1px' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ color: '#555', fontSize: '0.875rem' }}>
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '32px' }}>
          {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                style={{
                  width: '100%', borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  background: '#111', color: '#fff',
                  padding: '10px 12px', fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>
            <div>
              <label htmlFor="confirm" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                style={{
                  width: '100%', borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  background: '#111', color: '#fff',
                  padding: '10px 12px', fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Mettre à jour
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
