import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { isSubscriber } from '@/lib/roles';

// GET  /api/remixes — liste publique des remixes (triés par votes)
// POST /api/remixes — créer un remix (abonnés uniquement)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');

  if (photoId && !UUID_RE.test(photoId)) {
    return NextResponse.json({ error: 'photoId invalide' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (svc as any)
    .from('remixes')
    .select('id, user_id, photo_id, image_path, votes_count, created_at, profiles:user_id(pseudo)')
    .order('votes_count', { ascending: false })
    .limit(50);

  if (photoId) query = query.eq('photo_id', photoId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });

  const remixes = (data ?? []).map((r: { image_path: string; [key: string]: unknown }) => ({
    ...r,
    image_url: svc.storage.from('remixes').getPublicUrl(r.image_path).data.publicUrl,
  }));

  return NextResponse.json({ remixes });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !isSubscriber(profile.subscription_tier, profile.subscription_expires_at)) {
    return NextResponse.json({ error: 'Abonnement requis' }, { status: 403 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: 'FormData invalide' }, { status: 400 }); }

  const file    = form.get('file') as File | null;
  const photoId = (form.get('photoId') as string | null)?.trim();

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Image requise' }, { status: 400 });
  }
  if (!photoId || !UUID_RE.test(photoId)) {
    return NextResponse.json({ error: 'photoId invalide' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 5 Mo)' }, { status: 400 });
  }

  const svc = createServiceClient();

  // Valider que le tableau source existe et est disponible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tableau } = await (svc as any)
    .from('tableaux')
    .select('id')
    .eq('id', photoId)
    .eq('available', true)
    .maybeSingle();

  if (!tableau) {
    return NextResponse.json({ error: 'Tableau introuvable ou indisponible.' }, { status: 404 });
  }

  const path = `${profile.id}/${Date.now()}.png`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upErr } = await (svc as any).storage
    .from('remixes')
    .upload(path, file, { contentType: 'image/png' });

  if (upErr) return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('remixes')
    .insert({ user_id: profile.id, photo_id: photoId, image_path: path })
    .select('id, user_id, photo_id, image_path, votes_count, created_at, profiles:user_id(pseudo)')
    .single();

  if (error) {
    // Nettoyage du fichier orphelin si l'insert DB échoue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any).storage.from('remixes').remove([path]);
    return NextResponse.json({ error: 'Erreur lors de la création du remix.' }, { status: 500 });
  }

  const remix = {
    ...data,
    image_url: svc.storage.from('remixes').getPublicUrl(path).data.publicUrl,
  };

  return NextResponse.json({ remix }, { status: 201 });
}
