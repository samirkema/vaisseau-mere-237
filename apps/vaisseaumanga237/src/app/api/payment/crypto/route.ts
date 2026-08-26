import { NextResponse } from 'next/server';

// POST /api/payment/crypto — NowPayments BTC + monnaie maison
// TODO Phase 4 : intégration NowPayments + webhook handler + débit otaku_coin
// Hors-périmètre Phase 1 (système de cryptomonnaie traité séparément)
export async function POST() {
  return NextResponse.json(
    { mock: true, message: 'Paiement crypto disponible en Phase 4' },
    { status: 501 },
  );
}
