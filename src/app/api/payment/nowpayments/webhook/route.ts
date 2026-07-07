import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTableauOrderToAdmin, sendTableauOrderConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vérifie la signature HMAC-SHA512 de NowPayments (timing-safe — CWE-208)
function verifySignature(body: Record<string, unknown>, signature: string, secret: string): boolean {
  const sorted = Object.keys(body).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = body[key];
    return acc;
  }, {});
  const expected = createHmac('sha512', secret).update(JSON.stringify(sorted)).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

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
    return NextResponse.json({ received: true });
  }

  if (!orderId) {
    console.error('[nowpayments/webhook] order_id manquant');
    return NextResponse.json({ error: 'order_id manquant' }, { status: 400 });
  }

  // order_id format : pendingOrderId__tableauId__formatIndex
  const parts     = orderId.split('__');
  const pendingId = parts[0];
  const tableauId = parts[1] ?? '';

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(pendingId) || !UUID_RE.test(tableauId)) {
    console.error('[nowpayments/webhook] order_id invalide (format inattendu)');
    return NextResponse.json({ error: 'order_id invalide' }, { status: 400 });
  }

  const svc        = createServiceClient();
  const paymentRef = `nowpay-${body.payment_id ?? ''}`;

  // Mettre à jour la commande pending — le montant est lu depuis la commande (pas le payload)
  // pour éviter qu'un payload forgé écrase le montant réel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (svc as any)
    .from('orders')
    .update({ status: 'completed', payment_ref: paymentRef })
    .eq('id', pendingId)
    .eq('status', 'pending')
    .select('customer_email, format, amount_eur')
    .maybeSingle();

  if (updateErr) {
    console.error('[nowpayments/webhook] order update:', updateErr.message);
    return NextResponse.json({ error: 'Erreur mise à jour commande' }, { status: 500 });
  }

  if (!updated) {
    // Commande introuvable ou déjà complétée → replay idempotent, on acquitte
    return NextResponse.json({ received: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tableau } = await (svc as any)
    .from('tableaux').select('title').eq('id', tableauId).single();

  const tableauTitle  = (tableau?.title as string | undefined) ?? '—';
  const format        = (updated as { format?: string }).format ?? '—';
  const amountEur     = (updated as { amount_eur?: number }).amount_eur ?? 0;
  const customerEmail = (updated as { customer_email?: string }).customer_email ?? null;

  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  if (adminEmail) {
    sendTableauOrderToAdmin({ adminEmail, tableauTitle, format, amountEur, customerEmail, customerName: null, paymentRef })
      .catch(e => console.error('[nowpayments/webhook] admin email:', e));
  }
  if (customerEmail) {
    sendTableauOrderConfirmation({ to: customerEmail, customerName: null, tableauTitle, format, amountEur, paymentRef })
      .catch(e => console.error('[nowpayments/webhook] buyer email:', e));
  }

  return NextResponse.json({ received: true });
}
