-- Contrainte d'unicité sur payment_ref → webhooks idempotents
-- NULL n'est pas concerné par UNIQUE (plusieurs commandes pending sans ref coexistent)
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_ref_unique UNIQUE (payment_ref);

-- Policy RLS SELECT manquante : les admins peuvent lire les commandes
CREATE POLICY "Lecture admin orders" ON public.orders
  FOR SELECT USING (public.is_admin());

-- DEFAULT 'completed' était incorrect — les commandes créées sans statut explicite
-- doivent être 'pending' (statut neutre) et non déjà complétées
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending';
