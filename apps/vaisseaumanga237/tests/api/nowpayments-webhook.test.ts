import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

// Ce test exerce le HANDLER de route, pas seulement la logique pure.
// Objectif explicite : tuer la mutation « supprimer la garde de refus ».
// Un test qui ne couvre que assessNowPaymentsIpn laisserait passer cette
// suppression — c'est le défaut relevé lors du second audit.

const IPN_SECRET = 'secret-de-test';

// ── Journal des effets de bord observés ──────────────────────────────────────
const dbCalls: Array<{ table: string; op: string; payload?: unknown }> = [];
const emails  = { buyer: 0, admin: 0, underpaid: 0 };

// Constructeur de chaîne Supabase : chaque méthode retourne `this`, les
// terminateurs résolvent la valeur préparée pour la table courante.
function makeChain(table: string, result: unknown) {
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  Object.assign(chain, {
    select:       passthrough,
    eq:           passthrough,
    in:           passthrough,
    update: (payload: unknown) => { dbCalls.push({ table, op: 'update', payload }); return chain; },
    maybeSingle:  () => Promise.resolve({ data: result, error: null }),
    single:       () => Promise.resolve({ data: result, error: null }),
  });
  return chain;
}

// État de la commande servi par le mock, ajustable par test.
let orderRow: Record<string, unknown> | null = null;

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      dbCalls.push({ table, op: 'from' });
      if (table === 'tableaux') return makeChain(table, { title: 'Œuvre de test' });
      // Pour `orders`, la lecture initiale et l'UPDATE de complétion renvoient
      // tous deux une ligne exploitable.
      return makeChain(table, orderRow);
    },
  }),
}));

vi.mock('@/lib/email', () => ({
  sendTableauOrderConfirmation: vi.fn(async () => { emails.buyer += 1; }),
  sendTableauOrderToAdmin:      vi.fn(async () => { emails.admin += 1; }),
  sendUnderpaidOrderAlert:      vi.fn(async () => { emails.underpaid += 1; }),
}));

const { POST } = await import('@/app/api/payment/nowpayments/webhook/route');

const ORDER_UUID   = '11111111-1111-4111-8111-111111111111';
const TABLEAU_UUID = '22222222-2222-4222-8222-222222222222';

function signedRequest(payload: Record<string, unknown>) {
  // NowPayments signe le JSON aux clés triées.
  const sorted = Object.keys(payload).sort().reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = payload[k];
    return acc;
  }, {});
  const signature = createHmac('sha512', IPN_SECRET).update(JSON.stringify(sorted)).digest('hex');

  return new Request('https://exemple.test/api/payment/nowpayments/webhook', {
    method:  'POST',
    headers: { 'content-type': 'application/json', 'x-nowpayments-sig': signature },
    body:    JSON.stringify(payload),
  });
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    order_id:       `${ORDER_UUID}__${TABLEAU_UUID}__0`,
    payment_id:     '99999',
    payment_status: 'finished',
    price_amount:   300,
    pay_amount:     0.01,
    actually_paid:  0.01,
    ...overrides,
  };
}

beforeEach(() => {
  process.env.NOWPAYMENTS_IPN_SECRET = IPN_SECRET;
  process.env.ADMIN_EMAIL            = 'admin@exemple.test';
  dbCalls.length = 0;
  emails.buyer = emails.admin = emails.underpaid = 0;
  orderRow = {
    amount_eur:     300,
    status:         'pending',
    tableau_id:     TABLEAU_UUID,
    customer_email: 'acheteur@exemple.test',
    format:         'A3',
  };
});

describe('POST /api/payment/nowpayments/webhook', () => {
  it('complète la commande et notifie sur un paiement intégral', async () => {
    const res = await POST(signedRequest(basePayload()));
    expect(res.status).toBe(200);

    const completion = dbCalls.find(
      c => c.op === 'update' && (c.payload as { status?: string })?.status === 'completed',
    );
    expect(completion, 'la commande doit être complétée').toBeDefined();
    expect(emails.buyer).toBe(1);
    expect(emails.admin).toBe(1);
    expect(emails.underpaid).toBe(0);
  });

  it("NE complète PAS et alerte l'admin sur un paiement partiel", async () => {
    // Scénario du premier audit, rejoué contre le handler réel.
    const res  = await POST(signedRequest(basePayload({
      payment_status: 'partially_paid', actually_paid: 0.0002,
    })));
    const json = await res.json() as { completed?: boolean };

    expect(res.status).toBe(200);
    expect(json.completed).toBe(false);

    const completion = dbCalls.find(
      c => c.op === 'update' && (c.payload as { status?: string })?.status === 'completed',
    );
    expect(completion, 'aucune complétion ne doit avoir lieu').toBeUndefined();

    const marked = dbCalls.find(
      c => c.op === 'update' && (c.payload as { status?: string })?.status === 'underpaid',
    );
    expect(marked, 'la commande doit être marquée underpaid').toBeDefined();

    expect(emails.underpaid, "l'admin doit être alerté").toBe(1);
    expect(emails.buyer, "l'acheteur ne doit RIEN recevoir").toBe(0);
  });

  it('NE complète PAS quand le prix facturé est inférieur à la commande', async () => {
    const res = await POST(signedRequest(basePayload({ price_amount: 5 })));
    const json = await res.json() as { completed?: boolean };

    expect(json.completed).toBe(false);
    expect(emails.buyer).toBe(0);
    expect(emails.underpaid).toBe(1);
  });

  it('rejette une signature invalide sans toucher à la base', async () => {
    const req = new Request('https://exemple.test/api/payment/nowpayments/webhook', {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-nowpayments-sig': 'signature-bidon' },
      body:    JSON.stringify(basePayload()),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(dbCalls.length, 'aucun accès base sur signature invalide').toBe(0);
  });

  it("refuse un order_id désignant une autre œuvre que celle de la commande", async () => {
    orderRow = { ...orderRow, tableau_id: '33333333-3333-4333-8333-333333333333' };
    const res = await POST(signedRequest(basePayload()));
    expect(res.status).toBe(400);
    expect(emails.buyer).toBe(0);
  });

  it('ignore un statut non final sans rien modifier', async () => {
    const res  = await POST(signedRequest(basePayload({ payment_status: 'waiting' })));
    const json = await res.json() as { completed?: boolean };

    expect(json.completed).toBe(false);
    const anyUpdate = dbCalls.find(c => c.op === 'update');
    expect(anyUpdate, 'aucune écriture sur un statut non final').toBeUndefined();
    expect(emails.underpaid).toBe(0);
  });

  it('répond 503 si le secret IPN est absent', async () => {
    delete process.env.NOWPAYMENTS_IPN_SECRET;
    const res = await POST(signedRequest(basePayload()));
    expect(res.status).toBe(503);
  });
});
