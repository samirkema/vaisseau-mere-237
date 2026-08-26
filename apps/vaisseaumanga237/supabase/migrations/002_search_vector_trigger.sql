-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — Trigger search_vector (Phase 2)
-- ═══════════════════════════════════════════════════════════

-- Mise à jour automatique de search_vector à chaque insert/update
-- sur les colonnes title et description des manga_works.
create function public.update_manga_search_vector()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.search_vector := to_tsvector('simple',
    coalesce(new.title, '') || ' ' || coalesce(new.description, '')
  );
  return new;
end;
$$;

create trigger manga_works_search_vector
  before insert or update of title, description
  on public.manga_works
  for each row execute function public.update_manga_search_vector();

-- Met à jour le search_vector des lignes déjà existantes
update public.manga_works
set search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' || coalesce(description, '')
);
