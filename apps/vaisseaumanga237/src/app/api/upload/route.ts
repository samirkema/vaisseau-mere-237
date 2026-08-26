import { NextResponse } from 'next/server';
import { Jimp, JimpMime } from 'jimp';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/admin-guard';

export const runtime = 'nodejs';

// jimp supporte JPEG, PNG, GIF, BMP, TIFF — pas AVIF ni WebP (pas de décodeur installé)
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']);
const MAX_BYTES = 25 * 1024 * 1024; // 25 Mo
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Redimensionne avec Jimp (pur JS, pas de binaire natif).
// Sortie JPEG — compatible tous navigateurs.
async function resizeFit(buf: Buffer, maxW: number): Promise<Buffer> {
  const img = await Jimp.read(buf);
  if (img.width > maxW) img.resize({ w: maxW });
  return img.getBuffer(JimpMime.jpeg);
}

async function resizeCover(buf: Buffer, w: number, h: number): Promise<Buffer> {
  const img = await Jimp.read(buf);
  img.cover({ w, h });
  return img.getBuffer(JimpMime.jpeg);
}

export async function POST(request: Request) {
  try {
    return await handleUpload(request);
  } catch (err) {
    // Le détail reste côté serveur : un message d'exception peut exposer des
    // chemins internes ou la configuration Storage.
    console.error('[api/upload] unhandled error:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

async function handleUpload(request: Request) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: 'Multipart invalide' }, { status: 400 }); }

  const file = form.get('file') as File | null;
  const type = (form.get('type') as string | null)?.trim();

  if (!file || !type) return NextResponse.json({ error: 'file et type requis' }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Type MIME non autorisé (jpeg / png / gif / bmp / tiff)' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 25 Mo)' }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Lecture du fichier impossible' }, { status: 400 });
  }

  const svc = createServiceClient();

  // ── Couverture manga ─────────────────────────────────────────────────────────
  if (type === 'cover') {
    const workId = (form.get('workId') as string | null)?.trim();
    if (!workId) return NextResponse.json({ error: 'workId requis pour type=cover' }, { status: 400 });
    if (!UUID_RE.test(workId)) return NextResponse.json({ error: 'workId invalide' }, { status: 400 });

    let jpeg: Buffer;
    try { jpeg = await resizeFit(buf, 900); }
    catch { return NextResponse.json({ error: 'Fichier image invalide' }, { status: 422 }); }

    const path = `covers/${workId}.jpg`;
    const { error } = await svc.storage.from('tableaux').upload(path, jpeg, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { publicUrl } } = svc.storage.from('tableaux').getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  }

  // ── Page manga ───────────────────────────────────────────────────────────────
  if (type === 'page') {
    const workId  = (form.get('workId')    as string | null)?.trim();
    const rawPage = (form.get('pageNumber') as string | null)?.trim();
    if (!workId || !rawPage) {
      return NextResponse.json({ error: 'workId et pageNumber requis pour type=page' }, { status: 400 });
    }
    if (!UUID_RE.test(workId)) return NextResponse.json({ error: 'workId invalide' }, { status: 400 });
    const pageNum = parseInt(rawPage, 10);
    if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > 10_000) {
      return NextResponse.json({ error: 'pageNumber invalide (1–10 000)' }, { status: 400 });
    }

    let jpeg: Buffer;
    try { jpeg = await resizeFit(buf, 1400); }
    catch { return NextResponse.json({ error: 'Fichier image invalide' }, { status: 422 }); }

    const storagePath = `${workId}/${String(pageNum).padStart(4, '0')}.jpg`;
    const { error } = await svc.storage.from('manga').upload(storagePath, jpeg, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ path: storagePath });
  }

  // ── Tableau ──────────────────────────────────────────────────────────────────
  if (type === 'tableau') {
    const rawTableauId = (form.get('tableauId') as string | null)?.trim();
    const rawSlot      = (form.get('slot')      as string | null)?.trim();

    if (rawTableauId && !UUID_RE.test(rawTableauId)) {
      return NextResponse.json({ error: 'tableauId invalide' }, { status: 400 });
    }
    if (rawSlot && !UUID_RE.test(rawSlot)) {
      return NextResponse.json({ error: 'slot invalide' }, { status: 400 });
    }

    const tableauId = rawTableauId || crypto.randomUUID();

    // Photo supplémentaire
    if (rawSlot) {
      let extra: Buffer;
      try { extra = await resizeFit(buf, 1200); }
      catch { return NextResponse.json({ error: 'Fichier image invalide' }, { status: 422 }); }

      const extraPath = `${tableauId}/img-${rawSlot}.jpg`;
      const { error } = await svc.storage.from('tableaux').upload(extraPath, extra, {
        contentType: 'image/jpeg', upsert: true,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const url = svc.storage.from('tableaux').getPublicUrl(extraPath).data.publicUrl;
      return NextResponse.json({ url, tableauId });
    }

    // Image principale + thumbnail
    let main: Buffer, thumb: Buffer;
    try {
      [main, thumb] = await Promise.all([
        resizeFit(buf, 1200),
        resizeCover(buf, 400, 280),
      ]);
    } catch {
      return NextResponse.json({ error: 'Fichier image invalide' }, { status: 422 });
    }

    const mainPath  = `${tableauId}/main.jpg`;
    const thumbPath = `${tableauId}/thumb.jpg`;

    const [r1, r2] = await Promise.all([
      svc.storage.from('tableaux').upload(mainPath,  main,  { contentType: 'image/jpeg', upsert: true }),
      svc.storage.from('tableaux').upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: true }),
    ]);
    if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500 });
    if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });

    const mainUrl  = svc.storage.from('tableaux').getPublicUrl(mainPath).data.publicUrl;
    const thumbUrl = svc.storage.from('tableaux').getPublicUrl(thumbPath).data.publicUrl;

    return NextResponse.json({ url: mainUrl, thumbnailUrl: thumbUrl, tableauId });
  }

  return NextResponse.json({ error: 'type invalide : cover | page | tableau' }, { status: 400 });
}
