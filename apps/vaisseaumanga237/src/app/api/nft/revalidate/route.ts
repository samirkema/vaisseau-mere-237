import { NextResponse }  from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { checkNftOwnership }   from '@/lib/alchemy';

// POST /api/nft/revalidate — appelé par GitHub Actions cron toutes les 24h.
// Protégé par : Authorization: Bearer <CRON_SECRET>
// Pour chaque profil tier='nft' : re-vérifie la possession du NFT.
// Si le wallet ne détient plus le NFT → subscription_tier = 'free'.
// Budget d'exécution (ms) — Vercel Free/Pro = 10 s, on réserve 1 s de marge.
const EXEC_BUDGET_MS = 9_000;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get('authorization') ?? '';
  if (!secret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(auth);
  const valid    = expected.length === received.length && timingSafeEqual(expected, received);
  if (!valid) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const svc = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nftProfiles, error } = await (svc as any)
    .from('profiles')
    .select('id, wallet_address')
    .eq('subscription_tier', 'nft');

  if (error) {
    console.error('[nft/revalidate] fetch profiles:', error.message);
    return NextResponse.json({ error: 'Erreur lecture profils' }, { status: 500 });
  }

  const profiles = (nftProfiles ?? []) as { id: string; wallet_address: string | null }[];
  const results  = { checked: profiles.length, revoked: 0, errors: 0, timedOut: false };
  const deadline = Date.now() + EXEC_BUDGET_MS;

  // Traitement séquentiel pour éviter de saturer Alchemy en rafale
  for (const profile of profiles) {
    if (Date.now() > deadline) {
      results.timedOut = true;
      break;
    }
    if (!profile.wallet_address) {
      // Wallet manquant → révoquer sans appel Alchemy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (svc as any).from('profiles').update({ subscription_tier: 'free' }).eq('id', profile.id);
      results.revoked++;
      continue;
    }

    try {
      const holdsNft = await checkNftOwnership(profile.wallet_address);
      if (!holdsNft) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (svc as any).from('profiles').update({ subscription_tier: 'free' }).eq('id', profile.id);
        results.revoked++;
      }
    } catch (err) {
      // Ne pas révoquer en cas d'erreur Alchemy — conserver l'accès par sécurité
      console.error(`[nft/revalidate] Alchemy error for ${profile.id}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
