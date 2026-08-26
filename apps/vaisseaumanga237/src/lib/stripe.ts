import Stripe from 'stripe';

// Singleton Stripe — instancié à la demande pour éviter les erreurs de build
// (STRIPE_SECRET_KEY n'est disponible qu'à l'exécution, pas au build).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
