import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

// PATCH  /api/admin/tableaux/[id] — mise à jour partielle
// DELETE /api/admin/tableaux/[id] — suppression

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
  if (raw.artist      !== undefined) update.artist      = raw.artist      ? String(raw.artist).trim()      : null;
  if (raw.main_image  !== undefined) update.main_image  = String(raw.main_image);
  if (raw.thumbnail   !== undefined) update.thumbnail   = String(raw.thumbnail);
  if (raw.price_eur   !== undefined) update.price_eur   = raw.price_eur != null ? Number(raw.price_eur) : null;
  if (raw.price_btc   !== undefined) update.price_btc   = raw.price_btc != null ? Number(raw.price_btc) : null;
  if (raw.available   !== undefined) update.available   = Boolean(raw.available);
  if (raw.images      !== undefined) {
    update.images = Array.isArray(raw.images)
      ? (raw.images as unknown[]).map(String).filter(Boolean)
      : null;
  }
  if (raw.formats     !== undefined) {
    type FormatEntry = { label: string; price_eur: number };
    const formats: FormatEntry[] = Array.isArray(raw.formats)
      ? (raw.formats as Array<Record<string, unknown>>)
          .filter(f => f && typeof f.label === 'string' && f.label.trim() && Number.isFinite(Number(f.price_eur)))
          .map(f => ({ label: String(f.label).trim(), price_eur: Number(f.price_eur) }))
      : [];
    update.formats   = formats.length > 0 ? formats : null;
    if (formats.length > 0) {
      update.price_eur = Math.min(...formats.map(f => f.price_eur));
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('tableaux').update(update).eq('id', id);
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
  const { error } = await (svc as any).from('tableaux').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
