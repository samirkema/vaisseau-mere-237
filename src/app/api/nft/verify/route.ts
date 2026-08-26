import { NextResponse } from 'next/server';
import { ethers }       from 'ethers';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkNftOwnership } from '@/lib/alchemy';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// POST /api/nft/verify — vérifie qu'un wallet appartient à l'utilisateur ET détient le NFT.
// Body : { walletAddress: string, signature: string, message: string }
// Flux :
//   1. Client signe un message avec MetaMask (côté navigateur)
//   2. Ce handler vérifie la signature (ethers.verifyMessage) côté serveur
//   3. Alchemy confirme la possession du NFT
//   4. Le profil passe à tier='nft' via service_role
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { walletAddress, signature, message } = body as {
    walletAddress?: string;
    signature?:     string;
    message?:       string;
  };

  if (!walletAddress || !signature || !message) {
    return NextResponse.json(
      { error: 'walletAddress, signature et message sont requis' },
      { status: 400 },
    );
  }

  // Valider le format du message et l'horodatage (protection anti-replay)
  // Format attendu : "Vaisseau Manga 237 — Vérification wallet\nAdresse : 0x…\nUser : <uuid>\nTimestamp : <ms>"
  const MSG_RE = /^Vaisseau Manga 237 — Vérification wallet\nAdresse : (0x[0-9a-fA-F]{40})\nUser : ([0-9a-f-]{36})\nTimestamp : (\d{13,14})$/;
  const msgMatch = MSG_RE.exec(message);
  if (!msgMatch) {
    return NextResponse.json({ error: 'Format de message invalide' }, { status: 400 });
  }

  const msgTimestamp = parseInt(msgMatch[3], 10);
  const ageMs = Date.now() - msgTimestamp;
  if (ageMs < 0 || ageMs > 5 * 60 * 1000) {
    return NextResponse.json(
      { error: 'Message expiré — reconnectez votre wallet' },
      { status: 400 },
    );
  }

  if (msgMatch[2] !== user.id) {
    return NextResponse.json({ error: 'Identifiant utilisateur invalide' }, { status: 403 });
  }

  if (!ADDRESS_RE.test(walletAddress)) {
    return NextResponse.json({ error: 'walletAddress invalide' }, { status: 400 });
  }

  // 1. Vérification de la signature — prouve que l'utilisateur contrôle ce wallet
  let recovered: string;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch {
    return NextResponse.json({ error: 'Signature mal formée' }, { status: 400 });
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: 'La signature ne correspond pas au walletAddress fourni' },
      { status: 403 },
    );
  }

  // 2. Vérification de la possession du NFT via Alchemy (côté serveur uniquement)
  let holdsNft: boolean;
  try {
    holdsNft = await checkNftOwnership(walletAddress);
  } catch (err) {
    console.error('[nft/verify] Alchemy error:', err);
    return NextResponse.json({ error: 'Erreur lors de la vérification NFT' }, { status: 502 });
  }

  if (!holdsNft) {
    return NextResponse.json(
      { error: 'Ce wallet ne détient pas le NFT requis' },
      { status: 403 },
    );
  }

  // 3. Mise à jour du profil via service_role (bypass trigger — autorisé car service_role)
  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from('profiles')
    .update({
      subscription_tier: 'nft',
      wallet_address:    walletAddress.toLowerCase(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[nft/verify] profile update:', error.message);
    return NextResponse.json({ error: 'Erreur mise à jour profil' }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
