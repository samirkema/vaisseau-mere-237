# Changelog — `vaisseau-mere-237`

Journal des changements livrés, du plus récent au plus ancien. Deux apps dans ce
dépôt : **`apps/site`** (vitrine statique) et **`apps/vaisseaumanga237`** (Next.js).

---

## Version du 27 août 2026 — « recentrage manga »

Cette version resserre les deux sites autour d'un seul objectif : **vendre des
tableaux manga et faire lire des mangas**. Tout ce qui gravitait autour
(abonnement classique, jeux, remix, club VIP, galerie de tableaux génériques,
back-office tableaux) a été retiré.

### Modèle d'accès — NFT uniquement

- L'accès aux contenus payants (`/manga`) est réservé au tier **`nft`**. Les
  parcours d'abonnement classique sont abandonnés :
  - `POST /api/subscription` → `410 Gone` (activation par code retirée) ;
  - `POST /api/payment/crypto` → `501` (stub, jamais implémenté) ;
  - le webhook Stripe acquitte sans effet toute session sans `tableauId`.
- Le tier `subscriber` n'est plus honoré par le middleware ni les Server
  Components ; il reste toléré à l'affichage dans `/compte` pour les comptes
  hérités (message « connectez votre wallet »).
- **Vérification NFT** (`POST /api/nft/verify`) : signature `ethers` + Alchemy
  côté serveur, anti-replay 5 min, liaison à `user.id`, contrainte d'unicité sur
  `wallet_address`.
- **Revalidation NFT** (`GET /api/nft/revalidate`) — *branchée dans cette
  version* (US 7.1 C3, était inactive) :
  - Vercel Cron quotidien (`apps/vaisseaumanga237/vercel.json`) ;
  - `Authorization: Bearer <CRON_SECRET>` injecté par Vercel, sinon `401`
    (fail-closed) ;
  - curseur tournant `profiles.last_revalidated_at` (migration `013`) : chaque
    profil `nft` est revu même si un run est tronqué par le budget d'exécution ;
  - wallet perdu ou absent → `subscription_tier = 'free'` ; erreur Alchemy →
    accès conservé, profil non horodaté ;
  - tests : `tests/api/nft-revalidate.test.ts`.
  - **Action de déploiement :** poser `CRON_SECRET` dans Vercel + appliquer la
    migration `013` dans Supabase.

### Paiements — durcissement (versions du 26 août, rappel)

- Webhook crypto NowPayments : rejet de `partially_paid`, contrôle du prix
  facturé et du montant crypto reçu (`lib/payment-validation.ts`), statut
  `underpaid` régularisable, e-mail d'alerte à `ADMIN_EMAIL` sur sous-paiement.
- `CRON_SECRET` est `trim()` avant comparaison (évite un keep-alive mort en
  silence).

### App manga — `apps/vaisseaumanga237`

- **« Galerie » renommée « Découvrez nos travaux »** sur toute la plateforme
  (nav, titres, métadonnées).
- La page `/galerie` est un **portfolio « à venir »** : plus de liste de
  tableaux, seulement deux cartes d'action en bas de page —
  **Boutique** (→ `vaisseau-mere-237.vercel.app/shop.html`) et
  **Lire les Mangas** (→ `/manga`). La carte « projet manga sur mesure » a été
  retirée : pas de prestation personnalisée affichée ici.
- **Accueil** ramené à 4 cartes ; sections « immersion » et « Club VIP »
  supprimées (pages, routes et liens).
- **Back-office recentré** : suppression de la gestion et des statistiques de
  **tableaux**. L'admin ne gère plus que **mangas** et **utilisateurs**
  (+ analytics). Routes retirées : `admin/tableaux/*`, `api/admin/tableaux/*`.
- **Pages abonné retirées** : `/jeux`, `/my-remix` (+ `api/remixes`, `api/votes`).
  Le middleware ne garde plus que `/manga` et `/admin`.
- Reste : lecteur manga (`/manga/[slug]`) avec garde niveau 2, URLs signées 1 h,
  reprise de lecture (`/api/reading-progress`), config d'affichage par œuvre.

### Site vitrine — `apps/site`

- **Boutique interactive** : carrousel, filtres par catégorie, **uniquement des
  tableaux manga en vente**, grille verticale 3–4 colonnes.
- **Commandes par contact direct** : numéro WhatsApp `+237 6 95 34 14 13` et
  e-mail `tfasseu@gmail.com` branchés (plus de passerelle de paiement en ligne
  sur la vitrine).
- **Section Services** : carte **Shop** (→ `shop.html`) et carte **Manga**
  (→ `vaisseaumanga237.vercel.app`, texte « vaisseaumanga237 »).
- Section Boutique : lien **« Voir plus »** vers `shop.html`, en violet
  (`--accent-2`).
- Liens de prestation pointés vers Instagram **@vaisseau_mere_237** ;
  liens Facebook et TikTok retirés.
- Fiche Samir Kemayou : « Développement Web · Manga Art & Production · France ».
- Logo agrandi/optimisé en navigation et footer.
- Nouvelle page **`shop.html`** (hero, catégories, retour au site).

### Infrastructure & déploiement

- **Monorepo** : `apps/site` + `apps/vaisseaumanga237` (intégré depuis
  `samirkema/otakushop` par merge subtree, historique préservé).
- **Vercel auto-déploiement depuis `main`** : deux projets, un Root Directory
  chacun. Un push redéploie l'app dont le dossier a changé.
- **Keep-alive Supabase** : `GET /api/keepalive` via **Vercel Cron** (remplace le
  workflow GitHub Actions ; plus aucun secret dupliqué).
- **Ancienne adresse GitHub Pages** (`samirkema.github.io/vaisseau-mere-237`) :
  conservée en **redirection** vers Vercel (`.github/pages-redirect/`,
  workflow `pages-redirect.yml`) — `404.html` reconstruit les liens profonds.

### Renommage — Otaku Shop → Vaisseau Manga 237

Voir [`apps/vaisseaumanga237/docs/changelog-nom.md`](../apps/vaisseaumanga237/docs/changelog-nom.md).
Slug `otakushop` → `vaisseaumanga237`, clés `localStorage` `otaku_*` → `vm237_*`,
message de signature NFT, titres, composants UI, e-mails. Non renommé : colonnes
Supabase (`otaku_coin_balance`), collection NFT « SWAP-SWAP », variables d'env.

### Audit

Un audit forensic complet de cette version est archivé dans
[`docs/audit/2026-08-27-audit-monorepo.md`](audit/2026-08-27-audit-monorepo.md).
Points à traiter en priorité (voir le rapport) :

- `VM-H2` — routes de paiement mortes encore en ligne (`/api/payment/stripe`,
  `/api/subscription`, `/api/payment/crypto`, `/api/payment/nowpayments/webhook`
  après le retrait des ventes de tableaux dans l'app) : à supprimer ou passer en
  `410`.
- `VM-M7` — aucune CI : `npm test` / `lint` / `build` ne tournent jamais
  automatiquement.
- Liens résiduels vers `/club-vip` dans `src/app/compte/page.tsx` (route
  supprimée) : à nettoyer.

### Actions manuelles restantes

| Action | Où |
|---|---|
| Poser `CRON_SECRET` (Production) | Vercel → projet `otakushop` → Settings → Environment Variables |
| Appliquer la migration `013_profiles_last_revalidated.sql` | Supabase → SQL Editor |
| Vérifier l'enregistrement du cron `/api/nft/revalidate` | Vercel → Settings → Cron Jobs |

---

## Versions antérieures

- **26 août 2026** — bascule en monorepo, renommage, durcissement paiements,
  keep-alive Vercel Cron, redirection GitHub Pages.
- **Avant** — voir `git log --follow -- apps/vaisseaumanga237/` (historique
  `otakushop` préservé).
