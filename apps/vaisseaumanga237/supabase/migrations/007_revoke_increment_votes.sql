-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — Révocation accès public sur increment_remix_votes
-- ═══════════════════════════════════════════════════════════

-- Par défaut PostgreSQL accorde EXECUTE à PUBLIC sur toute nouvelle fonction.
-- Analogie migration 004 (increment_views_count).
revoke execute on function public.increment_remix_votes(uuid) from public;
revoke execute on function public.increment_remix_votes(uuid) from anon;
revoke execute on function public.increment_remix_votes(uuid) from authenticated;
