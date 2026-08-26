-- ═══════════════════════════════════════════════════════════
-- Curseur de revalidation NFT (US 7.1 C3)
-- ═══════════════════════════════════════════════════════════
--
-- Le cron `GET /api/nft/revalidate` (Vercel Cron, 1×/jour) parcourt les profils
-- tier='nft' du plus anciennement revalidé au plus récent, par lots bornés par
-- le budget d'exécution Vercel. Sans cette colonne, un run tronqué laisserait
-- toujours la même fin de liste non revalidée : un wallet revendu pourrait
-- garder l'accès indéfiniment.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_revalidated_at timestamptz;

-- Index partiel : seuls les profils NFT sont parcourus par le cron.
CREATE INDEX IF NOT EXISTS profiles_nft_revalidation_idx
  ON public.profiles (last_revalidated_at NULLS FIRST)
  WHERE subscription_tier = 'nft';
