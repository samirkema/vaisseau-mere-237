-- Ajout de la colonne formats pour les tailles/prix multiples par tableau.
-- Structure : [{"label": "A4 (21×30 cm)", "price_eur": 25}, ...]
ALTER TABLE public.tableaux
  ADD COLUMN IF NOT EXISTS formats jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.tableaux.formats IS
  'Formats disponibles : [{"label": "A4 (21×30 cm)", "price_eur": 25}]';
