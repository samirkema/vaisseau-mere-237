import { NextResponse } from 'next/server';
import { requireAdminApi } from './admin-guard';
import { createServiceClient } from './supabase/server';

export type DisplayGuardResult =
  | { error: NextResponse; userId?: never; role?: never }
  | { error: null; userId: string; role: string };

// Logique de permission pure — utilisée par le guard, la route GET et le Server Component.
export function checkDisplayPermission(
  role:        string | undefined,
  createdBy:   string | null | undefined,
  userId:      string,
  hasExplicit: boolean,
): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  if (role === 'admin') return createdBy === userId || hasExplicit;
  return false;
}

// Vérifie que l'appelant peut éditer la config d'affichage d'une œuvre.
// Autorisé : superadmin (toujours) | admin créateur | admin avec permission déléguée.
export async function requireDisplayPermission(workId: string): Promise<DisplayGuardResult> {
  const guard = await requireAdminApi();
  if (guard.error) return { error: guard.error };

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileRes, workRes, permRes] = await Promise.all([
    (svc as any).from('profiles').select('role').eq('id', guard.userId).single(),
    (svc as any).from('manga_works').select('created_by').eq('id', workId).single(),
    (svc as any)
      .from('manga_display_permissions')
      .select('id')
      .eq('work_id', workId)
      .eq('user_id', guard.userId)
      .maybeSingle(),
  ]);

  const role = profileRes.data?.role as string | undefined;
  if (!role) return { error: NextResponse.json({ error: 'Profil introuvable' }, { status: 403 }) };

  if (checkDisplayPermission(role, workRes.data?.created_by, guard.userId, !!permRes.data)) {
    return { error: null, userId: guard.userId, role };
  }

  return { error: NextResponse.json({ error: "Permission d'affichage insuffisante" }, { status: 403 }) };
}
