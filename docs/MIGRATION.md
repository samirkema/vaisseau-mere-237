# Migration otakushop → monorepo vaisseau-mere-237

Date : 2026-08-26

## Ce qui a changé

| Avant | Après |
|---|---|
| Dépôt `samirkema/otakushop` (Next.js, Vercel) | `apps/vaisseaumanga237/` dans ce dépôt |
| Dépôt `samirkema/vaisseau-mere-237` racine = site statique | `apps/site/` dans ce dépôt |
| Site vitrine sur **GitHub Pages** | Site vitrine sur **Vercel** (projet statique) |
| `.github/workflows/` de l'app | remonté à la racine du dépôt |

Historique otakushop préservé (merge subtree) :
`git log --follow -- apps/vaisseaumanga237/`

---

## Redéploiement — checklist

### 1. `apps/site` — nouveau projet Vercel (statique)

1. Vercel → **Add New Project** → importer `samirkema/vaisseau-mere-237`.
2. **Root Directory** : `apps/site`.
3. Framework Preset : **Other**. Build Command / Install Command : vides
   (déjà forcé par `apps/site/vercel.json`).
4. Deploy. Brancher le domaine principal (ex. `vaisseaumere237.com`).
5. **Désactiver GitHub Pages** (Settings → Pages → Source : None) une fois
   le domaine basculé sur Vercel.

### 2. `apps/vaisseaumanga237` — projet Vercel existant à reconfigurer

Réutiliser le projet Vercel `otakushop` (garde l'URL `otakushop-vert.vercel.app`
et les variables déjà en place) :

1. Vercel → projet `otakushop` → **Settings → Git** : connecter le dépôt
   `samirkema/vaisseau-mere-237` (branche `main`).
2. **Settings → General → Root Directory** : `apps/vaisseaumanga237`.
3. **Settings → General** : renommer le projet en `vaisseaumanga237` (optionnel).
4. Vérifier les variables d'environnement (Settings → Environment Variables) —
   voir liste ci-dessous. Mettre à jour `NEXT_PUBLIC_APP_URL` avec le domaine final.
5. Redeploy.

> Alternative : créer un nouveau projet Vercel et recopier toutes les variables.

### 3. Variables d'environnement (`apps/vaisseaumanga237`)

Source : `apps/vaisseaumanga237/.env.example`. À définir dans Vercel :

- `ADMIN_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
- `RESEND_API_KEY`
- `ACTIVATION_CODE_HASH`, `ACTIVATION_DAYS`
- `ALCHEMY_API_KEY`, `NFT_CONTRACT_ADDRESS`, `NFT_REQUIRED_TOKEN_ID`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` → **URL de prod du projet manga** (ex. `https://vaisseaumanga237.com`)

Après bascule de domaine : mettre à jour les **webhooks** Stripe et NowPayments
(URL d'endpoint) et le `success_url` / `ipn_callback_url` suivent `NEXT_PUBLIC_APP_URL`.

### 4. GitHub Actions — secrets à recréer

Le workflow `.github/workflows/supabase-keepalive.yml` a suivi dans ce dépôt.
Recréer dans **Settings → Secrets and variables → Actions** de `vaisseau-mere-237` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Liens sortants du site vitrine

`apps/site/index.html` et `apps/site/shop.html` pointent vers
`https://otakushop-vert.vercel.app`. Si le projet manga change d'URL/domaine,
mettre à jour ces deux liens.

### 6. Supabase

Inchangé — même projet Supabase, mêmes migrations (`apps/vaisseaumanga237/supabase/migrations/`).
Aucune migration DB déclenchée par ce déplacement de fichiers.

---

## Nettoyage post-migration

- Archiver le dépôt `samirkema/otakushop` (Settings → Archive) une fois la
  nouvelle chaîne validée en prod.
- Le remote local `otakushop` ajouté pendant la migration peut être retiré :
  `git remote remove otakushop`.
