import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireDisplayPermission } from '@/lib/display-guard';

// POST   /api/admin/manga/[id]/permissions — octroyer permission d'affichage à un admin
// DELETE /api/admin/manga/[id]/permissions — révoquer permission

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: workId } = await params;
  const guard = await requireDisplayPermission(workId);
  if (guard.error) return guard.error;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { userId } = body as { userId?: string };
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

  const svc = createServiceClient();

  // La cible doit être un admin ou superadmin (US 4.2 C1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetProfile } = await (svc as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!targetProfile || !['admin', 'superadmin'].includes(targetProfile.role as string)) {
    return NextResponse.json({ error: "L'utilisateur cible doit avoir le rôle admin ou superadmin" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('manga_display_permissions')
    .insert({ work_id: workId, user_id: userId, granted_by: guard.userId })
    .select('id, user_id, granted_by, created_at, profiles:user_id(pseudo)')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Permission déjà accordée' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ permission: data }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: workId } = await params;
  const guard = await requireDisplayPermission(workId);
  if (guard.error) return guard.error;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { userId } = body as { userId?: string };
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from('manga_display_permissions')
    .delete()
    .eq('work_id', workId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
