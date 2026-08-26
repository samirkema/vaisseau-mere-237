import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/roles';
import type { Role } from '@/lib/supabase/types';

export type AdminGuardOk  = { error: null; userId: string };
export type AdminGuardErr = { error: NextResponse; userId?: never };
export type AdminGuardResult = AdminGuardOk | AdminGuardErr;

// Vérifie que l'appelant est authentifié et possède au minimum le rôle admin.
// Usage : const g = await requireAdminApi(); if (g.error) return g.error;
export async function requireAdminApi(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (prof as { role?: string } | null)?.role as Role | undefined;
  if (!isAdmin(role)) {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }
  return { error: null, userId: user.id };
}
