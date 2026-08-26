import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('[stripe] NEXT_PUBLIC_APP_URL non configuré — fallback localhost utilisé');
}

// POST /api/payment/stripe — crée une session Stripe Checkout (paiement unique, accès 30 jours).
// Body : { priceId: string }
// STRIPE_ALLOWED_PRICE_IDS : liste des price IDs autorisés séparés par des virgules.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { priceId } = body as { priceId?: string };
  if (!priceId || typeof priceId !== 'string' || priceId.trim() === '') {
    return NextResponse.json({ error: 'priceId requis' }, { status: 400 });
  }

  // Whitelist des prix Stripe autorisés (évite la manipulation de priceId côté client)
  const allowed = (process.env.STRIPE_ALLOWED_PRICE_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(priceId)) {
    return NextResponse.json({ error: 'Prix non autorisé' }, { status: 400 });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/compte?payment=success`,
    cancel_url:  `${APP_URL}/club-vip?payment=cancelled`,
    // userId transmis dans les métadonnées pour l'identifier dans le webhook
    metadata: { userId: user.id },
    customer_email: user.email ?? undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Session Stripe invalide — URL manquante' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
