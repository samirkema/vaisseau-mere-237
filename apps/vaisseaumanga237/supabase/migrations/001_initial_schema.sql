-- ═══════════════════════════════════════════════════════════
-- OTAKU SHOP V2 — Schéma initial
-- À exécuter dans le SQL Editor de Supabase (une seule fois)
-- ═══════════════════════════════════════════════════════════

-- ══════════════════════════════════════
-- PROFILES (extension de Supabase Auth)
-- ══════════════════════════════════════
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  pseudo                  text unique not null,
  avatar_url              text,
  role                    text not null default 'user'
                          check (role in ('user', 'admin', 'superadmin')),
  subscription_tier       text not null default 'free'
                          check (subscription_tier in ('free', 'subscriber', 'nft')),
  subscription_expires_at timestamptz,
  wallet_address          text unique,
  created_at              timestamptz not null default now()
);

-- Crée automatiquement un profil à l'inscription
create function public.handle_new_user()
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
  values (new.id, final_pseudo);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════
-- TABLEAUX (galerie)
-- ══════════════════════════════════════
create table public.tableaux (
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

-- ══════════════════════════════════════
-- MANGAS / WEBTOONS
-- ══════════════════════════════════════
create table public.manga_works (
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

create table public.manga_pages (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.manga_works(id) on delete cascade,
  page_number integer not null,
  image_url   text not null,
  created_at  timestamptz not null default now(),
  unique (work_id, page_number)
);

create table public.manga_display_permissions (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.manga_works(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (work_id, user_id)
);

-- ══════════════════════════════════════
-- REMIXES
-- ══════════════════════════════════════
create table public.remixes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  photo_id    text not null,
  image_path  text not null,
  votes_count integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, photo_id)
);

create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  voter_id   uuid not null references public.profiles(id) on delete cascade,
  remix_id   uuid not null references public.remixes(id) on delete cascade,
  photo_id   text not null,
  created_at timestamptz not null default now(),
  unique (voter_id, photo_id)
);

-- ══════════════════════════════════════
-- PAIEMENTS
-- ══════════════════════════════════════
create table public.payments (
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

-- ══════════════════════════════════════
-- REPRISE DE LECTURE
-- ══════════════════════════════════════
create table public.reading_progress (
  user_id     uuid references public.profiles(id)    on delete cascade,
  work_id     uuid references public.manga_works(id) on delete cascade,
  page_number integer     not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (user_id, work_id)
);

-- ══════════════════════════════════════
-- MONNAIE MAISON — otaku_coin
-- ══════════════════════════════════════
create table public.wallets (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  otaku_coin_balance numeric(18,2) not null default 0 check (otaku_coin_balance >= 0),
  updated_at         timestamptz   not null default now()
);

create table public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      numeric(18,2) not null,
  reason     text not null,
  payment_id uuid references public.payments(id),
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════
-- INDEX
-- ══════════════════════════════════════
create index on public.remixes(photo_id);
create index on public.votes(voter_id, photo_id);
create index on public.manga_pages(work_id, page_number);
create index on public.payments(user_id, status);
create index on public.manga_works using gin (search_vector);
create index on public.manga_works(kind, views_count desc);
create index on public.wallet_transactions(user_id, created_at desc);

-- ══════════════════════════════════════
-- HELPERS D'AUTORISATION (SECURITY DEFINER)
-- ══════════════════════════════════════
create function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create function public.is_subscriber()
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

create function public.is_nft_holder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and subscription_tier = 'nft'
  );
$$;

-- ══════════════════════════════════════
-- VUE PUBLIQUE (n'expose jamais role/subscription_*)
-- ══════════════════════════════════════
create view public.public_profiles with (security_invoker = false) as
  select id, pseudo, avatar_url from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ══════════════════════════════════════
-- TRIGGER ANTI-ESCALADE DE PRIVILÈGES
-- ══════════════════════════════════════
create function public.prevent_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Seul service_role (webhooks, crons Next.js) peut modifier role/subscription_*.
  -- Un admin ordinaire NE peut PAS s'auto-promouvoir — il passe par l'API PATCH
  -- qui utilise le service_role. is_admin() n'est plus une exception ici.
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

create trigger profiles_no_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

-- ══════════════════════════════════════
-- RLS — ACTIVATION + POLICIES
-- ══════════════════════════════════════

-- Profiles
alter table public.profiles enable row level security;

create policy "Lecture de son profil ou admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Un utilisateur peut modifier son propre profil SAUF les colonnes sensibles.
-- role/subscription_tier/subscription_expires_at sont bloqués par le trigger
-- prevent_privilege_escalation, mais on ajoute ici une deuxième ligne de défense
-- en refusant explicitement toute tentative de les modifier côté RLS.
create policy "Modification de son propre profil" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Tableaux
alter table public.tableaux enable row level security;
create policy "Lecture publique" on public.tableaux for select using (true);
create policy "Écriture admin" on public.tableaux
  for all using (public.is_admin()) with check (public.is_admin());

-- Œuvres manga
alter table public.manga_works enable row level security;
create policy "Lecture œuvres publiées" on public.manga_works
  for select using (published or public.is_admin());
create policy "Écriture admin" on public.manga_works
  for all using (public.is_admin()) with check (public.is_admin());

-- Pages manga (lecture abonnés)
alter table public.manga_pages enable row level security;
create policy "Lecture abonnés" on public.manga_pages
  for select using (public.is_subscriber());
create policy "Écriture admin" on public.manga_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- Permissions d'affichage
alter table public.manga_display_permissions enable row level security;
create policy "Gestion admin" on public.manga_display_permissions
  for all using (public.is_admin()) with check (public.is_admin());

-- Remixes
alter table public.remixes enable row level security;
create policy "Lecture publique" on public.remixes for select using (true);
create policy "Création abonnés" on public.remixes for insert
  with check (auth.uid() = user_id and public.is_subscriber());
create policy "Suppression auteur" on public.remixes for delete
  using (auth.uid() = user_id);

-- Votes
alter table public.votes enable row level security;
create policy "Lecture publique" on public.votes for select using (true);
create policy "Vote abonné" on public.votes for insert
  with check (auth.uid() = voter_id and public.is_subscriber());
create policy "Retrait de son vote" on public.votes for delete
  using (auth.uid() = voter_id);

-- Paiements (écriture côté serveur uniquement via service_role)
alter table public.payments enable row level security;
create policy "Lecture de ses paiements" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

-- Reprise de lecture
alter table public.reading_progress enable row level security;
create policy "Progression privée" on public.reading_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Portefeuille (débit/crédit côté serveur uniquement)
alter table public.wallets enable row level security;
create policy "Lecture de son solde" on public.wallets
  for select using (auth.uid() = user_id or public.is_admin());

alter table public.wallet_transactions enable row level security;
create policy "Lecture de ses transactions" on public.wallet_transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- ══════════════════════════════════════
-- STORAGE — BUCKETS & POLICIES
-- ══════════════════════════════════════
insert into storage.buckets (id, name, public) values
  ('tableaux', 'tableaux', true),
  ('manga',    'manga',    false),
  ('remixes',  'remixes',  true),
  ('avatars',  'avatars',  true);

-- tableaux : lecture publique, écriture admin
create policy "tableaux lecture" on storage.objects
  for select using (bucket_id = 'tableaux');
create policy "tableaux écriture admin" on storage.objects
  for all using (bucket_id = 'tableaux' and public.is_admin())
  with check (bucket_id = 'tableaux' and public.is_admin());

-- avatars : lecture publique, chacun gère le sien
create policy "avatars lecture" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars gestion propriétaire" on storage.objects
  for all using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

-- remixes : lecture publique, création abonné dans son dossier
create policy "remixes lecture" on storage.objects
  for select using (bucket_id = 'remixes');
create policy "remixes création abonné" on storage.objects
  for insert with check (
    bucket_id = 'remixes'
    and public.is_subscriber()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "remixes gestion propriétaire" on storage.objects
  for update using (bucket_id = 'remixes' and owner = auth.uid());
create policy "remixes suppression propriétaire" on storage.objects
  for delete using (bucket_id = 'remixes' and owner = auth.uid());

-- manga : bucket PRIVÉ — accès exclusivement via URLs signées (service_role)
-- Aucune policy publique intentionnellement.
