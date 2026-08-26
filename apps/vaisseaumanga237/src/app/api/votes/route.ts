import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { isSubscriber } from '@/lib/roles';

// POST /api/votes — voter pour un remix (abonnés, 1 vote par photo_id)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !isSubscriber(profile.subscription_tier, profile.subscription_expires_at)) {
    return NextResponse.json({ error: 'Abonnement requis' }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const { remixId, photoId } = body as { remixId?: unknown; photoId?: unknown };

  if (typeof remixId !== 'string' || !UUID_RE.test(remixId)) {
    return NextResponse.json({ error: 'remixId invalide' }, { status: 400 });
  }
  if (typeof photoId !== 'string' || !UUID_RE.test(photoId)) {
    return NextResponse.json({ error: 'photoId invalide' }, { status: 400 });
  }

  const svc = createServiceClient();

  // Fetch remix : valide existence, empêche vote pour son propre remix, fournit votes_count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: remix, error: rmxErr } = await (svc as any)
    .from('remixes')
    .select('id, user_id, photo_id, votes_count')
    .eq('id', remixId)
    .maybeSingle();

  if (rmxErr || !remix) {
    return NextResponse.json({ error: 'Remix introuvable.' }, { status: 404 });
  }

  const remixData = remix as { user_id: string; photo_id: string; votes_count: number };

  if (remixData.user_id === profile.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas voter pour votre propre remix.' },
      { status: 403 },
    );
  }

  // Vérifier cohérence photoId / remix.photo_id (empêche la manipulation de votes cross-tableau)
  if (remixData.photo_id !== photoId) {
    return NextResponse.json({ error: 'photoId invalide.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insErr } = await (svc as any)
    .from('votes')
    .insert({ voter_id: profile.id, remix_id: remixId, photo_id: photoId });

  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà voté pour ce tableau.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur lors du vote.' }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (svc as any).rpc('increment_remix_votes', { remix_id: remixId });

  if (updateErr) {
    console.error('[votes] increment votes_count failed:', updateErr.message);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
