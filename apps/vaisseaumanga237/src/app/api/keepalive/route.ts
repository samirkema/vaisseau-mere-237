import { timingSafeEqual } from 'crypto';

// GET /api/keepalive — appelé par Vercel Cron une fois par jour (vercel.json).
//
// Supabase Free met un projet en pause après 7 jours sans requête. Cette route
// effectue une requête anodine pour maintenir le projet actif. Elle remplace le
// workflow GitHub Actions `supabase-keepalive.yml`, qui exigeait de recopier les
// clés Supabase dans les secrets du dépôt : ici on lit les variables déjà
// présentes dans le projet Vercel, donc aucun secret n'est dupliqué.
//
// Sécurité — la route est ouverte tant que CRON_SECRET n'est pas défini.
// Ce n'est pas une nouvelle surface d'attaque : elle n'utilise que la clé anon,
// qui est déjà publique par conception (préfixe NEXT_PUBLIC_, livrée au
// navigateur), et ne renvoie aucune donnée. N'importe qui pourrait interroger
// Supabase directement avec cette même clé. Si CRON_SECRET est défini un jour,
// la vérification ci-dessous s'active automatiquement — Vercel Cron envoie déjà
// cet en-tête. Pas de modification de code à prévoir.

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(request.headers.get('authorization') ?? '');
    const valid    = expected.length === received.length && timingSafeEqual(expected, received);
    if (!valid) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return Response.json({ error: 'Supabase non configuré' }, { status: 500 });
  }

  let status: number;
  try {
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        apikey:        anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache:  'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    status = res.status;
  } catch {
    return Response.json({ ok: false, error: 'Supabase injoignable' }, { status: 502 });
  }

  // Une 4xx (RLS qui filtre, table vide) prouve que le projet répond : c'est
  // suffisant pour le keep-alive. Seule une 5xx traduit un vrai incident.
  if (status >= 500) {
    return Response.json({ ok: false, status }, { status: 502 });
  }

  return Response.json({ ok: true, status });
}
