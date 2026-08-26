# Architecture V2 — Vaisseau Manga 237

## Stack retenu

| Couche | Technologie | Pourquoi |
|--------|-------------|----------|
| Frontend + Backend | **Next.js 16 (App Router)** | SSR réel → sécurité serveur, une seule app, un seul déploiement |
| Auth | **Supabase Auth** | Email verification + reset password natifs, sessions httpOnly cookie |
| Base de données | **Supabase PostgreSQL** | Déjà connu, RLS puissant, gratuit |
| Stockage images | **Supabase Storage** | Buckets sécurisés, URLs signées, plus de base64 en BDD |
| Hébergement | **Vercel** | Optimal pour Next.js — auto-déploiement depuis GitHub, Root Directory `apps/vaisseaumanga237` |
| Emails | **Resend** | Déjà en place, simple |
| Paiement fiat | **Stripe** | Standard, fiable, Checkout hébergé |
| Paiement crypto | **NowPayments** | BTC / ETH / autres — invoice API + IPN callback |
| Traitement image | **jimp** | Pur JavaScript, pas de binaire natif → compatible Vercel Linux x64 |

**Ce qui disparaît :** Jekyll, `nft-gate.js` (vérif NFT client-side — remplacé par `/api/nft/verify` côté serveur), `localStorage` pour l'auth, base64 images en BDD, Render (remplacé par Vercel).

---

## Pourquoi Next.js 16

### Sécurité réelle via les Server Components

En V1, la sécurité est purement client-side :
```
Page manga.html → HTML envoyé au navigateur → JS vérifie le JWT → bloque si pas abonné
```
Un utilisateur peut contourner le JS et lire le HTML.

En V2 avec Next.js Server Components :
```
Requête /manga → Middleware vérifie la session → Si non abonné : redirect avant tout rendu
                                                → Si abonné : serveur récupère les données
                                                           → HTML complet envoyé au navigateur
```
Le contenu ne quitte jamais le serveur si l'utilisateur n'est pas autorisé.

### Un seul projet, un seul déploiement

Fini la gestion de deux dépôts (GitHub Pages + Render). Next.js embarque les API Routes :
- `app/page.tsx` → page React
- `app/api/remixes/route.ts` → endpoint API (remplace Express)

Tout sur Vercel.

---

## Architecture de sécurité

### 3 niveaux de protection

```
Niveau 1 — Middleware (Edge, avant tout rendu)
  middleware.ts intercepte CHAQUE requête
  Vérifie la session Supabase depuis le cookie httpOnly
  Redirige si accès non autorisé

Niveau 2 — Server Components (Serveur, pendant le rendu)
  Le composant vérifie à nouveau le rôle/abonnement
  Ne rend pas le contenu si condition non remplie

Niveau 3 — RLS Supabase (Base de données)
  Même si quelqu'un accède directement à Supabase
  Les policies bloquent la lecture des données non autorisées
```

### Middleware — le gardien principal

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = {
  subscriber: ['/manga', '/jeux', '/my-remix'],
  admin:      ['/admin'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)),
      },
    },
  );

  // getUser() revalide le JWT auprès du serveur Auth à CHAQUE requête.
  // Ne JAMAIS utiliser getSession() pour une décision d'autorisation côté serveur :
  // getSession() lit le cookie sans revalider le token → usurpable.
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const needsSubscriber = PROTECTED_ROUTES.subscriber.some(r => path.startsWith(r));
  const needsAdmin = path.startsWith('/admin');

  if ((needsSubscriber || needsAdmin) && !user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (needsSubscriber || needsAdmin) {
    // Rôle et abonnement lus en BDD (sous RLS), jamais depuis un cookie modifiable.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_tier, subscription_expires_at')
      .eq('id', user!.id)
      .single();

    if (needsAdmin && !['admin', 'superadmin'].includes(profile?.role ?? '')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (needsSubscriber && !needsAdmin) {
      // 'nft' : accès permanent (revalidé côté serveur par cron, pas d'expiration en BDD)
      // 'subscriber' : accès jusqu'à subscription_expires_at
      const tier = profile?.subscription_tier;
      const active =
        tier === 'nft'
        || (tier === 'subscriber'
            && (!profile?.subscription_expires_at
                || new Date(profile.subscription_expires_at) > new Date()));
      if (!active) return NextResponse.redirect(new URL('/compte', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/manga/:path*', '/jeux/:path*', '/my-remix/:path*', '/admin/:path*'],
};
```

### Session via cookie httpOnly

```
V1 : JWT dans localStorage → accessible par JS → risque XSS
V2 : Session Supabase dans cookie httpOnly → inaccessible par JS → sécurisé
```

---

## Structure des dossiers

```
otakushop-v2/
│
├── src/
│   ├── app/                          # Pages Next.js (App Router)
│   │   │
│   │   ├── (public)/                 # Groupe : pages sans auth requise
│   │   │   ├── page.tsx              # Accueil
│   │   │   ├── galerie/
│   │   │   │   └── page.tsx
│   │   │   ├── aide/
│   │   │   │   └── page.tsx
│   │   │   └── club-vip/
│   │   │       └── page.tsx
│   │   │
│   │   ├── auth/                     # Auth (Supabase Auth UI)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── callback/route.ts     # Callback OAuth/email confirm
│   │   │
│   │   ├── compte/                   # Profil utilisateur
│   │   │   └── page.tsx
│   │   │
│   │   ├── (subscriber)/             # Groupe : pages abonné (protégées middleware)
│   │   │   ├── manga/
│   │   │   │   ├── page.tsx          # Liste des mangas
│   │   │   │   └── [slug]/page.tsx   # Lecteur manga
│   │   │   ├── jeux/
│   │   │   │   └── page.tsx
│   │   │   └── my-remix/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                    # Dashboard admin (protégé middleware)
│   │   │   ├── layout.tsx            # Layout admin avec sidebar
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── tableaux/
│   │   │   │   ├── page.tsx          # Liste + ajout tableaux
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── manga/
│   │   │   │   ├── page.tsx          # Gestion des mangas
│   │   │   │   └── [id]/page.tsx     # Éditeur d'affichage manga
│   │   │   ├── users/
│   │   │   │   └── page.tsx          # Gestion utilisateurs + rôles
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── jeux/
│   │   │       └── page.tsx          # Gestion jeux + mode dev
│   │   │
│   │   ├── api/                      # API Routes (remplace Express)
│   │   │   ├── auth/
│   │   │   │   └── [...supabase]/route.ts
│   │   │   ├── remixes/
│   │   │   │   └── route.ts          # GET, POST /api/remixes
│   │   │   ├── votes/
│   │   │   │   └── route.ts
│   │   │   ├── subscription/
│   │   │   │   └── route.ts          # PATCH /api/subscription/activate
│   │   │   ├── nft/
│   │   │   │   ├── verify/route.ts       # POST : vérifie signature + possession NFT → set tier
│   │   │   │   └── revalidate/route.ts   # POST (cron) : revalide tous les profils nft
│   │   │   ├── payment/
│   │   │   │   ├── stripe/route.ts               # Abonnement Stripe
│   │   │   │   ├── stripe/webhook/route.ts        # Webhook Stripe (abonnement + tableau)
│   │   │   │   ├── crypto/route.ts               # Abonnement NowPayments (stub)
│   │   │   │   ├── nowpayments/webhook/route.ts   # IPN NowPayments (tableaux)
│   │   │   │   ├── tableau/stripe/route.ts        # Checkout tableau par carte
│   │   │   │   └── tableau/crypto/route.ts        # Invoice NowPayments tableau
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # Upload vers Supabase Storage
│   │   │   └── admin/
│   │   │       ├── users/route.ts
│   │   │       └── analytics/route.ts
│   │   │
│   │   └── layout.tsx                # Root layout (fonts, providers)
│   │
│   ├── components/
│   │   ├── ui/                       # Composants génériques
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── canvas/                   # Éditeur My Remix
│   │   │   ├── DrawingCanvas.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── useCanvas.ts          # Hook : état dessin, undo, zoom
│   │   ├── galerie/
│   │   │   ├── TableauCard.tsx
│   │   │   ├── ImageGallery.tsx      # Visionneuse multi-photos (client)
│   │   │   └── TableauCheckout.tsx   # Sélecteur format + paiement (client)
│   │   ├── manga/
│   │   │   └── MangaReader.tsx
│   │   └── admin/
│   │       ├── Sidebar.tsx
│   │       ├── UploadForm.tsx
│   │       └── AnalyticsDashboard.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Client navigateur
│   │   │   ├── server.ts             # Client serveur (service role)
│   │   │   └── storage.ts            # Helpers upload/URL signées
│   │   ├── auth.ts                   # Helpers session, getProfile
│   │   ├── roles.ts                  # Constantes rôles + helpers
│   │   └── utils.ts
│   │
│   └── middleware.ts                 # Auth guard global (edge)
│
├── public/                           # Assets statiques
│   ├── icons/
│   └── fonts/
│
├── .env.local                        # Variables d'environnement
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Base de données V2

### Schéma complet

```sql
-- ══════════════════════════════════════
-- PROFILES (extension de Supabase Auth)
-- ══════════════════════════════════════
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  pseudo                text unique not null,
  avatar_url            text,
  role                  text not null default 'user'
                        check (role in ('user', 'admin', 'superadmin')),
  subscription_tier     text not null default 'free'
                        check (subscription_tier in ('free', 'subscriber', 'nft')),
  subscription_expires_at timestamptz,  -- NULL pour 'nft' (pas d'expiration ; revalidé par cron)
  wallet_address        text unique,    -- adresse crypto vérifiée côté serveur (NFT gate)
  created_at            timestamptz not null default now()
);

-- Créé automatiquement à l'inscription via trigger
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public          -- évite le détournement de search_path
as $$
declare
  base_pseudo  text;
  final_pseudo text;
  suffix       int := 0;
begin
  -- pseudo fourni dans les métadonnées, sinon dérivé de l'email (jamais NULL)
  base_pseudo := coalesce(
    nullif(trim(new.raw_user_meta_data->>'pseudo'), ''),
    split_part(new.email, '@', 1)
  );
  final_pseudo := base_pseudo;

  -- garantit l'unicité, sinon la contrainte casserait l'inscription
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
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  artist        text,
  main_image    text not null,   -- URL publique Supabase: {tableauId}/main.jpg
  thumbnail     text not null,   -- URL publique Supabase: {tableauId}/thumb.jpg
  price_eur     numeric(10,2),   -- prix minimum (= min des formats si formats définis)
  formats       jsonb default '[]'::jsonb,  -- [{ label: "A4", price_eur: 80 }, ...]
  images        jsonb default '[]'::jsonb,  -- URLs photos supplémentaires
  available     boolean not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id)
);

-- ══════════════════════════════════════
-- COMMANDES TABLEAUX
-- ══════════════════════════════════════
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  tableau_id     uuid references public.tableaux(id) on delete set null,
  format         text,                        -- ex : "40×50 cm"
  amount_eur     numeric(10,2) not null,
  customer_email text,                        -- saisi par l'acheteur avant paiement
  customer_name  text,                        -- fourni par Stripe Checkout
  payment_ref    text,                        -- pi_xxx (Stripe) ou nowpay-xxx
  method         text not null default 'stripe',  -- 'stripe' | 'crypto'
  status         text not null default 'completed'
                 check (status in ('pending', 'completed', 'failed')),
  created_at     timestamptz not null default now()
);

-- ══════════════════════════════════════
-- MANGAS / WEBTOONS
-- ══════════════════════════════════════
create table public.manga_works (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  cover_url       text,          -- path Supabase Storage
  kind            text not null default 'manga'
                  check (kind in ('manga', 'webtoon', 'bd')),  -- pilote le lecteur + le tri
  language        text default 'fr' check (language in ('fr', 'en', 'jp')),
  display_config  jsonb,         -- config visuelle custom par œuvre
  published       boolean not null default false,
  views_count     integer not null default 0,                 -- tri par popularité (US 1.1)
  search_vector   tsvector,                                   -- recherche plein-texte (US 1.1)
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create table public.manga_pages (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.manga_works(id) on delete cascade,
  page_number integer not null,
  image_url   text not null,     -- path Supabase Storage: manga/{work_id}/{n}.jpg
  created_at  timestamptz not null default now(),
  unique (work_id, page_number)
);

-- Permissions d'édition affichage par œuvre
create table public.manga_display_permissions (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.manga_works(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  granted_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (work_id, user_id)
);

-- ══════════════════════════════════════
-- REMIXES (jeu My Remix)
-- ══════════════════════════════════════
create table public.remixes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  photo_id    text not null,
  image_path  text not null,     -- path Supabase Storage: remixes/{user_id}/{photo_id}.jpg
  votes_count integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, photo_id)
);

create table public.votes (
  id              uuid primary key default gen_random_uuid(),
  voter_id        uuid not null references public.profiles(id) on delete cascade,
  remix_id        uuid not null references public.remixes(id) on delete cascade,
  photo_id        text not null,
  created_at      timestamptz not null default now(),
  unique (voter_id, photo_id)
);

-- ══════════════════════════════════════
-- PAIEMENTS
-- ══════════════════════════════════════
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id),
  amount          numeric(10,2) not null,
  currency        text not null,   -- 'eur', 'btc', 'otaku_coin'
  method          text not null,   -- 'stripe', 'nowpayments', 'code'
  status          text not null default 'pending'
                  check (status in ('pending', 'completed', 'failed', 'refunded')),
  provider_ref    text,            -- ID transaction Stripe ou NowPayments
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- ══════════════════════════════════════
-- REPRISE DE LECTURE (US 1.2)
-- ══════════════════════════════════════
create table public.reading_progress (
  user_id     uuid references public.profiles(id)    on delete cascade,
  work_id     uuid references public.manga_works(id) on delete cascade,
  page_number integer     not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (user_id, work_id)
);

-- ══════════════════════════════════════
-- MONNAIE MAISON — otaku_coin (US 3.2)
-- ══════════════════════════════════════
create table public.wallets (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  otaku_coin_balance numeric(18,2) not null default 0 check (otaku_coin_balance >= 0),
  updated_at         timestamptz   not null default now()
);

create table public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      numeric(18,2) not null,        -- + crédit / - débit
  reason     text not null,                 -- 'purchase' | 'topup' | 'refund' | ...
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
```

### RLS Policies

```sql
-- ── Helpers d'autorisation
-- SECURITY DEFINER → la fonction contourne la RLS, ce qui évite la récursion
-- infinie quand une policy de `profiles` doit elle-même lire `profiles`.
create function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- is_subscriber : vrai pour 'subscriber' (avec vérif expiration) ET pour 'nft' (pas d'expiration)
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

-- is_nft_holder : réservé au contenu exclusivement NFT (futur)
create function public.is_nft_holder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and subscription_tier = 'nft'
  );
$$;

-- ── Profiles : le propriétaire voit sa ligne complète, les admins voient tout.
-- La lecture publique est LIMITÉE aux champs non sensibles via la vue public_profiles
-- (ne jamais exposer role / subscription_* à tout le monde via `using (true)`).
alter table public.profiles enable row level security;

create policy "Lecture de son profil ou admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Modification de son propre profil" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Vue publique : n'expose QUE pseudo / avatar, jamais role / subscription_*.
create view public.public_profiles with (security_invoker = false) as
  select id, pseudo, avatar_url from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- La RLS ne filtre pas par colonne : ce trigger empêche un utilisateur de
-- s'auto-attribuer un rôle ou un abonnement (escalade de privilèges).
-- Le service_role (webhooks paiement, API admin) reste autorisé à les modifier.
create function public.prevent_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Seul service_role (webhooks, API admin Next.js) peut modifier role/subscription_*.
  -- Les admins ordinaires passent par PATCH /api/admin/users qui utilise le service_role
  -- après avoir vérifié les droits côté applicatif.
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

-- ── Tableaux : lecture publique, écriture admin seulement
alter table public.tableaux enable row level security;
create policy "Lecture publique" on public.tableaux for select using (true);
create policy "Écriture admin" on public.tableaux
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Œuvres manga : lecture des œuvres publiées (ou admin), écriture admin
alter table public.manga_works enable row level security;
create policy "Lecture œuvres publiées" on public.manga_works
  for select using (published or public.is_admin());
create policy "Écriture admin" on public.manga_works
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Pages manga : lecture abonnés seulement (métadonnées ; les images sont en bucket privé)
alter table public.manga_pages enable row level security;
create policy "Lecture abonnés" on public.manga_pages
  for select using (public.is_subscriber());

-- ── Permissions d'affichage : gérées par les admins uniquement
alter table public.manga_display_permissions enable row level security;
create policy "Gestion admin" on public.manga_display_permissions
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Remixes : lecture publique, création abonnés, suppression auteur
alter table public.remixes enable row level security;
create policy "Lecture publique" on public.remixes for select using (true);
create policy "Création abonnés" on public.remixes for insert
  with check (auth.uid() = user_id and public.is_subscriber());
create policy "Suppression auteur" on public.remixes for delete
  using (auth.uid() = user_id);

-- ── Votes : lecture publique, un vote par abonné, retrait de son vote
alter table public.votes enable row level security;
create policy "Lecture publique" on public.votes for select using (true);
create policy "Vote abonné" on public.votes for insert
  with check (auth.uid() = voter_id and public.is_subscriber());
create policy "Retrait de son vote" on public.votes for delete
  using (auth.uid() = voter_id);

-- ── Paiements : l'utilisateur lit les siens ; AUCUNE écriture côté client.
-- Seuls les webhooks (service_role, qui contourne la RLS) écrivent les paiements.
alter table public.payments enable row level security;
create policy "Lecture de ses paiements" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

-- ── Reprise de lecture : strictement privée au propriétaire
alter table public.reading_progress enable row level security;
create policy "Progression privée" on public.reading_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Portefeuille : lecture par le propriétaire ; débit/crédit côté serveur uniquement
-- (pas de policy insert/update → seul le service_role peut modifier le solde).
alter table public.wallets enable row level security;
create policy "Lecture de son solde" on public.wallets
  for select using (auth.uid() = user_id or public.is_admin());
alter table public.wallet_transactions enable row level security;
create policy "Lecture de ses transactions" on public.wallet_transactions
  for select using (auth.uid() = user_id or public.is_admin());
```

---

## Supabase Storage — Buckets

```
Bucket: tableaux        (public)
  {tableauId}/main.jpg          ← image principale (resize max 1200px, JPEG)
  {tableauId}/thumb.jpg         ← miniature 400×280 crop cover (JPEG)
  {tableauId}/img-{slotUUID}.jpg ← photos supplémentaires (resize max 1200px)
  covers/{workId}.jpg           ← couvertures manga (resize max 900px)

Bucket: manga           (privé — URLs signées pour abonnés seulement)
  {work_id}/{page_number:04d}.jpg

Bucket: remixes         (public)
  remixes/{user_id}/{photo_id}.webp

Bucket: avatars         (public)
  avatars/{user_id}.webp
```

**Traitement image :** toutes les images passent par **jimp** (pur JavaScript) côté serveur avant upload. Sharp a été retiré car son binaire darwin-arm64 n'est pas compatible Vercel Linux x64. Sortie JPEG universelle.

**Principe :** les images manga sont dans un bucket privé. L'API génère des URLs signées (valables 1h) uniquement pour les utilisateurs abonnés. Impossible d'accéder aux pages manga sans être abonné, même en connaissant le chemin.

```typescript
// lib/supabase/storage.ts — appelé côté SERVEUR uniquement, après vérif. de l'abonnement
export async function getMangaPageUrl(path: string): Promise<string> {
  const { data, error } = await supabaseServer.storage
    .from('manga')
    .createSignedUrl(path, 3600); // expire dans 1h

  if (error || !data) {
    throw new Error(`URL signée manga indisponible : ${error?.message ?? 'erreur inconnue'}`);
  }
  return data.signedUrl;
}
```

### Policies Storage (`storage.objects`)

Les buckets publics ne sont pas « ouverts en écriture » : il faut des policies explicites.

```sql
-- tableaux : lecture publique, écriture réservée aux admins
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

-- remixes : lecture publique, création par un abonné dans SON dossier remixes/{user_id}/…
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

-- manga : bucket PRIVÉ → aucune policy publique.
-- L'accès se fait exclusivement via URLs signées générées côté serveur (service_role).
```

---

## Système de rôles

```
superadmin
  └── peut créer / promouvoir des admins (exclusivité absolue)
  └── peut rétrograder un admin en user
  └── accès total à toutes les fonctions du back-office

admin
  └── dashboard : ajout tableaux, mangas, jeux
  └── analytics
  └── gestion utilisateurs (changer subscription_tier, bannir)
  └── peut partager permissions d'affichage d'une œuvre
  └── NE PEUT PAS créer ni promouvoir un autre admin (réservé au superadmin)
  └── NE PEUT PAS modifier son propre rôle

user (nft)
  └── tout ce que 'subscriber' a : manga, jeux, my-remix
  └── galerie, aide, compte
  └── futur contenu exclusif NFT
  └── pas d'expiration de date (revalidé par cron toutes les 24h)

user (subscriber)
  └── manga, jeux, my-remix
  └── galerie, aide, compte
  └── accès jusqu'à subscription_expires_at

user (free)
  └── galerie, aide, compte seulement

visiteur (non connecté)
  └── galerie, aide (pages publiques, aucun compte requis)
  └── redirigé vers /auth/login pour tout le reste
```

**Matrice d'accès**

| Section | non connecté | free | subscriber | nft |
|---------|-------------|------|------------|-----|
| galerie, aide | ✅ | ✅ | ✅ | ✅ |
| compte | ❌ | ✅ | ✅ | ✅ |
| manga (lecture) | ❌ | ❌ | ✅ | ✅ |
| jeux | ❌ | ❌ | ✅ | ✅ |
| my-remix | ❌ | ❌ | ✅ | ✅ |
| contenu exclusif NFT (futur) | ❌ | ❌ | ❌ | ✅ |

**Règle d'or — promotion admin :** l'API `PATCH /api/admin/users/[id]` vérifie `profile.role === 'superadmin'` **côté serveur** avant d'autoriser tout changement de `role` vers `'admin'` ou `'superadmin'`. Un admin authentifié reçoit une `403` s'il tente cette opération. Le trigger `prevent_privilege_escalation` constitue un deuxième filet indépendant.

**Connexion admin :** le format `email_admin` n'est **pas** implémenté comme un email spécial — c'est uniquement le champ `role` en BDD qui détermine l'accès. L'admin se connecte avec son email normal, le middleware vérifie `profile.role`.

> ⚠️ La User Story 5.1 décrit `mailenentier_admin` comme si le format *octroyait* l'accès. Ce serait de la **sécurité par obscurité** : le suffixe `_admin` ne doit **jamais** être la frontière d'autorisation. Au mieux il sert d'aiguillage UX vers `/admin` ; la vérification réelle reste le rôle en BDD.

---

## Gestion des paiements

### Abonnement (accès manga/jeux/remix)

```
Fiat (Stripe)
  → Stripe Checkout (Hosted, jamais les données carte dans le code)
  → Webhook POST /api/payment/stripe/webhook  ← vérifie signature whsec_
  → Met à jour subscription_tier + subscription_expires_at + table payments
  → Email de reçu (Resend) à l'abonné

Crypto (NowPayments)
  → Invoice NowPayments
  → IPN callback POST /api/payment/nowpayments/webhook  ← vérifie HMAC-SHA512
  → Même logique abonnement

Code d'activation
  → POST /api/subscription/activate { method: 'code', code: '...' }
  → Hash salé serveur, comparaison en temps constant, rate-limiting IP + compte
```

### Vente de tableau (achat unique)

```
Stripe (carte)
  → POST /api/payment/tableau/stripe { tableauId, formatIndex, customerEmail }
     ↳ Prix lu en base (jamais fourni par le client)
     ↳ price_data dynamique (pas de Price ID pré-créé)
     ↳ customer_email pré-rempli dans Checkout
  → Stripe Checkout → success /galerie/{id}?payment=success
  → Webhook /api/payment/stripe/webhook détecte metadata.tableauId
     ↳ INSERT orders (status=completed)
     ↳ Email admin (ADMIN_EMAIL) — notification de vente
     ↳ Email acheteur — confirmation + détails livraison

Crypto (NowPayments)
  → POST /api/payment/tableau/crypto { tableauId, formatIndex, customerEmail }
     ↳ INSERT orders (status=pending) avec customer_email
     ↳ Crée invoice NowPayments avec ipn_callback_url automatique
  → Acheteur paie → NowPayments envoie IPN
  → Webhook /api/payment/nowpayments/webhook
     ↳ Vérifie HMAC-SHA512 (NOWPAYMENTS_IPN_SECRET)
     ↳ UPDATE orders SET status=completed WHERE id=pendingId
     ↳ Email admin + email acheteur (si email fourni)

Sécurité communes
  → Le montant est TOUJOURS lu en base côté serveur
  → Le client envoie tableauId + formatIndex, jamais un prix
  → Dédoublonnage sur payment_ref (idempotent si IPN/webhook rejoué)
```

---

## Vérification NFT (côté serveur uniquement)

La vérification de possession NFT est **100 % serveur**. Aucune clé Alchemy ni logique blockchain n'est exposée au navigateur.

```
Flux de connexion NFT :

1. L'utilisateur connecte son wallet (MetaMask etc.) → le client signe un message avec sa clé privée
2. Client → POST /api/nft/verify { walletAddress, signature, message }
3. Serveur :
   a. Vérifie la signature (ethers.js côté serveur) → confirme que l'adresse appartient bien à l'utilisateur
   b. Interroge Alchemy (ALCHEMY_API_KEY) → vérifie que le wallet détient le NFT requis
   c. Si valide → service_role met à jour profiles SET subscription_tier = 'nft', wallet_address = …
   d. Si invalide → 403
4. Middleware lit le tier 'nft' en BDD et ouvre les routes protégées

Revalidation périodique :
  → Cron GitHub Actions toutes les 24h → POST /api/nft/revalidate (service_role)
  → Pour chaque profil nft : re-vérifie la possession du NFT via Alchemy
  → Si wallet ne détient plus le NFT → subscription_tier = 'free'
```

> **Sécurité :** la clé `ALCHEMY_API_KEY` n'est **jamais** dans une variable `NEXT_PUBLIC_*`. La V1 exposait la clé Alchemy côté client — c'est exactement ce que ce flux corrige.

---

## Variables d'environnement

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...         # clé publique (client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # clé privée (serveur uniquement — jamais NEXT_PUBLIC_)

# App
NEXT_PUBLIC_APP_URL=https://otakushop.fr     # URL de production (pour les redirections Stripe/NowPayments)

# Paiements (toutes serveur uniquement — jamais NEXT_PUBLIC_)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...

# Notifications admin
ADMIN_EMAIL=ton@email.com                    # reçoit un email à chaque vente de tableau

# Emails
RESEND_API_KEY=re_...
EMAIL_FROM=Otaku Shop <noreply@otakushop.fr>  # optionnel, défaut: noreply@otakushop.io

# Activation codes
ACTIVATION_CODE_HASH=$argon2id$v=19$...       # hash salé (argon2/bcrypt), jamais SHA-256 brut

# NFT — vérification côté serveur uniquement (jamais NEXT_PUBLIC_)
ALCHEMY_API_KEY=...
NFT_CONTRACT_ADDRESS=0x...
NFT_REQUIRED_TOKEN_ID=                        # optionnel : vide = n'importe quel token
```

**Règle absolue :** `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `RESEND_API_KEY`, `ALCHEMY_API_KEY` ne doivent **jamais** avoir le préfixe `NEXT_PUBLIC_`.

**Règle absolue :** toute variable sans `NEXT_PUBLIC_` est invisible côté navigateur.

---

## Ce qui disparaît vs V1

| V1 | V2 |
|----|-----|
| Jekyll + GitHub Pages | Next.js + Vercel |
| Express sur Render | API Routes Next.js intégrées |
| JWT custom dans localStorage | Session Supabase en cookie httpOnly |
| nft-gate.js (vérif NFT client-side, clé Alchemy exposée) | Vérification NFT **côté serveur** via `/api/nft/verify` (clé Alchemy jamais exposée) |
| Auth guard client-side contournable | Middleware serveur non contournable |
| Images base64 en BDD | Supabase Storage (fichiers réels) |
| 2 systèmes d'accès coexistants | 1 seul système unifié |
| Clé Alchemy exposée client | Vérification NFT côté serveur uniquement (si réintroduite) |
| GitHub Actions keep-alive Supabase | Toujours utile, à conserver |
