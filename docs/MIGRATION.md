# Migration otakushop → monorepo vaisseau-mere-237

Date : 2026-08-26 — **migration et redéploiement effectués.**

## Ce qui a changé

| Avant | Après |
|---|---|
| Dépôt `samirkema/otakushop` (Next.js, déploiement manuel) | `apps/vaisseaumanga237/` dans ce dépôt |
| Dépôt `samirkema/vaisseau-mere-237` racine = site statique | `apps/site/` dans ce dépôt |
| Site vitrine sur **GitHub Pages** | Site vitrine sur **Vercel** ; l'ancienne adresse redirige |
| Vercel non relié à Git (`npx vercel --prod` à la main) | **Auto-déploiement depuis `main`** |
| Keep-alive Supabase par GitHub Actions (secrets dupliqués) | **Vercel Cron**, aucun secret dupliqué |

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

## Keep-alive Supabase — Vercel Cron, aucun secret à dupliquer

Supabase Free met un projet en pause après 7 jours sans requête.

**Avant :** `.github/workflows/supabase-keepalive.yml` pingait Supabase tous les
5 jours, ce qui imposait de recopier `NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_ANON_KEY` dans les secrets du dépôt — un deuxième endroit
à sécuriser pour un simple ping.

**Maintenant :** `GET /api/keepalive` (`src/app/api/keepalive/route.ts`),
déclenchée **une fois par jour** par Vercel Cron (`vercel.json`). Elle lit les
variables déjà présentes dans le projet Vercel : **aucun secret n'est dupliqué**,
et le workflow GitHub a été supprimé.

Bénéfice annexe : un ping quotidien au lieu d'un tous les 5 jours, donc bien plus
de marge avant le seuil de 7 jours.

> **Sécurité.** La route est ouverte tant que `CRON_SECRET` n'est pas défini.
> Ce n'est pas une nouvelle surface d'attaque : elle n'utilise que la clé anon,
> déjà publique par conception (`NEXT_PUBLIC_`, livrée au navigateur), et ne
> renvoie aucune donnée — n'importe qui peut déjà interroger Supabase avec cette
> clé. Le code vérifie `Authorization: Bearer <CRON_SECRET>` **dès que la
> variable existe** (Vercel Cron envoie déjà cet en-tête), donc poser le secret
> ci-dessous verrouille la route sans aucune modification de code.

> **Plan Hobby.** Les crons Vercel y sont limités à un déclenchement quotidien,
> et l'heure exacte n'est pas garantie. Sans importance pour un keep-alive.

---

## Reste à faire — actions nécessitant tes identifiants

### 1. `CRON_SECRET` absent de Vercel

`POST /api/nft/revalidate` lit `process.env.CRON_SECRET` et renvoie `401` s'il
est absent (`src/app/api/nft/revalidate/route.ts:14-18`). La revalidation NFT
(US 7.1 C3) est donc **inactive**. Écart pré-existant, sans lien avec la migration.

Pour l'activer :

```bash
openssl rand -hex 32 | tr -d '\n' | npx vercel env add CRON_SECRET production --cwd apps/vaisseaumanga237
```

…puis créer le cron qui appelle la route avec ce même secret en
`Authorization: Bearer` (rien ne l'appelle aujourd'hui).

Poser cette variable **verrouille aussi `/api/keepalive`** automatiquement,
sans changement de code (voir la note de sécurité plus haut).

### 2. Domaines personnalisés (optionnel)

Aucun domaine custom n'est branché — les deux apps sont sur des URL `.vercel.app`.
Si tu branches un domaine sur l'app manga, il faudra alors :

- mettre à jour `NEXT_PUBLIC_APP_URL` dans Vercel ;
- mettre à jour l'URL des webhooks Stripe et NowPayments ;
- mettre à jour les liens vers l'app dans `apps/site/index.html` et
  `apps/site/shop.html` (ils pointent sur `otakushop-vert.vercel.app`).

---

## Nettoyage post-migration

- **GitHub Pages : conservé en redirection** ✅ — `samirkema.github.io/vaisseau-mere-237`
  ne sert plus le site mais une page qui renvoie vers Vercel, pour ne pas casser
  les liens déjà diffusés. Publié par `.github/workflows/pages-redirect.yml`
  depuis `.github/pages-redirect/`, indépendamment de `apps/site`.

  `404.html` étant identique à `index.html`, GitHub Pages le sert pour toute URL
  inconnue et le script y reconstruit le chemin : `/vaisseau-mere-237/shop.html`
  arrive bien sur `/shop.html`. Vérifié en navigateur sur les deux cas.

  Limite : GitHub Pages est un hébergeur statique, il ne sait pas émettre de
  vrai `301`. La redirection est faite en JavaScript (repli `<meta refresh>`
  vers l'accueil sans JS), et les liens profonds répondent `404` avant de
  rediriger. C'est transparent pour un visiteur, mais ce n'est pas une
  redirection permanente au sens SEO. Un domaine personnalisé sur Vercel (§3)
  est la seule vraie solution durable.
- Archiver le dépôt `samirkema/otakushop` (Settings → Archive) une fois la
  nouvelle chaîne validée dans la durée. Son historique est déjà dans ce dépôt.
- Renommer le projet Vercel `otakushop` → `vaisseaumanga237` est possible, mais
  **change l'URL de production** et donc casse les webhooks : à faire seulement
  en même temps qu'un domaine custom (voir §3).
