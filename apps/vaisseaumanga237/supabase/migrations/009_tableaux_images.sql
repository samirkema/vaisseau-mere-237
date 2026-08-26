-- Photos supplémentaires par tableau (en plus de main_image).
-- Structure : ["https://...img-UUID.webp", ...]
ALTER TABLE public.tableaux
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.tableaux.images IS
  'Photos supplémentaires : ["https://...img-UUID.webp"]';
