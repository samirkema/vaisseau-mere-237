# Migration otakushop → monorepo vaisseau-mere-237

Date : 2026-08-26 — **migration et redéploiement effectués.**

## Ce qui a changé

| Avant | Après |
|---|---|
| Dépôt `samirkema/otakushop` (Next.js, déploiement manuel) | `apps/vaisseaumanga237/` dans ce dépôt |
| Dépôt `samirkema/vaisseau-mere-237` racine = site statique | `apps/site/` dans ce dépôt |
| Site vitrine sur **GitHub Pages** | Site vitrine sur **Vercel** |
| Vercel non relié à Git (`npx vercel --prod` à la main) | **Auto-déploiement depuis `main`** |
| `.github/workflows/` de l'app | remonté à la racine du dépôt |

Historique otakushop préservé (merge subtree) :
`git log --follow -- apps/vaisseaumanga237/`

---

## Déploiement — état actuel

| App | Projet Vercel | Root Directory | URL de production |
|---|---|---|---|
| `apps/site` | `vaisseau-mere-237` | `apps/site` | https://vaisseau-mere-237.vercel.app |
| `apps/vaisseaumanga237` | `otakushop` | `apps/vaisseaumanga237` | https://otakushop-vert.vercel.app |

Les deux projets sont connectés à `samirkema/vaisseau-mere-237`, branche de
production `main`. **Un push sur `main` redéploie automatiquement les deux**
(Vercel ne rebuild que l'app dont le Root Directory a changé).

> Le projet manga a été **réutilisé** plutôt que recréé : les 15 variables
> d'environnement et l'URL `otakushop-vert.vercel.app` sont conservées, donc
> les webhooks Stripe et NowPayments restent valides sans aucune modification.

### Vérifications passées après bascule

- `apps/site` : `/`, `/shop.html`, `/style.css`, `/images/*` → 200
- `apps/vaisseaumanga237` : `/`, `/galerie`, `/aide`, `/cgv` → 200 ;
  `/manga` et `/club-vip` → 307 vers `/auth/login` (middleware actif)

---

## Reste à faire — actions nécessitant tes identifiants

### 1. Secrets GitHub Actions (workflow keep-alive Supabase)

`.github/workflows/supabase-keepalive.yml` a suivi dans ce dépôt mais ses
secrets n'existent pas encore ici (`gh secret list` renvoie vide). Les valeurs
sont déjà dans Vercel — cette commande les recopie **sans jamais les afficher
ni les laisser sur le disque** (testée : `vercel env pull` fonctionne, les deux
variables sont bien présentes en production) :

```bash
cd apps/vaisseaumanga237 && T=$(mktemp) && trap 'rm -f "$T"' EXIT && npx vercel env pull "$T" --environment=production --yes >/dev/null 2>&1 && set -a && . "$T" && set +a && printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | gh secret set NEXT_PUBLIC_SUPABASE_URL --repo samirkema/vaisseau-mere-237 && printf '%s' "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo samirkema/vaisseau-mere-237 && gh secret list --repo samirkema/vaisseau-mere-237
```

Sans ces secrets, le workflow keep-alive échouera à son prochain déclenchement
(cron tous les 5 jours) et le projet Supabase risque la mise en pause après
7 jours d'inactivité.

### 2. `CRON_SECRET` absent de Vercel

`POST /api/nft/revalidate` lit `process.env.CRON_SECRET` et renvoie `401` s'il
est absent (`src/app/api/nft/revalidate/route.ts:14-18`). La revalidation NFT
(US 7.1 C3) est donc **inactive**. Écart pré-existant, sans lien avec la migration.

Pour l'activer :

```bash
openssl rand -hex 32 | tr -d '\n' | npx vercel env add CRON_SECRET production --cwd apps/vaisseaumanga237
```

…puis créer le workflow cron qui appelle la route avec ce même secret en
`Authorization: Bearer` (aucun workflow ne l'appelle aujourd'hui).

### 3. Domaines personnalisés (optionnel)

Aucun domaine custom n'est branché — les deux apps sont sur des URL `.vercel.app`.
Si tu branches un domaine sur l'app manga, il faudra alors :

- mettre à jour `NEXT_PUBLIC_APP_URL` dans Vercel ;
- mettre à jour l'URL des webhooks Stripe et NowPayments ;
- mettre à jour les liens vers l'app dans `apps/site/index.html` et
  `apps/site/shop.html` (ils pointent sur `otakushop-vert.vercel.app`).

---

## Nettoyage post-migration

- **GitHub Pages : désactivé** ✅ (`samirkema.github.io/vaisseau-mere-237` ne répond plus).
- Archiver le dépôt `samirkema/otakushop` (Settings → Archive) une fois la
  nouvelle chaîne validée dans la durée. Son historique est déjà dans ce dépôt.
- Renommer le projet Vercel `otakushop` → `vaisseaumanga237` est possible, mais
  **change l'URL de production** et donc casse les webhooks : à faire seulement
  en même temps qu'un domaine custom (voir §3).
