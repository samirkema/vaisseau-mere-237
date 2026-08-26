import { describe, it, expect, vi, beforeEach } from 'vitest';

// Exerce le HANDLER de route (pas seulement une logique pure).
// Objectifs de mutation :
//  - supprimer la garde `authorized()` → doit casser (test 401).
//  - transformer `!holdsNft` en `holdsNft` → doit casser (test révocation).
//  - révoquer malgré une erreur Alchemy → doit casser (test fail-safe).

const CRON_SECRET = 'secret-cron-test';

type ProfileRow = { id: string; wallet_address: string | null; last_revalidated_at: string | null };

let nftProfiles: ProfileRow[] = [];
const updates: Array<{ id: string; payload: Record<string, unknown> }> = [];

const alchemy = { holds: true, throws: false };

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: () => ({
      // .select('...').eq('subscription_tier','nft').order(...).limit(N)
      select: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain: any = {};
        Object.assign(chain, {
          eq: () => chain,
          order: () => chain,
          limit: () => Promise.resolve({ data: nftProfiles, error: null }),
        });
        return chain;
      },
      // .update({...}).eq('id', id)
      update: (payload: Record<string, unknown>) => ({
        eq: (_col: string, id: string) => {
          updates.push({ id, payload });
          return Promise.resolve({ error: null });
        },
      }),
    }),
  }),
}));

vi.mock('@/lib/alchemy', () => ({
  checkNftOwnership: vi.fn(async () => {
    if (alchemy.throws) throw new Error('Alchemy indisponible');
    return alchemy.holds;
  }),
}));

const { GET } = await import('@/app/api/nft/revalidate/route');

function req(secret?: string) {
  return new Request('https://exemple.test/api/nft/revalidate', {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = CRON_SECRET;
  updates.length = 0;
  nftProfiles = [{ id: 'u1', wallet_address: '0xabc', last_revalidated_at: null }];
  alchemy.holds = true;
  alchemy.throws = false;
});

describe('GET /api/nft/revalidate', () => {
  it('401 sans bearer ou avec un mauvais secret, sans toucher aux profils', async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req('mauvais-secret'))).status).toBe(401);
    expect(updates).toHaveLength(0);
  });

  it('401 quand CRON_SECRET est absent (fail-closed)', async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req(CRON_SECRET))).status).toBe(401);
  });

  it('révoque un profil qui ne détient plus le NFT', async () => {
    alchemy.holds = false;
    const json = await (await GET(req(CRON_SECRET))).json();
    expect(json.revoked).toBe(1);
    expect(updates[0].payload).toMatchObject({ subscription_tier: 'free' });
  });

  it('révoque un profil sans wallet sans appeler Alchemy', async () => {
    nftProfiles = [{ id: 'u2', wallet_address: null, last_revalidated_at: null }];
    const { checkNftOwnership } = await import('@/lib/alchemy');
    const json = await (await GET(req(CRON_SECRET))).json();
    expect(json.revoked).toBe(1);
    expect(checkNftOwnership).not.toHaveBeenCalled();
  });

  it("NE révoque PAS et N'horodate PAS quand Alchemy échoue (accès conservé par sécurité)", async () => {
    alchemy.throws = true;
    const json = await (await GET(req(CRON_SECRET))).json();
    expect(json.revoked).toBe(0);
    expect(json.errors).toBe(1);
    expect(updates).toHaveLength(0);
  });

  it('horodate un profil qui détient toujours le NFT sans toucher au tier (curseur tournant)', async () => {
    const json = await (await GET(req(CRON_SECRET))).json();
    expect(json.revoked).toBe(0);
    expect(json.checked).toBe(1);
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toHaveProperty('last_revalidated_at');
    expect(updates[0].payload).not.toHaveProperty('subscription_tier');
  });
});
