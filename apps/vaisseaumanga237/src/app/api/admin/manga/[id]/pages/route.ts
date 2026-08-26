import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

// GET    /api/admin/manga/[id]/pages — liste les pages d'une œuvre
// POST   /api/admin/manga/[id]/pages — ajoute une page
// DELETE /api/admin/manga/[id]/pages — supprime une page (body: { pageId })

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
    .from('manga_pages')
    .select('id, page_number, image_url, created_at')
    .eq('work_id', id)
    .order('page_number', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { page_number, image_url } = body as { page_number?: unknown; image_url?: unknown };

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url requis' }, { status: 400 });
  }
  const pageNum = Number(page_number);
  if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > 10_000) {
    return NextResponse.json({ error: 'page_number invalide (1–10 000)' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('manga_pages')
    .insert({ work_id: id, page_number: pageNum, image_url: image_url.trim() })
    .select('id, page_number, image_url')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;
  const { id: workId } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { pageId } = body as { pageId?: string };
  if (!pageId) return NextResponse.json({ error: 'pageId requis' }, { status: 400 });

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('manga_pages').delete().eq('id', pageId).eq('work_id', workId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
