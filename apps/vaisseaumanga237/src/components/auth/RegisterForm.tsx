'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/auth/register/actions';
import { Button } from '@/components/ui/Button';

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {state?.error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#f87171',
          fontSize: '0.85rem',
        }}>
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="pseudo" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
          Pseudo
        </label>
        <input
          id="pseudo"
          name="pseudo"
          type="text"
          required
          minLength={2}
          maxLength={32}
          autoComplete="username"
          placeholder="VotrePseudo"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '0.875rem' }}
        />
      </div>

      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '0.875rem' }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#888', marginBottom: '6px' }}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '0.875rem' }}
        />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        Créer mon compte
      </Button>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#555' }}>
        Déjà un compte ?{' '}
        <Link href="/auth/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}
