-- Table de commandes tableaux
CREATE TABLE IF NOT EXISTS public.orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id     uuid        REFERENCES public.tableaux(id) ON DELETE SET NULL,
  format         text,
  amount_eur     numeric(10,2) NOT NULL,
  customer_email text,
  customer_name  text,
  payment_ref    text,
  method         text        NOT NULL DEFAULT 'stripe',
  status         text        NOT NULL DEFAULT 'completed',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index pour retrouver les commandes par tableau
CREATE INDEX IF NOT EXISTS orders_tableau_id_idx ON public.orders(tableau_id);

-- RLS : uniquement via service role (pas d'accès public)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
