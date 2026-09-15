-- ═══════════════════════════════════════════════════════════
-- Nettoyage schéma — tables orphelines (audit 2026-09-16, VM2-M4)
-- ═══════════════════════════════════════════════════════════
--
-- Ces tables n'ont plus aucun appelant applicatif :
--   - tableaux, orders     : vente de tableaux retirée (admin/tableaux et
--                            api/payment/tableau/* supprimés)
--   - remixes, votes       : module My Remix retiré
--   - wallets,
--     wallet_transactions  : monnaie "otaku_coin" jamais implémentée
--   - activation_attempts  : rate-limiting du code d'activation, retiré
--
-- ⚠️ NE PAS APPLIQUER sans avoir vérifié qu'aucune ligne à conserver n'existe
-- (ex: historique de ventes de tableaux déjà honorées). Ce fichier est fourni
-- prêt à l'emploi mais volontairement NON exécuté automatiquement.

drop table if exists public.wallet_transactions;
drop table if exists public.wallets;
drop table if exists public.votes;
drop table if exists public.remixes;
drop table if exists public.orders;
drop table if exists public.tableaux;
drop table if exists public.activation_attempts;

drop function if exists public.increment_remix_votes(uuid);
