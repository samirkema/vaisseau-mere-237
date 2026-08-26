-- ═══════════════════════════════════════════════════════════════════
-- OTAKU SHOP — Migration V1 → V2 (IDEMPOTENT)
-- À exécuter UNE FOIS dans le SQL Editor du projet Supabase existant.
-- Toutes les commandes utilisent IF NOT EXISTS / DO blocks → sans danger
-- si des éléments existent déjà.
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════
-- 1. TABLE PROFILES — ajout des colonnes V2 manquantes
-- ══════════════════════════════════════════════════

-- Créer la table si elle n'existe pas du tout
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Ajouter chaque colonne V2 si elle n'existe pas
alter table public.profiles add column if not exists pseudo                  text;
alter table public.profiles add column if not exists avatar_url              text;
alter table public.profiles add column if not exists role                    text not null default 'user';
alter table public.profiles add column if not exists subscription_tier       text not null default 'free';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists wallet_address          text;

-- Si V1 utilisait "username" → copier vers "pseudo"
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'username'
  ) then
    update public.profiles set pseudo = username where pseudo is null;
  end if;
end; $$;

-- Générer un pseudo pour les utilisateurs V1 qui n'en ont pas encore
update public.profiles
set pseudo = (
  select split_part(u.email, '@', 1) || '_' || left(public.profiles.id::text, 4)
  from auth.users u where u.id = public.profiles.id
)
where pseudo is null or trim(pseudo) = '';

-- Rendre pseudo NOT NULL (maintenant que tous les profils en ont un)
alter table public.profiles alter column pseudo set not null;

-- Contraintes (idempotentes via DO block)
do $$ begin
  alter table public.profiles add constraint profiles_pseudo_key unique (pseudo);
exception when duplicate_object then null;
end; $$;

do $$ begin
  alter table public.profiles add constraint profiles_wallet_address_key unique (wallet_address);
exception when duplicate_object then null;
end; $$;

do $$ begin
  alter table public.profiles add constraint profiles_role_check
    check (role in ('user', 'admin', 'superadmin'));
exception when duplicate_object then null;
end; $$;

do $$ begin
  alter table public.profiles add constraint profiles_subscription_tier_check
    check (subscription_tier in ('free', 'subscriber', 'nft'));
exception when duplicate_object then null;
end; $$;

-- ══════════════════════════════════════════════════
-- 2. TRIGGER — création automatique de profil à l'inscription
-- ══════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_pseudo  text;
  final_pseudo text;
  suffix       int := 0;
begin
  base_pseudo := coalesce(
    nullif(trim(new.raw_user_meta_data->>'pseudo'), ''),
    split_part(new.email, '@', 1)
  );
  final_pseudo := base_pseudo;
  while exists (select 1 from public.profiles where pseudo = final_pseudo) loop
    suffix := suffix + 1;
    final_pseudo := base_pseudo || '_' || suffix;
  end loop;
  insert into public.profiles (id, pseudo)
  values (new.id, final_pseudo)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recréer le trigger (drop + create idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════════
-- 3. NOUVELLES TABLES
-- ══════════════════════════════════════════════════

create table if not exists public.tableaux (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  artist      text,
  main_image  text not null,
  thumbnail   text not null,
  price_eur   numeric(10,2),
  price_btc   numeric(18,8),
  available   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id)
);

create table if not exists public.manga_works (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  cover_url      text,
  kind           text not null default 'manga'
                 check (kind in ('manga', 'webtoon', 'bd')),
  language       text default 'fr' check (language in ('fr', 'en', 'jp')),
  display_config jsonb,
  published      boolean not null default false,
  views_count    integer not null default 0,
  search_vector  tsvector,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

create table if not exists public.manga_pages (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.manga_works(id) on delete cascade,
  page_number integer not null,
  image_url   text not null,
  created_at  timestamptz not null default now(),
  unique (work_id, page_number)
);

create table if not exists public.manga_display_permissions (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.manga_works(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (work_id, user_id)
);

create table if not exists public.remixes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  photo_id    text not null,
  image_path  text not null,
  votes_count integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, photo_id)
);

create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  voter_id   uuid not null references public.profiles(id) on delete cascade,
  remix_id   uuid not null references public.remixes(id) on delete cascade,
  photo_id   text not null,
  created_at timestamptz not null default now(),
  unique (voter_id, photo_id)
);

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  amount       numeric(10,2) not null,
  currency     text not null,
  method       text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'completed', 'failed', 'refunded')),
  provider_ref text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.reading_progress (
  user_id     uuid references public.profiles(id)    on delete cascade,
  work_id     uuid references public.manga_works(id) on delete cascade,
  page_number integer     not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (user_id, work_id)
);

create table if not exists public.wallets (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  otaku_coin_balance numeric(18,2) not null default 0 check (otaku_coin_balance >= 0),
  updated_at         timestamptz   not null default now()
);

create table if not exists public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      numeric(18,2) not null,
  reason     text not null,
  payment_id uuid references public.payments(id),
  created_at timestamptz not null default now()
);

create table if not exists public.activation_attempts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.profiles(id) on delete cascade,
  ip_hash      text        not null,
  attempted_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════
-- 3b. COLONNES MANQUANTES SUR LES TABLES V1 EXISTANTES
--     (si les tables existaient déjà avec un schéma différent)
-- ══════════════════════════════════════════════════

-- votes : V1 utilisait peut-être user_id au lieu de voter_id
alter table public.votes add column if not exists voter_id   uuid references public.profiles(id) on delete cascade;
alter table public.votes add column if not exists remix_id   uuid references public.remixes(id) on delete cascade;
alter table public.votes add column if not exists photo_id   text;
alter table public.votes add column if not exists created_at timestamptz not null default now();

-- Si V1 avait user_id → copier vers voter_id
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'votes' and column_name = 'user_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'votes' and column_name = 'voter_id'
  ) then
    update public.votes set voter_id = user_id where voter_id is null;
  end if;
end; $$;

-- remixes : colonnes potentiellement manquantes
alter table public.remixes add column if not exists photo_id    text;
alter table public.remixes add column if not exists image_path  text;
alter table public.remixes add column if not exists votes_count integer not null default 0;
alter table public.remixes add column if not exists user_id     uuid references public.profiles(id) on delete cascade;
alter table public.remixes add column if not exists created_at  timestamptz not null default now();

-- tableaux : colonnes potentiellement manquantes
alter table public.tableaux add column if not exists title       text;
alter table public.tableaux add column if not exists description text;
alter table public.tableaux add column if not exists artist      text;
alter table public.tableaux add column if not exists main_image  text;
alter table public.tableaux add column if not exists thumbnail   text;
alter table public.tableaux add column if not exists price_eur   numeric(10,2);
alter table public.tableaux add column if not exists price_btc   numeric(18,8);
alter table public.tableaux add column if not exists available   boolean not null default true;
alter table public.tableaux add column if not exists created_at  timestamptz not null default now();
alter table public.tableaux add column if not exists created_by  uuid references public.profiles(id);

-- manga_works : colonnes potentiellement manquantes
alter table public.manga_works add column if not exists kind           text not null default 'manga';
alter table public.manga_works add column if not exists language       text default 'fr';
alter table public.manga_works add column if not exists display_config jsonb;
alter table public.manga_works add column if not exists published      boolean not null default false;
alter table public.manga_works add column if not exists views_count    integer not null default 0;
alter table public.manga_works add column if not exists search_vector  tsvector;
alter table public.manga_works add column if not exists cover_url      text;
alter table public.manga_works add column if not exists description    text;
alter table public.manga_works add column if not exists created_by     uuid references public.profiles(id);
alter table public.manga_works add column if not exists created_at     timestamptz not null default now();

-- payments : colonnes potentiellement manquantes
alter table public.payments add column if not exists user_id      uuid references public.profiles(id);
alter table public.payments add column if not exists amount       numeric(10,2);
alter table public.payments add column if not exists currency     text;
alter table public.payments add column if not exists method       text;
alter table public.payments add column if not exists status       text not null default 'pending';
alter table public.payments add column if not exists provider_ref text;
alter table public.payments add column if not exists metadata     jsonb;
alter table public.payments add column if not exists created_at   timestamptz not null default now();

-- ══════════════════════════════════════════════════
-- 4. INDEX
-- ══════════════════════════════════════════════════

create index if not exists remixes_photo_id_idx             on public.remixes(photo_id);
create index if not exists votes_voter_id_photo_id_idx      on public.votes(voter_id, photo_id);
create index if not exists manga_pages_work_page_idx        on public.manga_pages(work_id, page_number);
create index if not exists payments_user_status_idx         on public.payments(user_id, status);
create index if not exists manga_works_kind_views_idx       on public.manga_works(kind, views_count desc);
create index if not exists wallet_tx_user_created_idx       on public.wallet_transactions(user_id, created_at desc);
create index if not exists activation_attempts_user_idx     on public.activation_attempts(user_id, attempted_at);
create index if not exists activation_attempts_ip_idx       on public.activation_attempts(ip_hash, attempted_at);

do $$ begin
  create index manga_works_search_vector_idx on public.manga_works using gin (search_vector);
exception when duplicate_object then null;
end; $$;

-- ══════════════════════════════════════════════════
-- 5. FONCTIONS HELPER (CREATE OR REPLACE)
-- ══════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_subscriber()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        subscription_tier = 'nft'
        or (
          subscription_tier = 'subscriber'
          and (subscription_expires_at is null or subscription_expires_at > now())
        )
      )
  );
$$;

create or replace function public.is_nft_holder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and subscription_tier = 'nft'
  );
$$;

create or replace function public.increment_views_count(work_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.manga_works
  set views_count = views_count + 1
  where id = work_id and published = true;
$$;

revoke execute on function public.increment_views_count(uuid) from public, anon, authenticated;

-- ══════════════════════════════════════════════════
-- 6. TRIGGER SEARCH VECTOR (manga_works)
-- ══════════════════════════════════════════════════

create or replace function public.update_manga_search_vector()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.search_vector := to_tsvector('simple',
    coalesce(new.title, '') || ' ' || coalesce(new.description, '')
  );
  return new;
end;
$$;

drop trigger if exists manga_works_search_vector on public.manga_works;
create trigger manga_works_search_vector
  before insert or update of title, description
  on public.manga_works
  for each row execute function public.update_manga_search_vector();

-- ══════════════════════════════════════════════════
-- 7. TRIGGER ANTI-ESCALADE DE PRIVILÈGES
-- ══════════════════════════════════════════════════

create or replace function public.prevent_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and (
       new.role is distinct from old.role
       or new.subscription_tier is distinct from old.subscription_tier
       or new.subscription_expires_at is distinct from old.subscription_expires_at)
  then
    raise exception 'Modification de role/abonnement réservée au service_role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_privilege_escalation on public.profiles;
create trigger profiles_no_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

-- ══════════════════════════════════════════════════
-- 8. VUE PUBLIQUE
-- ══════════════════════════════════════════════════

create or replace view public.public_profiles
  with (security_invoker = false) as
  select id, pseudo, avatar_url from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ══════════════════════════════════════════════════
-- 9. RLS — ACTIVATION + POLICIES (idempotentes)
-- ══════════════════════════════════════════════════

alter table public.profiles              enable row level security;
alter table public.tableaux              enable row level security;
alter table public.manga_works           enable row level security;
alter table public.manga_pages           enable row level security;
alter table public.manga_display_permissions enable row level security;
alter table public.remixes               enable row level security;
alter table public.votes                 enable row level security;
alter table public.payments              enable row level security;
alter table public.reading_progress      enable row level security;
alter table public.wallets               enable row level security;
alter table public.wallet_transactions   enable row level security;
alter table public.activation_attempts   enable row level security;

-- Helper pour créer une policy sans erreur si elle existe déjà
do $$ begin
  create policy "Lecture de son profil ou admin" on public.profiles
    for select using (auth.uid() = id or public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Modification de son propre profil" on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture publique tableaux" on public.tableaux for select using (true);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Écriture admin tableaux" on public.tableaux
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture œuvres publiées" on public.manga_works
    for select using (published or public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Écriture admin manga_works" on public.manga_works
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture abonnés manga_pages" on public.manga_pages
    for select using (public.is_subscriber());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Écriture admin manga_pages" on public.manga_pages
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Gestion admin manga_display_permissions" on public.manga_display_permissions
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture remixes publique" on public.remixes for select using (true);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Création de son remix" on public.remixes
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture votes" on public.votes for select using (true);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Voter une fois" on public.votes
    for insert with check (auth.uid() = voter_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture de ses paiements" on public.payments
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture de sa reprise de lecture" on public.reading_progress
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Upsert de sa reprise de lecture" on public.reading_progress
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture de son wallet" on public.wallets
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

do $$ begin
  create policy "Lecture de ses transactions" on public.wallet_transactions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end; $$;

-- activation_attempts : aucune policy utilisateur (service_role only)

-- ══════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- ══════════════════════════════════════════════════
-- Vérifie que les profils V1 ont bien un pseudo :
-- SELECT id, pseudo FROM public.profiles WHERE pseudo IS NULL;
-- Vérifie les colonnes de la table profiles :
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
