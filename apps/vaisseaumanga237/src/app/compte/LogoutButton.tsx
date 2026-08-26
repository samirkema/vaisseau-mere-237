'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: '100%',
        background: 'transparent',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '8px',
        padding: '10px',
        color: '#f87171',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '1px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      SE DÉCONNECTER
    </button>
  );
}
