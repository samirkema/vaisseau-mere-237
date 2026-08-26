import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

// GET   /api/admin/manga/[id] — détail d'une œuvre
// PATCH /api/admin/manga/[id] — mise à jour partielle
// DELETE /api/admin/manga/[id] — suppression (cascade pages)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id } = await params;

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('manga_works')
    .select('id, title, description, kind, language, published, views_count, cover_url, created_at')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json({ work: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const raw = body as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (raw.title       !== undefined) update.title       = String(raw.title).trim();
  if (raw.description !== undefined) update.description = raw.description ? String(raw.description).trim() : null;
  if (raw.language    !== undefined) update.language    = String(raw.language).trim();
  if (raw.cover_url   !== undefined) update.cover_url   = raw.cover_url ? String(raw.cover_url) : null;
  if (raw.published   !== undefined) update.published   = Boolean(raw.published);
  if (raw.kind !== undefined) {
    if (!['manga', 'webtoon', 'bd', 'artbook'].includes(String(raw.kind))) {
      return NextResponse.json({ error: 'kind invalide (manga | webtoon | bd | artbook)' }, { status: 400 });
    }
    update.kind = raw.kind;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('manga_works').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id } = await params;

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('manga_works').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
