# Vaisseau Mère 237 — monorepo

Dépôt ombrelle du collectif **Vaisseau Mère 237**. Chaque division vit dans `apps/`.

| Chemin | Division | Techno | Déploiement |
|---|---|---|---|
| [`apps/site`](apps/site) | Site vitrine (label, artistes, boutique) | HTML / CSS / JS statique | Vercel — projet statique, sans build |
| [`apps/vaisseaumanga237`](apps/vaisseaumanga237) | Vaisseau Manga 237 (ex-Otaku Shop) | Next.js 16 · Supabase · Stripe · NowPayments · NFT/Alchemy · Resend | Vercel — Root Directory = `apps/vaisseaumanga237` |

> Pas de workspace npm : les deux toolchains sont indépendantes. Chaque app
> s'installe et se build depuis son propre dossier. `apps/vaisseaumanga237`
> conserve son `package-lock.json` et son `.gitignore` imbriqué.

## Développement local

```bash
# Site vitrine
cd apps/site && python3 -m http.server 8237      # http://localhost:8237

# App manga
cd apps/vaisseaumanga237
cp .env.example .env.local                        # puis renseigner les clés
npm install
npm run dev                                       # http://localhost:3000
```

## Déploiement

Voir [`docs/MIGRATION.md`](docs/MIGRATION.md) pour la checklist complète
(deux projets Vercel sur ce même dépôt, variables d'environnement, secrets
GitHub Actions).

## Historique

L'app `apps/vaisseaumanga237` a été intégrée depuis le dépôt
`github.com/samirkema/otakushop` via un merge subtree — son historique
Git est préservé :

```bash
git log --follow -- apps/vaisseaumanga237/
```
