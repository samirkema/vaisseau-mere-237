import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

// GET  /api/admin/manga — liste paginée des œuvres
// POST /api/admin/manga — crée une nouvelle œuvre

export async function GET(request: Request) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (svc as any)
    .from('manga_works')
    .select('id, title, kind, language, published, views_count, cover_url, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ works: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { title, description, kind, language, cover_url } = body as Record<string, string | undefined>;

  if (!title?.trim())  return NextResponse.json({ error: 'title requis' }, { status: 400 });
  if (!language?.trim()) return NextResponse.json({ error: 'language requis' }, { status: 400 });
  if (!kind || !['manga', 'webtoon', 'bd', 'artbook'].includes(kind)) {
    return NextResponse.json({ error: 'kind invalide (manga | webtoon | bd | artbook)' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('manga_works')
    .insert({
      title:       title.trim(),
      description: description?.trim() || null,
      kind,
      language:    language.trim(),
      cover_url:   cover_url?.trim() || null,
      published:   false,
      created_by:  guard.userId,
    })
    .select('id, title, kind, language, published, views_count, cover_url, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ work: data }, { status: 201 });
}
