import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

// GET  /api/admin/tableaux — liste paginée
// POST /api/admin/tableaux — crée un tableau

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
    .from('tableaux')
    .select('id, title, artist, thumbnail, price_eur, formats, images, available, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tableaux: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminApi();
    if (guard.error) return guard.error;

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

    const b = body as Record<string, unknown>;

    if (!b.title || !b.main_image || !b.thumbnail) {
      return NextResponse.json({ error: 'title, main_image et thumbnail requis' }, { status: 400 });
    }

    type FormatEntry = { label: string; price_eur: number };
    const formats: FormatEntry[] = Array.isArray(b.formats)
      ? (b.formats as Array<Record<string, unknown>>)
          .filter(f => f && typeof f.label === 'string' && f.label.trim() && Number.isFinite(Number(f.price_eur)))
          .map(f => ({ label: String(f.label).trim(), price_eur: Number(f.price_eur) }))
      : [];

    const priceEur = formats.length > 0
      ? Math.min(...formats.map(f => f.price_eur))
      : (b.price_eur != null ? Number(b.price_eur) : null);

    const extraImages: string[] = Array.isArray(b.images)
      ? (b.images as unknown[]).map(String).filter(Boolean)
      : [];

    const svc = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (svc as any)
      .from('tableaux')
      .insert({
        title:       String(b.title).trim(),
        description: b.description ? String(b.description).trim() : null,
        artist:      b.artist      ? String(b.artist).trim()      : null,
        main_image:  String(b.main_image),
        thumbnail:   String(b.thumbnail),
        price_eur:   priceEur,
        formats:     formats.length > 0 ? formats : null,
        images:      extraImages.length > 0 ? extraImages : null,
        available:   b.available !== false,
        created_by:  guard.userId,
      })
      .select('id, title, artist, thumbnail, price_eur, formats, images, available')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tableau: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/tableaux POST] unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
