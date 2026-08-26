import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTableauOrderToAdmin, sendTableauOrderConfirmation, sendUnderpaidOrderAlert } from '@/lib/email';
import { assessNowPaymentsIpn } from '@/lib/payment-validation';

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

// Le verdict de paiement est délégué à assessNowPaymentsIpn (logique pure, testée).
// Voir lib/payment-validation.ts — `partially_paid` n'y est PAS traité comme payé.

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

  const orderId = body.order_id as string | undefined;

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

  // Lire la commande AVANT de la compléter : le montant attendu vient de la base,
  // jamais du payload — un payload forgé ne peut donc pas fixer son propre prix.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: readErr } = await (svc as any)
    .from('orders')
    .select('amount_eur, status, tableau_id, customer_email')
    .eq('id', pendingId)
    .maybeSingle();

  if (readErr) {
    console.error('[nowpayments/webhook] lecture commande:', readErr.message);
    return NextResponse.json({ error: 'Erreur lecture commande' }, { status: 500 });
  }
  if (!order) {
    // Commande inconnue → on acquitte pour que NowPayments cesse de rejouer.
    console.error('[nowpayments/webhook] commande introuvable:', pendingId);
    return NextResponse.json({ received: true });
  }

  const orderRow = order as {
    amount_eur?: number; tableau_id?: string | null; customer_email?: string | null;
  };

  // Le tableau désigné par order_id doit être celui de la commande, sinon les
  // e-mails nommeraient une autre œuvre que celle réellement payée.
  if (orderRow.tableau_id && orderRow.tableau_id !== tableauId) {
    console.error(
      `[nowpayments/webhook] incohérence order_id : tableau ${tableauId} ≠ commande ${orderRow.tableau_id}`,
    );
    return NextResponse.json({ error: 'order_id incohérent' }, { status: 400 });
  }

  // Vérification du montant réellement payé (logique pure et testée).
  const expectedEur = Number(orderRow.amount_eur ?? 0);
  const assessment  = assessNowPaymentsIpn(body, expectedEur);

  if (assessment.outcome === 'rejected') {
    // Sous-paiement ou prix incohérent : on ne complète JAMAIS la commande et on
    // n'envoie aucune confirmation à l'acheteur — sinon on livre contre un acompte.
    // La commande est marquée `underpaid` et l'administrateur est prévenu :
    // sans cet e-mail, le refus n'existerait que dans les journaux serveur.
    console.error(
      `[nowpayments/webhook] commande ${pendingId} refusée :`, assessment.reason,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from('orders')
      .update({ status: 'underpaid' })
      .eq('id', pendingId)
      .eq('status', 'pending');

    const adminEmailAddr = process.env.ADMIN_EMAIL ?? null;
    if (adminEmailAddr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: t } = await (svc as any)
        .from('tableaux').select('title').eq('id', tableauId).single();
      await sendUnderpaidOrderAlert({
        adminEmail:    adminEmailAddr,
        orderId:       pendingId,
        tableauTitle:  (t?.title as string | undefined) ?? tableauId,
        expectedEur,
        reason:        assessment.reason,
        customerEmail: orderRow.customer_email ?? null,
      }).catch(e => console.error('[nowpayments/webhook] alerte admin:', e));
    } else {
      console.error('[nowpayments/webhook] ADMIN_EMAIL absent — refus non notifié');
    }

    // 200 : l'IPN est bien reçu et traité, inutile que NowPayments le rejoue.
    return NextResponse.json({ received: true, completed: false });
  }

  if (assessment.outcome !== 'settled') {
    // Statut non final (waiting, confirming…) : rien à faire, on acquitte.
    return NextResponse.json({ received: true, completed: false });
  }

  // Encaissement accepté sans qu'aucun montant n'ait pu être recoupé : on le dit.
  if (!assessment.amountVerified) {
    console.warn(
      `[nowpayments/webhook] commande ${pendingId} complétée sans vérification de montant `
      + '(aucun price_amount/pay_amount exploitable dans l\'IPN)',
    );
  } else if (assessment.shortfallRatio && assessment.shortfallRatio > 0) {
    console.warn(
      `[nowpayments/webhook] commande ${pendingId} complétée avec un manque toléré de `
      + `${(assessment.shortfallRatio * 100).toFixed(3)} %`,
    );
  }

  // `underpaid` est accepté au même titre que `pending` : si l'acheteur complète
  // son versement, l'IPN suivant doit pouvoir débloquer la commande. Sans cela,
  // marquer `underpaid` condamnerait définitivement une commande régularisable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (svc as any)
    .from('orders')
    .update({ status: 'completed', payment_ref: paymentRef })
    .eq('id', pendingId)
    .in('status', ['pending', 'underpaid'])
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
