import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/payment/tableau/stripe
// Body : { tableauId, formatIndex?, customerEmail? }
// Le prix est toujours lu en base — le client n'envoie jamais un montant.
export async function POST(request: Request) {
  // Protection contre les appels directs hors navigateur
  if (APP_URL !== 'http://localhost:3000') {
    const origin  = request.headers.get('origin')  ?? '';
    const referer = request.headers.get('referer') ?? '';
    if (!origin.startsWith(APP_URL) && !referer.startsWith(APP_URL)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }); }

  const { tableauId, formatIndex, customerEmail } =
    body as { tableauId?: string; formatIndex?: unknown; customerEmail?: string };

  if (!tableauId || !UUID_RE.test(tableauId)) {
    return NextResponse.json({ error: 'tableauId invalide' }, { status: 400 });
  }
  if (customerEmail !== undefined && !EMAIL_RE.test(customerEmail)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from('tableaux')
    .select('id, title, price_eur, formats, available')
    .eq('id', tableauId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Tableau introuvable' }, { status: 404 });
  if (!data.available) return NextResponse.json({ error: 'Tableau non disponible' }, { status: 410 });

  type FormatEntry = { label: string; price_eur: number };
  const formats: FormatEntry[] = Array.isArray(data.formats) ? data.formats : [];

  let label: string;
  let amountCents: number;

  if (formats.length > 0) {
    const idx = Number.isInteger(formatIndex) && (formatIndex as number) >= 0
      ? (formatIndex as number) : 0;
    const fmt = formats[idx];
    if (!fmt) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    label       = fmt.label;
    amountCents = Math.round(fmt.price_eur * 100);
  } else {
    if (data.price_eur == null) return NextResponse.json({ error: 'Prix non défini' }, { status: 400 });
    label       = data.title;
    amountCents = Math.round(data.price_eur * 100);
  }

  if (amountCents <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: {
            name: `${data.title} — ${label}`,
            description: `Tableau original — ${label}`,
          },
        },
      }],
      customer_email: customerEmail || undefined,
      success_url: `${APP_URL}/galerie/${tableauId}?payment=success`,
      cancel_url:  `${APP_URL}/galerie/${tableauId}?payment=cancelled`,
      metadata: { tableauId, format: label },
    });
  } catch (err) {
    console.error('[stripe/tableau] Stripe error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Erreur Stripe — réessayez' }, { status: 502 });
  }

  if (!session.url) return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 });
  return NextResponse.json({ url: session.url });
}
