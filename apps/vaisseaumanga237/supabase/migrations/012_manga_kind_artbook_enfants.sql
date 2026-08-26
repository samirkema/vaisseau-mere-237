-- Ajouter les catégories artbook et livre-enfants à manga_works.kind
ALTER TABLE public.manga_works
  DROP CONSTRAINT IF EXISTS manga_works_kind_check;

ALTER TABLE public.manga_works
  ADD CONSTRAINT manga_works_kind_check
    CHECK (kind IN ('manga', 'webtoon', 'bd', 'artbook'));
