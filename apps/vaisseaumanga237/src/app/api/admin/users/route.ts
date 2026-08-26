import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdmin, isSuperAdmin } from '@/lib/roles';
import type { Database, Role } from '@/lib/supabase/types';
import { requireAdminApi } from '@/lib/admin-guard';

// GET  /api/admin/users — liste paginée des profils
// PATCH /api/admin/users — promotion / changement de tier
// - Tout changement (role ou subscription_tier) exige au minimum le rôle admin.
// - Seul le superadmin peut modifier le champ role.

export async function GET(request: Request) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
  const offset = (page - 1) * limit;

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (svc as any)
    .from('profiles')
    .select(
      'id, pseudo, role, subscription_tier, subscription_expires_at, wallet_address, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, limit });
}

export async function PATCH(request: Request) {
  const supabase        = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data: callerData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const callerRole = (callerData as { role?: string } | null)?.role as Role | undefined;

  // Toute modification requiert au minimum le rôle admin
  if (!isAdmin(callerRole)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { userId, role, subscription_tier } = body as { userId?: string; role?: string; subscription_tier?: string };

  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

  // Seul le superadmin peut modifier le champ role
  if (role !== undefined && !isSuperAdmin(callerRole)) {
    return NextResponse.json(
      { error: 'Seul le superadmin peut modifier le rôle d\'un utilisateur' },
      { status: 403 },
    );
  }

  const serviceClient = createServiceClient();
  type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
  const update: ProfileUpdate = {};
  if (role !== undefined)               update.role = role as Role;
  if (subscription_tier !== undefined)  update.subscription_tier = subscription_tier as import('@/lib/supabase/types').SubscriptionTier;

  // Type cast nécessaire jusqu'à la génération des types via `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('profiles')
    .update(update)
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
