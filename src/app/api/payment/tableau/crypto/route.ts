import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const API_KEY     = process.env.NOWPAYMENTS_API_KEY ?? '';
const NOWPAY_HOST = 'https://api.nowpayments.io/v1';

// POST /api/payment/tableau/crypto
// Body : { tableauId: string, formatIndex?: number }
// Le prix est toujours lu en base.
export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Paiement crypto non configuré' }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }); }

  const { tableauId, formatIndex } = body as { tableauId?: string; formatIndex?: number };

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
  let priceEur: number;

  if (formats.length > 0) {
    const idx = typeof formatIndex === 'number' ? formatIndex : 0;
    const fmt = formats[idx];
    if (!fmt) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    label    = fmt.label;
    priceEur = fmt.price_eur;
  } else {
    if (data.price_eur == null) return NextResponse.json({ error: 'Prix non défini' }, { status: 400 });
    label    = data.title;
    priceEur = data.price_eur;
  }

  // Format parseable par le webhook IPN : tableauId__formatIndex__timestamp
  const orderId = `${tableauId}__${typeof formatIndex === 'number' ? formatIndex : 0}__${Date.now()}`;

  const resp = await fetch(`${NOWPAY_HOST}/invoice`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount:   priceEur,
      price_currency: 'eur',
      order_id:       orderId,
      order_description: `${data.title} — ${label}`,
      success_url: `${APP_URL}/galerie/${tableauId}?payment=success`,
      cancel_url:  `${APP_URL}/galerie/${tableauId}?payment=cancelled`,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    console.error('[crypto] NowPayments error:', resp.status, txt);
    return NextResponse.json({ error: 'Erreur NowPayments — réessayez' }, { status: 502 });
  }

  const invoice = await resp.json() as { invoice_url?: string };
  if (!invoice.invoice_url) {
    return NextResponse.json({ error: 'URL NowPayments manquante' }, { status: 500 });
  }

  return NextResponse.json({ url: invoice.invoice_url });
}
