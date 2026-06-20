import { NextResponse } from 'next/server';
import { createHmac }   from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTableauOrderToAdmin, sendTableauOrderConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vérifie la signature HMAC-SHA512 de NowPayments
function verifySignature(body: Record<string, unknown>, signature: string, secret: string): boolean {
  const sorted = Object.keys(body).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = body[key];
    return acc;
  }, {});
  const expected = createHmac('sha512', secret).update(JSON.stringify(sorted)).digest('hex');
  return expected === signature;
}

// Statuts NowPayments qui confirment le paiement effectif
const PAID_STATUSES = new Set(['finished', 'confirmed', 'partially_paid']);

export async function POST(request: Request) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET ?? '';
  if (!secret) {
    console.error('[nowpayments/webhook] NOWPAYMENTS_IPN_SECRET non configuré');
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

  const signature = request.headers.get('x-nowpayments-sig') ?? '';
  if (!verifySignature(body, signature, secret)) {
    console.error('[nowpayments/webhook] signature invalide');
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const status  = body.payment_status as string | undefined;
  const orderId = body.order_id       as string | undefined;

  if (!PAID_STATUSES.has(status ?? '')) {
    // Statut intermédiaire (waiting, sending…) — on ignore, NowPayments renverra quand terminé
    return NextResponse.json({ received: true });
  }

  if (!orderId) {
    console.error('[nowpayments/webhook] order_id manquant');
    return NextResponse.json({ error: 'order_id manquant' }, { status: 400 });
  }

  // order_id format : tableauId__formatIndex__timestamp
  const parts      = orderId.split('__');
  const tableauId  = parts[0];
  const formatIndex = parseInt(parts[1] ?? '0', 10);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(tableauId)) {
    console.error('[nowpayments/webhook] tableauId invalide dans order_id:', orderId);
    return NextResponse.json({ error: 'order_id invalide' }, { status: 400 });
  }

  const svc = createServiceClient();

  // Récupérer titre + format depuis la base
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tableau } = await (svc as any)
    .from('tableaux')
    .select('title, price_eur, formats')
    .eq('id', tableauId)
    .single();

  type FormatEntry = { label: string; price_eur: number };
  const formats: FormatEntry[] = Array.isArray(tableau?.formats) ? tableau.formats : [];
  const fmt = formats[formatIndex];

  const tableauTitle = (tableau?.title as string | undefined) ?? tableauId;
  const format       = fmt?.label ?? (body.order_description as string | undefined) ?? '—';
  const amountEur    = typeof body.price_amount === 'number' ? body.price_amount : (fmt?.price_eur ?? tableau?.price_eur ?? 0);
  const paymentRef   = `nowpay-${body.payment_id ?? ''}`;
  const customerEmail = null; // NowPayments ne transmet pas l'email acheteur

  // Dédoublonnage : vérifier que la commande n'est pas déjà enregistrée
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (svc as any)
    .from('orders')
    .select('id')
    .eq('payment_ref', paymentRef)
    .maybeSingle();

  if (!existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: orderErr } = await (svc as any).from('orders').insert({
      tableau_id:     tableauId,
      format,
      amount_eur:     amountEur,
      customer_email: customerEmail,
      payment_ref:    paymentRef,
      method:         'crypto',
      status:         'completed',
    });
    if (orderErr) console.error('[nowpayments/webhook] order insert:', orderErr.message);
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  if (adminEmail) {
    sendTableauOrderToAdmin({
      adminEmail,
      tableauTitle,
      format,
      amountEur,
      customerEmail:  null,
      customerName:   null,
      paymentRef,
    }).catch(err => console.error('[nowpayments/webhook] admin email:', err));
  }

  return NextResponse.json({ received: true });
}
