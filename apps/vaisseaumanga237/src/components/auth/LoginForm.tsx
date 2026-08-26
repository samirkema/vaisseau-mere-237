'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/auth/login/actions';
import { Button } from '@/components/ui/Button';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#888' }}>
            Mot de passe
          </label>
          <Link href="/auth/reset-password" style={{ fontSize: '0.75rem', color: '#f97316', textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '10px 12px', fontSize: '0.875rem' }}
        />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        Se connecter
      </Button>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#555' }}>
        Pas encore de compte ?{' '}
        <Link href="/auth/register" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}
