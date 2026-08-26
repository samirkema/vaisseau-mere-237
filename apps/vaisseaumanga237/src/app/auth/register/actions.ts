'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function registerAction(_prev: { error: string } | null, formData: FormData) {
  const email    = ((formData.get('email')    as string) ?? '').trim();
  const password =  (formData.get('password') as string) ?? '';
  const pseudo   = ((formData.get('pseudo')   as string) ?? '').trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { pseudo },
    },
  });

  if (error) return { error: error.message };

  redirect('/auth/login?registered=1');
}
