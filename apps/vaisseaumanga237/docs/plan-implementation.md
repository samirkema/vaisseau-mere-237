# Plan d'Implémentation — Vaisseau Manga 237 V2

> Plan de construction dérivé de [architecture.md](architecture.md), [apportsV2site.md](apportsV2site.md) et [userstories.md](userstories.md).
> Projet **greenfield** : `src/`, `tests/`, `assets/` sont vides. On part de zéro.

---

## 0. Principes directeurs

1. **Sécurité côté serveur d'abord.** Toute autorisation repose sur les 3 niveaux (Middleware Edge → Server Components → RLS Supabase). Aucune décision de sécurité côté client.
2. **Un seul projet, un seul déploiement.** Next.js 16 App Router + API Routes, hébergé sur Vercel.
3. **Construction par tranches verticales.** Chaque phase livre une fonctionnalité testable de bout en bout (UI + API + BDD + RLS), pas une couche horizontale.
4. **Le schéma BDD précède la feature.** On ne code pas une page sans sa table, sa policy RLS et son bucket Storage.
5. **Definition of Done par tâche :** code typé (TS strict) + policy RLS associée + test (unit ou e2e) + revue des 3 niveaux de sécurité quand la route est protégée.

---

## 1. Vue d'ensemble des phases

| Phase | Objectif | Epics / US couverts | Dépend de |
|-------|----------|---------------------|-----------|
| **P0** | Fondations & outillage | — | — |
| **P1** | BDD, Storage, Auth, Middleware | US 2.1, 2.2 | P0 |
| **P2** | Catalogue public & recherche | US 1.1 | P1 |
| **P3** | Lecteur manga/webtoon + reprise | US 1.2 | P1, P2 |
| **P4** | Paiements, abonnement & accès NFT | US 3.1, 3.2, 7.1 | P1 |
| **P5** | Back-office admin (catalogue, users, analytics) | US 5.2, 5.4 | P1, P2 |
| **P6** | Droits d'affichage & personnalisation LLM | US 4.1, 4.2, 5.3 | P5 |
| **P7** | Jeux, My Remix & mode développeur | US 6.1 | P1, P4 |
| **P8** | Durcissement sécurité, emails, tests, déploiement | transverse | toutes |

Le chemin critique est **P0 → P1**, puis **P2/P3/P4 parallélisables**, puis **P5 → P6**, **P7** en parallèle de P5/P6.

---

## 2. Détail des phases

### Phase 0 — Fondations & outillage
**Objectif :** un squelette Next.js déployable, vide mais propre.

- [ ] `create-next-app` — Next.js 16, App Router, TypeScript strict, ESLint, Tailwind.
- [ ] Reproduire l'arborescence de `architecture.md` (`app/(public)`, `app/auth`, `app/(subscriber)`, `app/admin`, `app/api`, `components/`, `lib/`).
- [ ] `lib/supabase/client.ts` (navigateur, `createBrowserClient` de `@supabase/ssr`) + `lib/supabase/server.ts` (service role, `createServerClient`, serveur seulement).
- [ ] `lib/roles.ts` (constantes rôles + helpers TS `isAdmin`, `isSubscriber` — wrappers des fonctions SQL `is_admin()` / `is_subscriber()`).
- [ ] `.env.local` + `.env.example` (toutes les variables de la section « Variables d'environnement » — **pas de `NEXTAUTH_SECRET`**, géré par Supabase).
- [ ] Prettier, husky/lint-staged, config CI minimale (lint + typecheck + build).
- [ ] Premier déploiement Vercel (page d'accueil blanche) pour valider la chaîne.

**Validation :** `pnpm build` passe, déploiement Vercel vert, aucune variable secrète exposée au client.

---

### Phase 1 — BDD, Storage, Auth, Middleware
**Objectif :** un utilisateur peut s'inscrire, vérifier son email, se connecter, réinitialiser son mot de passe ; les routes protégées le sont réellement. **→ US 2.1, 2.2.**

**Base de données**
- [ ] Migration du schéma complet d'`architecture.md` — toutes les tables intégrées : `profiles` (avec `wallet_address`, `subscription_tier` in `'free','subscriber','nft'`), `tableaux`, `manga_works` (avec `kind`, `views_count`, `search_vector`), `manga_pages`, `manga_display_permissions`, `remixes`, `votes`, `payments`, `reading_progress`, `wallets`, `wallet_transactions` + index.
- [ ] Helpers SQL `is_admin()`, `is_subscriber()` (inclut tier `'nft'`), `is_nft_holder()` (`SECURITY DEFINER`, évitent la récursion RLS).
- [ ] Trigger `handle_new_user` (pseudo de repli + unicité garantie, `set search_path = public`).
- [ ] Trigger `prevent_privilege_escalation` (bloque toute auto-modification de `role`/`subscription_tier`/`subscription_expires_at` hors `service_role`).
- [ ] Vue `public_profiles` (expose seulement `id`, `pseudo`, `avatar_url` — n'expose jamais `role`/`subscription_*` au public).
- [ ] Activation RLS + toutes les policies de l'architecture (tables + `storage.objects`).
- [ ] Buckets Storage : `tableaux` (public), `manga` (**privé**, sans policy publique), `remixes` (public), `avatars` (public) + policies `storage.objects` associées.

**Auth & sécurité**
- [ ] Pages `auth/login`, `auth/register`, `auth/reset-password`, `auth/callback` (Supabase Auth, sessions cookie httpOnly, package `@supabase/ssr`).
- [ ] Vérification email obligatoire à l'inscription (US 2.1 C1) ; lien de reset temporaire (US 2.2 C1).
- [ ] `middleware.ts` — garde global edge avec **`getUser()`** (revalide le JWT, pas `getSession()`), vérif expiration abonnement (matcher `/manga`, `/jeux`, `/my-remix`, `/admin`).
- [ ] `lib/auth.ts` — `getUser`, `getProfile`, `requireRole` (utilise `getUser()`, jamais `getSession()`).
- [ ] Page `compte/` (profil, pseudo, avatar, statut d'abonnement).
- [ ] Redirection « tunnel d'inscription obligatoire » quand un non-inscrit clique sur du contenu payant (US 2.1 C2).

**Validation :** un utilisateur non abonné est redirigé hors de `/manga` par le middleware (testé) ; un accès direct à `manga_pages` via l'API anon est bloqué par RLS (testé).

---

### Phase 2 — Catalogue public & recherche
**Objectif :** page d'accueil + galerie navigables, triées et cherchables. **→ US 1.1.**

- [ ] Accueil `(public)/page.tsx` — œuvres groupées par catégorie (Manga / Webtoon / BD via la colonne `kind`) et triées par popularité (`views_count`). (US 1.1 C1)
- [ ] Barre de recherche — recherche plein-texte Postgres (`search_vector` + `to_tsquery`) ou `ilike` en repli ; résultats instantanés. (US 1.1 C2)
- [ ] `(public)/galerie/page.tsx` + `components/galerie/TableauCard.tsx` (lecture publique des `tableaux`).
- [ ] Pages `(public)/aide`, `(public)/club-vip`.
- [ ] Composant carte œuvre + pagination/infinite scroll.
- [ ] Vérifier que `/galerie` et `/aide` sont accessibles **sans cookie de session** (visiteur non connecté) — aucun redirect vers `/auth/login` sur ces routes.

**Validation :** galerie accessible sans compte (test en navigation privée) ; tri par catégorie et popularité visible sans connexion ; recherche par mot-clé renvoie des résultats pertinents.

---

### Phase 3 — Lecteur manga/webtoon + reprise de lecture
**Objectif :** lecture fluide, format adapté, reprise là où on s'était arrêté. **→ US 1.2.**

- [ ] `(subscriber)/manga/page.tsx` (liste) + `(subscriber)/manga/[slug]/page.tsx` (lecteur).
- [ ] `components/manga/MangaReader.tsx` — **scroll vertical continu** si `kind = webtoon`, **page par page** si `kind = manga`/`bd`. (US 1.2 C1)
- [ ] URLs signées pour les pages (`lib/supabase/storage.ts → getMangaPageUrl`, expiration 1h) : contenu jamais servi à un non-abonné.
- [ ] **Reprise de lecture** : à l'ouverture, lire `reading_progress` et proposer de reprendre ; sauvegarder la position au fil du défilement (debounce). (US 1.2 C2)
- [ ] *(Décision §3)* gestion des chapitres si le découpage par chapitre est retenu.

**Validation :** un webtoon défile en vertical, un manga tourne page par page ; après déconnexion/reconnexion, le lecteur propose la bonne page.

---

### Phase 4 — Paiements, abonnement & accès NFT
**Objectif :** un utilisateur peut payer en fiat, en BTC, ou en Monnaie Maison, ou prouver la possession d'un NFT, et son accès s'ouvre. **→ US 3.1, 3.2, 7.1.**

- [x] **Stripe Checkout abonnement** + `api/payment/stripe/webhook` → met à jour `subscription_tier` + `subscription_expires_at` + log `payments`. (US 3.1 C1)
- [x] **Vente tableau par carte** — `api/payment/tableau/stripe` (price_data dynamique depuis DB, email acheteur collecté) + branche `tableauId` dans le webhook Stripe → INSERT `orders`, email admin + acheteur.
- [x] **Vente tableau en crypto** — `api/payment/tableau/crypto` (invoice NowPayments, `ipn_callback_url` automatique, commande pending avec email) + `api/payment/nowpayments/webhook` (HMAC-SHA512, UPDATE orders completed).
- [x] **Table `orders`** (migration 010) : suivi des commandes tableau (format, montant, email, ref paiement, statut pending/completed).
- [ ] **NowPayments abonnement** + webhook — logique d'activation abonnement via crypto (US 3.2, distinct de la vente tableau).
- [ ] **Code d'activation** : `api/subscription/activate` (hash **salé argon2/bcrypt** comparé côté serveur en temps constant + rate-limiting par IP et par compte).
- [ ] **Monnaie Maison (`otaku_coin`)** : `wallets` + `wallet_transactions` ; achat → débit du solde instantané + ledger transactionnel. (US 3.2 C1)
- [ ] **Vérification NFT** — `api/nft/verify` :
  - Reçoit `{ walletAddress, signature, message }` depuis le client.
  - Vérifie la signature `ethers.js` côté serveur (prouve que l'utilisateur contrôle le wallet).
  - Interroge Alchemy (`ALCHEMY_API_KEY`, jamais exposée) pour confirmer la possession du NFT.
  - Si valide → `service_role` : `profiles SET subscription_tier = 'nft', wallet_address = …`
  - Si invalide → `403`. (US 7.1 C1)
- [ ] **Revalidation NFT** — `api/nft/revalidate` (cron GitHub Actions toutes les 24h, service_role) :
  - Pour chaque profil `nft` : re-vérifie la possession via Alchemy.
  - Si wallet ne détient plus le NFT → `subscription_tier = 'free'`. (US 7.1 C3)
- [ ] Pages tarifs + état d'abonnement dans `compte/` (afficher le tier courant : free / subscriber / nft).

**Validation :** webhook Stripe simulé → `subscription_tier` passe à `subscriber` ; flux NFT simulé → tier passe à `nft` et les routes `/manga` s'ouvrent ; wallet revendu → cron rétrograde à `free` ; débit `otaku_coin` atomique (pas de solde négatif).

---

### Phase 5 — Back-office admin
**Objectif :** gérer le catalogue, les utilisateurs et l'analytique sans toucher au code. **→ US 5.2, 5.4.**

- [ ] `admin/layout.tsx` + `components/admin/Sidebar.tsx` (protégé middleware, rôle `admin`/`superadmin`).
- [x] **Tableaux** : `admin/tableaux` — CRUD + upload drag & drop + formats multiples (JSONB) + photos supplémentaires (JSONB `images`).
- [ ] **Manga** : `admin/manga` — CRUD œuvre + upload des planches (drag & drop), **optimisation serveur en WebP + génération thumbnails**, publication instantanée. (US 5.2 C1)
- [x] `api/upload/route.ts` — upload vers Supabase Storage + resize/crop via **jimp** (JPEG). Sharp retiré (binaire natif incompatible Vercel Linux x64).
- [ ] **Users** : `admin/users` — liste, changement `subscription_tier`, bannissement.
  - `PATCH /api/admin/users/[id]` : vérifie **côté serveur** que `session.profile.role === 'superadmin'` avant d'autoriser un changement de `role` vers `'admin'` ou `'superadmin'` — un admin reçoit une `403` pour cette opération.
  - La promotion admin (superadmin uniquement) et la rétrogradation sont les seules opérations sur le champ `role` autorisées via l'UI ; le trigger `prevent_privilege_escalation` constitue un second filet indépendant.
- [ ] **Analytics** : `admin/analytics` + `api/admin/analytics` — trafic, comportement, revenus, œuvres performantes. (US 5.4 C1)
- [ ] Instrumentation des `views_count` / événements pour alimenter l'analytique.

**Validation :** un admin publie un manga via le formulaire et il apparaît au catalogue ; un `user` qui force `/admin` est redirigé ; un admin qui appelle `PATCH /api/admin/users/[id]` avec `role: 'admin'` reçoit une `403` ; seul le superadmin peut promouvoir un utilisateur au rôle admin (testé via l'UI et via l'API directement).

---

### Phase 6 — Droits d'affichage & personnalisation LLM
**Objectif :** protéger l'identité artistique, déléguer entre admins, personnaliser l'UI sans jamais altérer l'œuvre. **→ US 4.1, 4.2, 5.3.**

- [ ] Application de `manga_display_permissions` : par défaut **seuls Créateur-Admin + Super Admin** éditent l'affichage ; blocage des autres aux 3 niveaux. (US 4.1 C1)
- [ ] Super Admin = tous droits d'affichage sans restriction. (US 4.1 C2)
- [ ] Partage de permission **vérifié = rôle Administrateur** avant octroi. (US 4.2 C1)
- [ ] Éditeur de `display_config` (jsonb) par œuvre (thème, typo, ambiance) — agit **uniquement** sur la config d'affichage, jamais sur les fichiers image.
- [ ] **Personnalisation assistée par LLM** (US 5.3) :
  - Le LLM ne produit **que** du `display_config` (tokens de thème/CSS), jamais une mutation d'image.
  - **Garde-fou serveur** : tout output référençant une modification des planches originales est rejeté avant application ; toute modification touchant aux visuels exige une validation explicite par un profil autorisé. (US 5.3 C1 & C2)
  - Provider recommandé : **Claude (Anthropic)**, modèles les plus récents (`claude-fable-5` / `claude-opus-4-8`), appelé côté serveur uniquement.

**Validation :** un admin non-invité ne peut pas éditer l'affichage d'une œuvre dont il n'est pas créateur ; une requête LLM qui tente de modifier une planche est bloquée et journalisée.

---

### Phase 7 — Jeux, My Remix & mode développeur
**Objectif :** module ludique + espace de création communautaire. **→ US 6.1.**

- [ ] `(subscriber)/my-remix/page.tsx` + `components/canvas/` (`DrawingCanvas`, `Toolbar`, `useCanvas` : dessin, undo, zoom).
- [ ] `api/remixes` (GET/POST) + `api/votes` — création réservée abonnés (RLS), vote unique par `photo_id`.
- [ ] `(subscriber)/jeux/page.tsx` + `admin/jeux` (gestion).
- [ ] **Mode développeur** : un compte à accès dev lance/débogue le module de jeu **sans visibilité publique**. (US 6.1 C1)

**Validation :** un abonné publie un remix qui apparaît à la galerie communautaire ; le mode test n'est pas visible du public.

---

### Phase 8 — Durcissement, emails, tests, déploiement
**Objectif :** mise en production fiable.

- [ ] Templates emails Resend (vérification, reset, reçus paiement).
- [ ] Revue de sécurité complète des 3 niveaux + audit RLS table par table.
- [ ] Tests : unitaires (helpers/`lib`), intégration (API Routes), e2e (auth, paiement, lecture, droits) → dossier `tests/`.
- [ ] Headers de sécurité, rate-limiting des routes sensibles, validation d'entrée (zod).
- [ ] CI/CD Vercel (preview par PR), GitHub Action keep-alive Supabase.
- [ ] Performance (images WebP/responsive), SEO pages publiques, accessibilité.

**Validation :** suite de tests verte en CI, audit RLS sans trou, lighthouse acceptable sur pages publiques.

---

## 3. Décisions à arbitrer

Les points D1–D4 et D8 ont été **intégrés dans `architecture.md`** et ne sont plus des écarts. Restent deux décisions **produit** ouvertes à trancher avant P4, et un choix optionnel :

| # | Sujet | Statut | Recommandation |
|---|-------|--------|----------------|
| ~~D1~~ | ~~Catégories Manga/Webtoon/BD~~ | ✅ **Résolu** — colonne `kind` dans `manga_works` | — |
| ~~D2~~ | ~~Tri popularité & recherche~~ | ✅ **Résolu** — `views_count` + `search_vector` + index | — |
| ~~D3~~ | ~~Reprise de lecture~~ | ✅ **Résolu** — table `reading_progress` | — |
| ~~D4~~ | ~~Monnaie Maison / solde~~ | ✅ **Résolu** — `wallets` + `wallet_transactions` | — |
| **D5** | **`mailenentier_admin`** (US 5.1) | ⚠️ **Décision produit requise** | Le suffixe `_admin` ne doit **jamais** être une frontière de sécurité (sécurité = rôle BDD). Au plus : aiguillage UX qui redirige vers `/admin` si le rôle est confirmé. La note d'avertissement est dans `architecture.md`. |
| ~~D6~~ | ~~Achat à la carte vs abonnement~~ | ✅ **Résolu** — abonnement pour le manga, achat unitaire pour les tableaux. Table `orders` créée (migration 010). | — |
| D7 | **Découpage en chapitres** (US 1.2) | 🔵 Optionnel | Ajouter `chapter_number` sur `manga_pages` si le découpage par chapitre est voulu ; `reading_progress` suivrait alors le chapitre. |
| ~~D8~~ | ~~Intégration LLM~~ | ✅ **Résolu** — Claude côté serveur, sortie `display_config` uniquement, garde-fou documenté en P6 | — |

---

## 5. Traçabilité User Stories → Phases

| User Story | Critères | Phase | 
|-----------|----------|-------|
| 1.1 Catalogue & découverte | C1 tri catégorie/popularité, C2 recherche | P2 |
| 1.2 Lecteur interactif | C1 scroll/page, C2 reprise lecture | P3 |
| 2.1 Inscription & vérification | C1 email de vérif, C2 tunnel obligatoire | P1 |
| 2.2 Récupération de compte | C1 reset sécurisé | P1 |
| 3.1 Paiement fiat (Stripe) | C1 checkout devise locale | P4 |
| 3.2 Paiement Web3 / crypto | C1 débit solde instantané | P4 |
| 4.1 Hiérarchie droits d'affichage | C1 blocage non-autorisés, C2 superadmin total | P6 |
| 4.2 Partage permissions (admins) | C1 vérif rôle admin | P6 |
| 5.1 Connexion admin sécurisée | C1 format admin | P1 (sécurité) + arbitrage D5 |
| 5.2 Gestion rapide catalogue | C1 drag & drop, publication | P5 |
| 5.3 Personnalisation UI par LLM | C1 image protégée, C2 blocage sans validation | P6 |
| 5.4 Analytique | C1 stats détaillées | P5 |
| 5.5 Création admin réservée au superadmin | C1 promotion par superadmin, C2 blocage 403 pour admin, C3 trigger anti-auto-escalade | P5 |
| 7.1 Accès complet via NFT | C1 vérif serveur wallet+NFT, C2 accès routes protégées, C3 revalidation 24h, C4 free sans abonnement ni NFT | P4 |
| 6.1 Mode développeur (jeux) | C1 test invisible du public | P7 |

---

## 6. Risques & points de vigilance

- **Sécurité du contenu manga** : la garantie « le contenu ne quitte jamais le serveur » repose sur 4 couches simultanées — middleware `getUser()` + Server Component + RLS `is_subscriber()` + bucket `manga` privé + URLs signées. Tester **chaque couche indépendamment** (accès anon direct à l'API, accès direct au bucket, contournement middleware).
- **Escalade de privilèges `profiles`** : le trigger `prevent_privilege_escalation` bloque toute auto-modification de `role`/`subscription_tier`. À tester explicitement : un `authenticated` qui envoie `UPDATE profiles SET role = 'admin'` doit recevoir une erreur.
- **Lecture publique des profils** : la vue `public_profiles` expose uniquement `pseudo`/`avatar_url`. Vérifier que `role` et `subscription_*` ne sont jamais accessibles via l'API anon.
- **`getUser()` obligatoire dans le middleware** : ne jamais réintroduire `getSession()` pour une décision d'autorisation — `getSession()` lit le cookie sans revalider le JWT et est usurpable.
- **Atomicité du wallet** : le débit `otaku_coin` doit être une transaction PostgreSQL (pas de double dépense, contrainte `CHECK otaku_coin_balance >= 0`) — écrit côté serveur via `service_role` uniquement, jamais depuis le client.
- **Webhooks paiement** : vérifier les signatures (Stripe `whsec_`, NowPayments IPN) **avant** tout traitement ; handlers idempotents (même événement rejoué = pas de double activation).
- **Code d'activation** : hash argon2/bcrypt + rate-limiting par IP et par compte. Ne jamais exposer le hash dans les variables `NEXT_PUBLIC_*`.
- **Clé Alchemy NFT** : `ALCHEMY_API_KEY`, `NFT_CONTRACT_ADDRESS` et `NFT_REQUIRED_TOKEN_ID` sont des variables **serveur uniquement** (pas de préfixe `NEXT_PUBLIC_`). En V1, la clé Alchemy était exposée côté client — ce flux corrige exactement ce problème.
- **Garde-fou LLM (US 5.3)** : exigence produit forte — le LLM ne produit que du `display_config` ; validation serveur qui rejette tout output ciblant les fichiers image + journal d'audit des modifications.
- **D5 `mailenentier_admin`** : à trancher avant P1 pour ne pas coder une fausse frontière de sécurité (voir §3).

---

## 7. Séquencement recommandé

```
P0 ─► P1 ─┬─► P2 ─► P3
          ├─► P4 ──────────┐
          └─► P5 ─► P6      ├─► P8 (durcissement + déploiement)
                   P7 ──────┘
```

**Jalons :**
- **J1 (fin P1)** : inscription/connexion/reset fonctionnels, routes protégées non contournables.
- **J2 (fin P3)** : un abonné lit un manga et reprend sa lecture.
- **J3 (fin P4)** : monétisation opérationnelle (fiat + crypto + monnaie maison).
- **J4 (fin P6)** : back-office complet + droits d'affichage + LLM sous garde-fou.
- **J5 (fin P8)** : production durcie, testée, déployée.
```
