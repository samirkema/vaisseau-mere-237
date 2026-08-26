-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — RPC incrément atomique votes_count
-- ═══════════════════════════════════════════════════════════

-- Incrémente votes_count de façon atomique côté serveur.
-- SECURITY DEFINER : la policy RLS "Écriture admin" bloque les updates
-- des utilisateurs normaux sur remixes ; seul le service_role ou cette
-- fonction peut incrémenter le compteur.
create function public.increment_remix_votes(remix_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.remixes
  set votes_count = votes_count + 1
  where id = remix_id;
$$;
