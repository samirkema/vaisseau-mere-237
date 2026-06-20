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

  // order_id format : pendingOrderId__tableauId__formatIndex
  const parts     = orderId.split('__');
  const pendingId = parts[0];
  const tableauId = parts[1] ?? '';

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(pendingId) || !UUID_RE.test(tableauId)) {
    console.error('[nowpayments/webhook] order_id invalide:', orderId);
    return NextResponse.json({ error: 'order_id invalide' }, { status: 400 });
  }

  const svc        = createServiceClient();
  const paymentRef = `nowpay-${body.payment_id ?? ''}`;
  const amountEur  = typeof body.price_amount === 'number' ? body.price_amount : 0;

  // Mettre à jour la commande pending (qui contient déjà l'email de l'acheteur)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (svc as any)
    .from('orders')
    .update({ status: 'completed', payment_ref: paymentRef, amount_eur: amountEur })
    .eq('id', pendingId)
    .eq('status', 'pending') // dédoublonnage
    .select('customer_email, format, tableau_id')
    .maybeSingle();

  if (updateErr) console.error('[nowpayments/webhook] order update:', updateErr.message);

  // Récupérer titre du tableau
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tableau } = await (svc as any)
    .from('tableaux').select('title').eq('id', tableauId).single();

  const tableauTitle  = (tableau?.title as string | undefined) ?? tableauId;
  const format        = (updated as { format?: string } | null)?.format ?? '—';
  const customerEmail = (updated as { customer_email?: string } | null)?.customer_email ?? null;

  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  if (adminEmail) {
    sendTableauOrderToAdmin({
      adminEmail, tableauTitle, format, amountEur,
      customerEmail, customerName: null, paymentRef,
    }).catch(e => console.error('[nowpayments/webhook] admin email:', e));
  }

  if (customerEmail) {
    sendTableauOrderConfirmation({
      to: customerEmail, customerName: null,
      tableauTitle, format, amountEur, paymentRef,
    }).catch(e => console.error('[nowpayments/webhook] buyer email:', e));
  }

  return NextResponse.json({ received: true });
}
