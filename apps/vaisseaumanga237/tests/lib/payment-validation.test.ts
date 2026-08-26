import { describe, it, expect } from 'vitest';
import { assessNowPaymentsIpn } from '@/lib/payment-validation';

// Commande de référence : un tableau à 300 €.
const PRICE_EUR = 300;

describe('assessNowPaymentsIpn', () => {
  describe('sous-paiement (défaut corrigé)', () => {
    it("refuse un statut partially_paid, même avec une signature valide", () => {
      // Scénario de l'audit : l'acheteur commande à 300 €, envoie l'équivalent
      // de 5 €, s'arrête. NowPayments émet partially_paid avec une signature
      // parfaitement valide. La commande ne doit PAS être complétée.
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'partially_paid', price_amount: PRICE_EUR, pay_amount: 0.01, actually_paid: 0.0002 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('rejected');
    });

    it('refuse un montant crypto reçu très inférieur au montant attendu', () => {
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: PRICE_EUR, pay_amount: 0.01, actually_paid: 0.002 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('rejected');
    });

    it('refuse quand le prix facturé est inférieur au montant de la commande', () => {
      // Protège contre un order_id pointé vers une commande plus chère
      // que la facture réellement réglée.
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: 5, pay_amount: 0.01, actually_paid: 0.01 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('rejected');
    });
  });

  describe('paiements légitimes', () => {
    it('accepte un paiement finished au bon montant', () => {
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: PRICE_EUR, pay_amount: 0.01, actually_paid: 0.01 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });

    it('accepte un paiement confirmed au bon montant', () => {
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'confirmed', price_amount: PRICE_EUR, pay_amount: 0.01, actually_paid: 0.01 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });

    it('tolère un arrondi de conversion crypto sous le seuil de tolérance', () => {
      // 0.999 % de manque : arrondi, pas sous-paiement.
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: PRICE_EUR, pay_amount: 1, actually_paid: 0.995 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });

    it('tolère un écart au centime sur le prix en euros', () => {
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: 300.01, actually_paid: 1, pay_amount: 1 },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });

    it('accepte quand NowPayments ne fournit pas les montants crypto', () => {
      const verdict = assessNowPaymentsIpn({ payment_status: 'finished' }, PRICE_EUR);
      expect(verdict.outcome).toBe('settled');
    });

    it('accepte les montants transmis sous forme de chaînes', () => {
      // NowPayments sérialise parfois les montants en string.
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: '300', pay_amount: '0.01', actually_paid: '0.01' },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });
  });

  describe('statuts non finaux', () => {
    it.each(['waiting', 'confirming', 'sending', 'failed', 'expired', 'refunded'])(
      'ignore le statut %s sans compléter la commande',
      (status) => {
        const verdict = assessNowPaymentsIpn({ payment_status: status }, PRICE_EUR);
        expect(verdict.outcome).toBe('ignored');
      },
    );

    it('ignore un statut absent', () => {
      const verdict = assessNowPaymentsIpn({}, PRICE_EUR);
      expect(verdict.outcome).toBe('ignored');
    });
  });

  describe('robustesse des entrées', () => {
    it('ignore des montants non numériques plutôt que de les traiter comme zéro', () => {
      const verdict = assessNowPaymentsIpn(
        { payment_status: 'finished', price_amount: 'abc', pay_amount: null, actually_paid: undefined },
        PRICE_EUR,
      );
      expect(verdict.outcome).toBe('settled');
    });

    it('ne complète jamais sur un payload vide', () => {
      const verdict = assessNowPaymentsIpn({}, 0);
      expect(verdict.outcome).not.toBe('settled');
    });
  });
});
