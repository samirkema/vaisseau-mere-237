-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — Restriction d'accès aux RPC SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════
--
-- Par défaut, CREATE FUNCTION accorde EXECUTE à PUBLIC (anon inclus).
-- Un client Supabase avec la clé anon publique pourrait appeler
-- increment_views_count directement et gonfler les compteurs.
-- On révoque et réserve l'exécution au service_role uniquement.

revoke execute on function public.increment_views_count(uuid) from public, anon, authenticated;
