import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { requireDisplayPermission, checkDisplayPermission } from '@/lib/display-guard';

// GET   /api/admin/manga/[id]/display — config + permissions + has_permission
// PATCH /api/admin/manga/[id]/display — update display_config (display permission required)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id: workId } = await params;

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workRes, permRes, profileRes] = await Promise.all([
    (svc as any)
      .from('manga_works')
      .select('display_config, created_by')
      .eq('id', workId)
      .single(),
    (svc as any)
      .from('manga_display_permissions')
      .select('id, user_id, granted_by, created_at, profiles:user_id(pseudo)')
      .eq('work_id', workId),
    (svc as any)
      .from('profiles')
      .select('role')
      .eq('id', guard.userId)
      .single(),
  ]);

  if (workRes.error) {
    const status = workRes.error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: workRes.error.message }, { status });
  }

  const role = profileRes.data?.role as string | undefined;
  const hasExplicitPerm = (permRes.data ?? []).some((p: { user_id: string }) => p.user_id === guard.userId);
  const hasPermission   = checkDisplayPermission(role, workRes.data?.created_by, guard.userId, hasExplicitPerm);

  return NextResponse.json({
    display_config: workRes.data?.display_config ?? null,
    permissions:    permRes.data ?? [],
    has_permission: hasPermission,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: workId } = await params;
  const guard = await requireDisplayPermission(workId);
  if (guard.error) return guard.error;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { display_config } = body as { display_config?: unknown };
  if (display_config !== null && display_config !== undefined &&
      (typeof display_config !== 'object' || Array.isArray(display_config))) {
    return NextResponse.json({ error: 'display_config doit être un objet ou null' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (svc as any)
    .from('manga_works')
    .update({ display_config: display_config ?? null })
    .eq('id', workId)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
