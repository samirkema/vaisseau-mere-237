-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — Table de rate limiting (Phase 4)
-- ═══════════════════════════════════════════════════════════
--
-- Stocke les tentatives d'activation de code côté serveur.
-- Accessible uniquement via le service_role (RLS activée, aucune policy utilisateur).
-- L'IP est hashée SHA-256 avant insertion (vie privée).

create table public.activation_attempts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.profiles(id) on delete cascade,
  ip_hash      text        not null,
  attempted_at timestamptz not null default now()
);

alter table public.activation_attempts enable row level security;
-- Aucune policy : seul service_role (qui bypass la RLS) peut lire/écrire.

create index on public.activation_attempts(user_id, attempted_at);
create index on public.activation_attempts(ip_hash, attempted_at);

-- Nettoyage automatique des tentatives de plus de 7 jours
-- (à brancher sur pg_cron ou un cron GitHub Actions en Phase 5)
