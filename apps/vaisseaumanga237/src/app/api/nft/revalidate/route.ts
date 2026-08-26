import { NextResponse }  from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { checkNftOwnership }   from '@/lib/alchemy';

// GET /api/nft/revalidate — déclenché par Vercel Cron (vercel.json), 1×/jour.
//
// Vercel Cron envoie une requête GET avec `Authorization: Bearer <CRON_SECRET>`
// dès que la variable CRON_SECRET existe dans le projet Vercel. La route ne
// répondait qu'en POST (jamais atteignable par un cron) et aucune entrée cron
// n'existait — la revalidation NFT (US 7.1 C3) était donc inactive.
//
// Pour chaque profil tier='nft', du plus anciennement revalidé au plus récent :
// re-vérifie la possession du NFT via Alchemy. Si le wallet ne détient plus le
// NFT (ou n'a pas de wallet) → subscription_tier = 'free'.
//
// `last_revalidated_at` est écrit sur CHAQUE profil traité (pas seulement les
// révoqués) : le tri par cette colonne fait tourner le curseur, donc tous les
// profils sont revus en ceil(total / BATCH_SIZE) jours même quand un run est
// tronqué par le budget d'exécution.

export const dynamic = 'force-dynamic';

// Vercel Hobby/Pro : 10 s de budget fonction — on garde 1 s de marge.
const EXEC_BUDGET_MS = 9_000;
// Plafond de profils par exécution (borne les appels Alchemy en rafale).
const BATCH_SIZE = 40;

function authorized(request: Request): boolean {
  // trim() : un secret enregistré avec un retour à la ligne parasite ferait
  // échouer la comparaison et le cron tomberait en 401 en silence.
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false; // fail-closed : pas de secret configuré → refus
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const svc = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nftProfiles, error } = await (svc as any)
    .from('profiles')
    .select('id, wallet_address, last_revalidated_at')
    .eq('subscription_tier', 'nft')
    .order('last_revalidated_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[nft/revalidate] fetch profiles:', error.message);
    return NextResponse.json({ error: 'Erreur lecture profils' }, { status: 500 });
  }

  const profiles = (nftProfiles ?? []) as {
    id: string; wallet_address: string | null; last_revalidated_at: string | null;
  }[];
  const results  = { checked: 0, revoked: 0, errors: 0, timedOut: false };
  const deadline = Date.now() + EXEC_BUDGET_MS;

  // Traitement séquentiel pour éviter de saturer Alchemy en rafale.
  for (const profile of profiles) {
    if (Date.now() > deadline) {
      results.timedOut = true;
      break;
    }
    results.checked++;

    let revoke: boolean;
    if (!profile.wallet_address) {
      revoke = true; // wallet manquant → révoquer sans appel Alchemy
    } else {
      try {
        revoke = !(await checkNftOwnership(profile.wallet_address));
      } catch (err) {
        // Erreur Alchemy → on NE révoque PAS (accès conservé par sécurité) et on
        // ne marque PAS le profil comme revalidé : il repassera en tête au run
        // suivant.
        console.error(`[nft/revalidate] Alchemy error for ${profile.id}:`, err);
        results.errors++;
        continue;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (svc as any)
      .from('profiles')
      .update({
        ...(revoke ? { subscription_tier: 'free' } : {}),
        last_revalidated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updErr) {
      console.error(`[nft/revalidate] update ${profile.id}:`, updErr.message);
      results.errors++;
      continue;
    }
    if (revoke) results.revoked++;
  }

  if (results.timedOut || results.errors > 0) {
    console.warn('[nft/revalidate] run incomplet:', JSON.stringify(results));
  }
  return NextResponse.json({ ok: true, ...results });
}
