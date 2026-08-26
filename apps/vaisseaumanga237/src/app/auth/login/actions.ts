'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function loginAction(_prev: { error: string } | null, formData: FormData) {
  const email    = ((formData.get('email')    as string) ?? '').trim();
  const password =  (formData.get('password') as string) ?? '';

  const isAdminHint = email.endsWith('_admin');
  const realEmail   = isAdminHint ? email.slice(0, -6) : email;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: realEmail, password });

  if (error) return { error: error.message };

  const userId = data.user.id;

  // Créer le profil si absent (utilisateurs V1 sans profil)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    const basePseudo = realEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const pseudo     = basePseudo + '_' + userId.slice(0, 6);
    const service    = createServiceClient();
    await (service.from('profiles') as any).insert({ id: userId, pseudo });
    // Relire le profil créé
    const { data: newProfile } = await supabase.from('profiles').select('id, role').eq('id', userId).maybeSingle();
    if (isAdminHint && (newProfile as { role?: string } | null)?.role === 'admin') redirect('/admin');
  } else if (isAdminHint) {
    const role = (existingProfile as { role?: string } | null)?.role;
    if (role === 'admin' || role === 'superadmin') redirect('/admin');
  }

  redirect('/');
}
