import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const NOWPAY_HOST = 'https://api.nowpayments.io/v1';
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE     = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/payment/tableau/crypto
// Body : { tableauId, formatIndex?, customerEmail? }
// Le prix est toujours lu en base.
export async function POST(request: Request) {
  const API_KEY = process.env.NOWPAYMENTS_API_KEY ?? '';
  if (!API_KEY) {
    return NextResponse.json({ error: 'Paiement crypto non configuré' }, { status: 503 });
  }

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
  let priceEur: number;

  if (formats.length > 0) {
    const idx = Number.isInteger(formatIndex) && (formatIndex as number) >= 0
      ? (formatIndex as number) : 0;
    const fmt = formats[idx];
    if (!fmt) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    label    = fmt.label;
    priceEur = fmt.price_eur;
  } else {
    if (data.price_eur == null) return NextResponse.json({ error: 'Prix non défini' }, { status: 400 });
    label    = data.title;
    priceEur = data.price_eur;
  }

  const fmtIndex = Number.isInteger(formatIndex) && (formatIndex as number) >= 0
    ? (formatIndex as number) : 0;

  // Commande pending pour stocker l'email avant le paiement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingOrder } = await (svc as any).from('orders').insert({
    tableau_id:     tableauId,
    format:         label,
    amount_eur:     priceEur,
    customer_email: customerEmail ?? null,
    method:         'crypto',
    status:         'pending',
  }).select('id').single();

  const pendingId = (pendingOrder as { id?: string } | null)?.id ?? crypto.randomUUID();
  const orderId   = `${pendingId}__${tableauId}__${fmtIndex}`;

  // Timeout 10s sur l'appel NowPayments
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10_000);

  let invoice: { invoice_url?: string };
  try {
    const resp = await fetch(`${NOWPAY_HOST}/invoice`, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_amount:      priceEur,
        price_currency:    'eur',
        order_id:          orderId,
        order_description: `${data.title} — ${label}`,
        ipn_callback_url:  `${APP_URL}/api/payment/nowpayments/webhook`,
        success_url:       `${APP_URL}/galerie/${tableauId}?payment=success`,
        cancel_url:        `${APP_URL}/galerie/${tableauId}?payment=cancelled`,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      console.error('[crypto] NowPayments error:', resp.status, txt.slice(0, 200));
      return NextResponse.json({ error: 'Erreur NowPayments — réessayez' }, { status: 502 });
    }
    invoice = await resp.json() as { invoice_url?: string };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return NextResponse.json({ error: 'NowPayments ne répond pas — réessayez' }, { status: 504 });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!invoice.invoice_url) {
    return NextResponse.json({ error: 'URL NowPayments manquante' }, { status: 500 });
  }

  return NextResponse.json({ url: invoice.invoice_url });
}
