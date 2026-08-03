import { NextResponse } from 'next/server';
import { createHash }   from 'crypto';
import bcryptjs         from 'bcryptjs';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendSubscriptionConfirmation } from '@/lib/email';
import { isSubscriber } from '@/lib/roles';

// Limites de rate limiting
const MAX_ATTEMPTS_PER_USER_24H = 5;
const MAX_ATTEMPTS_PER_IP_1H    = 10;

// POST /api/subscription — désactivé. L'accès est désormais exclusivement par NFT.
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: 'Activation par code désactivée — accès par NFT uniquement.' },
    { status: 410 },
  );
}

// Conservé pour référence historique — ne s'exécute jamais.
async function _unusedLegacyActivation(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Lire le body JSON EN PREMIER — un body malformé n'enregistre pas de tentative
  // (évite le DoS rate-limit par flood de requêtes JSON invalides ciblant un userId).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { code } = body as { code?: string };
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return NextResponse.json({ error: 'code requis' }, { status: 400 });
  }

  // x-real-ip est positionné par Vercel/nginx et ne peut pas être falsifié par le client.
  // x-forwarded-for en fallback (première entrée) pour les environnements sans proxy Vercel.
  const rawIp  = (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
  const ipHash = createHash('sha256').update(rawIp).digest('hex');

  const svc = createServiceClient();
  const window24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const window1h  = new Date(Date.now() -      3600 * 1000).toISOString();

  // Enregistre la tentative EN PREMIER — avant la vérification des compteurs.
  // Élimine la race condition TOCTOU (insertions simultanées visibles par le compteur).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (svc as any)
    .from('activation_attempts')
    .insert({ user_id: user.id, ip_hash: ipHash });

  if (insertError) {
    console.error('[subscription/activate] insertion tentative:', insertError.message);
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  // Vérification rate limiting APRÈS insertion (compteurs incluent la tentative courante)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ count: userCount }, { count: ipCount }] = await Promise.all([
    (svc as any)
      .from('activation_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('attempted_at', window24h),
    (svc as any)
      .from('activation_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('attempted_at', window1h),
  ]);

  if ((userCount ?? 0) > MAX_ATTEMPTS_PER_USER_24H) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 24h.' },
      { status: 429 },
    );
  }
  if ((ipCount ?? 0) > MAX_ATTEMPTS_PER_IP_1H) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 1h.' },
      { status: 429 },
    );
  }

  const hash = process.env.ACTIVATION_CODE_HASH;
  if (!hash) {
    console.error('[subscription/activate] ACTIVATION_CODE_HASH non configuré');
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  // Comparaison en temps constant via bcrypt (résistant au timing attack)
  const valid = await bcryptjs.compare(code.trim(), hash);
  if (!valid) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 403 });
  }

  // Vérifier que l'abonnement actuel n'est pas déjà actif (prévient l'extension infinie).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentProfile } = await (supabase as any)
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', user.id)
    .single();

  type ProfileSnap = { subscription_tier?: import('@/lib/supabase/types').SubscriptionTier | null; subscription_expires_at?: string | null };
  const currentTier    = (currentProfile as ProfileSnap | null)?.subscription_tier ?? null;
  const currentExpires = (currentProfile as ProfileSnap | null)?.subscription_expires_at ?? null;

  if (isSubscriber(currentTier, currentExpires)) {
    return NextResponse.json(
      { error: 'Abonnement déjà actif — attendez son expiration pour renouveler.' },
      { status: 409 },
    );
  }

  const days = parseInt(process.env.ACTIVATION_DAYS ?? '30', 10);
  if (isNaN(days) || days <= 0) {
    console.error('[subscription/activate] ACTIVATION_DAYS invalide:', process.env.ACTIVATION_DAYS);
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData, error } = await (svc as any)
    .from('profiles')
    .update({
      subscription_tier:       'subscriber',
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id)
    .select('pseudo')
    .single();

  if (error) {
    console.error('[subscription/activate] profile update:', error.message);
    return NextResponse.json({ error: 'Erreur activation' }, { status: 500 });
  }

  const email  = user.email ?? null;
  const pseudo = (profileData as { pseudo?: string } | null)?.pseudo ?? 'abonné';
  if (email) {
    sendSubscriptionConfirmation({ to: email, pseudo, expiresAt })
      .catch(err => console.error('[subscription/activate] email confirmation:', err));
  }

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
