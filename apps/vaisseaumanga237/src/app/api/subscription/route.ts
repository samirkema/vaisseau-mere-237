import { NextResponse } from 'next/server';

// POST /api/subscription — désactivé. L'accès est désormais exclusivement par NFT
// (voir api/nft/verify). L'activation par code a été retirée avec le modèle
// NFT-only ; son implémentation reste consultable dans l'historique Git.
export async function POST() {
  return NextResponse.json(
    { error: 'Activation par code désactivée — accès par NFT uniquement.' },
    { status: 410 },
  );
}
