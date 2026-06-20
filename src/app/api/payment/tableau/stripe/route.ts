import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// POST /api/payment/tableau/stripe
// Body : { tableauId: string, formatIndex?: number }
// Le prix est toujours lu en base — le client n'envoie jamais un montant.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }); }

  const { tableauId, formatIndex, customerEmail } = body as { tableauId?: string; formatIndex?: number; customerEmail?: string };

  if (!tableauId || typeof tableauId !== 'string') {
    return NextResponse.json({ error: 'tableauId requis' }, { status: 400 });
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
    const idx = typeof formatIndex === 'number' ? formatIndex : 0;
    const fmt = formats[idx];
    if (!fmt) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    label      = fmt.label;
    amountCents = Math.round(fmt.price_eur * 100);
  } else {
    if (data.price_eur == null) return NextResponse.json({ error: 'Prix non défini' }, { status: 400 });
    label      = data.title;
    amountCents = Math.round(data.price_eur * 100);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
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

  if (!session.url) return NextResponse.json({ error: 'Session Stripe invalide' }, { status: 500 });
  return NextResponse.json({ url: session.url });
}
