import { createClient } from './supabase/server';
import type { Database } from './supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Retourne l'utilisateur authentifié en revalidant le JWT auprès de Supabase Auth.
// Ne jamais utiliser getSession() pour une décision d'autorisation — non revalidé.
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data;
}

// Retourne le profil ou redirige si le rôle requis n'est pas satisfait.
// À utiliser dans les Server Components (pas dans le middleware — utiliser getUser() là-bas).
export async function requireRole(
  requiredRole: 'admin' | 'superadmin',
): Promise<Profile> {
  const profile = await getProfile();

  const allowed =
    requiredRole === 'admin'
      ? profile?.role === 'admin' || profile?.role === 'superadmin'
      : profile?.role === 'superadmin';

  if (!allowed) {
    const { redirect } = await import('next/navigation');
    redirect('/');
  }

  return profile!;
}
