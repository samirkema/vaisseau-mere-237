import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPaymentReceipt, sendTableauOrderToAdmin, sendTableauOrderConfirmation } from '@/lib/email';

// Le webhook doit lire le body brut pour que Stripe puisse vérifier la signature.
// Next.js App Router ne pré-parse pas le body dans les Route Handlers.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.text();
  const sig  = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Signature Stripe invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session    = event.data.object as Stripe.Checkout.Session;
    const tableauId  = session.metadata?.tableauId;
    const userId     = session.metadata?.userId;

    // ── Commande tableau ────────────────────────────────────────────────────
    if (tableauId) {
      const svc           = createServiceClient();
      const format        = session.metadata?.format ?? '—';
      const amountEur     = (session.amount_total ?? 0) / 100;
      const customerEmail = session.customer_email ?? session.customer_details?.email ?? null;
      const customerName  = session.customer_details?.name ?? null;
      const paymentRef    = typeof session.payment_intent === 'string' ? session.payment_intent : null;

      // Récupérer le titre du tableau
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tableau } = await (svc as any)
        .from('tableaux')
        .select('title')
        .eq('id', tableauId)
        .single();
      const tableauTitle = (tableau as { title?: string } | null)?.title ?? tableauId;

      if (!paymentRef) {
        console.error('[stripe/webhook] payment_intent absent de la session');
        return NextResponse.json({ error: 'payment_intent manquant' }, { status: 400 });
      }

      // Upsert idempotent : si payment_ref existe déjà (replay Stripe), on ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: orderErr } = await (svc as any).from('orders').upsert({
        tableau_id:     tableauId,
        format,
        amount_eur:     amountEur,
        customer_email: customerEmail,
        customer_name:  customerName,
        payment_ref:    paymentRef,
        method:         'stripe',
        status:         'completed',
      }, { onConflict: 'payment_ref', ignoreDuplicates: true });

      if (orderErr && orderErr.code !== '23505') {
        console.error('[stripe/webhook] order upsert:', orderErr.message);
        return NextResponse.json({ error: 'Erreur enregistrement commande' }, { status: 500 });
      }

      const adminEmail = process.env.ADMIN_EMAIL ?? null;
      if (adminEmail) {
        sendTableauOrderToAdmin({ adminEmail, tableauTitle, format, amountEur, customerEmail, customerName, paymentRef })
          .catch(err => console.error('[stripe/webhook] admin email:', err));
      }
      if (customerEmail) {
        sendTableauOrderConfirmation({ to: customerEmail, customerName, tableauTitle, format, amountEur, paymentRef })
          .catch(err => console.error('[stripe/webhook] buyer email:', err));
      }

      return NextResponse.json({ received: true });
    }

    // ── Abonnement ──────────────────────────────────────────────────────────
    if (!userId) {
      console.error('[stripe/webhook] userId absent des métadonnées');
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    // Abonnement 30 jours à compter du paiement
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const svc = createServiceClient();

    const [profileRes, paymentRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any)
        .from('profiles')
        .update({
          subscription_tier:       'subscriber',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId)
        .select('pseudo')
        .single(),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (svc as any)
        .from('payments')
        .insert({
          user_id:      userId,
          amount:       (session.amount_total ?? 0) / 100,
          currency:     session.currency ?? 'eur',
          method:       'stripe',
          status:       'completed',
          provider_ref: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        }),
    ]);

    if (profileRes.error) {
      console.error('[stripe/webhook] profile update:', profileRes.error.message);
      return NextResponse.json({ error: 'Erreur activation abonnement' }, { status: 500 });
    }
    if (paymentRes.error) {
      console.error('[stripe/webhook] payment insert:', paymentRes.error.message);
      // Ne pas bloquer Stripe pour un log de paiement manquant — l'accès est déjà accordé.
    }

    // Envoi du reçu email (fire-and-forget — ne pas bloquer la réponse Stripe)
    const email    = session.customer_email ?? session.customer_details?.email ?? null;
    const pseudo   = (profileRes.data as { pseudo?: string } | null)?.pseudo ?? 'abonné';
    const amountEur = (session.amount_total ?? 0) / 100;
    const payRef    = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    if (email) {
      sendPaymentReceipt({ to: email, pseudo, amountEur, paymentRef: payRef, expiresAt })
        .catch(err => console.error('[stripe/webhook] email reçu:', err));
    }
  }

  return NextResponse.json({ received: true });
}
