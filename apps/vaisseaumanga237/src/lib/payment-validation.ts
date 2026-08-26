// Validation d'un callback IPN NowPayments avant de compléter une commande.
//
// Logique pure et sans I/O : testable directement, sans mock réseau ni base.
// Le webhook (api/payment/nowpayments/webhook) se contente d'appliquer le verdict.
//
// Contexte des unités — la facture est créée avec `price_amount` en EUR
// (api/payment/tableau/crypto/route.ts:99-100), donc :
//   - `price_amount`  est en EUR         → comparable à `orders.amount_eur`
//   - `pay_amount`    est en cryptomonnaie
//   - `actually_paid` est en cryptomonnaie, dans la même unité que `pay_amount`
// Ne jamais comparer `actually_paid` à `amount_eur` : ce sont des unités différentes.

// Statuts où NowPayments considère les fonds reçus et définitifs.
// `partially_paid` en est volontairement EXCLU : il signifie que l'acheteur a
// envoyé moins que le montant dû. Le traiter comme payé revient à livrer contre
// un acompte.
const SETTLED_STATUSES = new Set(['finished', 'confirmed']);

// Tolérance relative sur le montant crypto reçu. NowPayments applique déjà sa
// propre marge avant d'annoncer `finished`/`confirmed` ; ce seuil n'est là que
// pour absorber les arrondis de conversion, pas pour accepter un sous-paiement.
const CRYPTO_SHORTFALL_TOLERANCE = 0.99;

// Tolérance absolue en EUR sur la comparaison du prix facturé (arrondi centime).
const EUR_EPSILON = 0.01;

export type NowPaymentsIpn = {
  payment_status?: unknown;
  price_amount?:   unknown;
  pay_amount?:     unknown;
  actually_paid?:  unknown;
};

export type PaymentAssessment =
  // `amountVerified: false` signale que NowPayments n'a fourni aucun montant
  // exploitable : on s'en remet alors au seul statut. L'appelant DOIT le
  // journaliser — un encaissement non vérifié ne doit jamais passer en silence.
  | { outcome: 'settled';  amountVerified: boolean; shortfallRatio: number | null }
  | { outcome: 'rejected'; reason: string }
  | { outcome: 'ignored';  reason: string };

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Décide si un IPN NowPayments autorise à compléter la commande.
 *
 * @param payload           Corps de l'IPN (déjà vérifié par signature HMAC).
 * @param expectedAmountEur Montant attendu, lu depuis `orders.amount_eur`.
 */
export function assessNowPaymentsIpn(
  payload: NowPaymentsIpn,
  expectedAmountEur: number,
): PaymentAssessment {
  const status = typeof payload.payment_status === 'string' ? payload.payment_status : '';

  if (status === 'partially_paid') {
    return { outcome: 'rejected', reason: 'Paiement partiel — montant inférieur au dû' };
  }

  if (!SETTLED_STATUSES.has(status)) {
    return { outcome: 'ignored', reason: `Statut non final : ${status || '(absent)'}` };
  }

  // Le prix facturé doit correspondre à la commande. Protège contre un order_id
  // pointé vers une commande plus chère que la facture réellement réglée.
  const priceAmount = toNumber(payload.price_amount);
  if (priceAmount !== null && Math.abs(priceAmount - expectedAmountEur) > EUR_EPSILON) {
    return {
      outcome: 'rejected',
      reason: `Prix facturé ${priceAmount} € ≠ montant commandé ${expectedAmountEur} €`,
    };
  }

  // Contrôle du montant crypto effectivement reçu, quand NowPayments le fournit.
  const payAmount    = toNumber(payload.pay_amount);
  const actuallyPaid = toNumber(payload.actually_paid);

  let shortfallRatio: number | null = null;
  if (payAmount !== null && actuallyPaid !== null && payAmount > 0) {
    if (actuallyPaid < payAmount * CRYPTO_SHORTFALL_TOLERANCE) {
      return {
        outcome: 'rejected',
        reason: `Montant reçu ${actuallyPaid} < attendu ${payAmount}`,
      };
    }
    // Manque résiduel toléré (0 si le compte est exact). Remonté à l'appelant
    // pour être journalisé : la tolérance ne doit pas être un angle mort.
    shortfallRatio = actuallyPaid < payAmount ? 1 - actuallyPaid / payAmount : 0;
  }

  // Le montant n'est considéré comme vérifié que si au moins un contrôle
  // chiffré a réellement pu être effectué.
  const amountVerified = priceAmount !== null || shortfallRatio !== null;

  return { outcome: 'settled', amountVerified, shortfallRatio };
}
