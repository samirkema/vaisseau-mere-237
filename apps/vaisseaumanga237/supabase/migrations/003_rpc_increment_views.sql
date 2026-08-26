-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — RPC incrément atomique views_count (Phase 3)
-- ═══════════════════════════════════════════════════════════

-- Incrémente views_count de façon atomique côté serveur.
-- SECURITY DEFINER car la policy RLS "Écriture admin" bloque les updates
-- des utilisateurs normaux sur manga_works ; seul le service_role ou cette
-- fonction peut incrémenter le compteur.
-- Appelé uniquement depuis le Server Component lecteur (service_role).
create function public.increment_views_count(work_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.manga_works
  set views_count = views_count + 1
  where id = work_id and published = true;
$$;
