# Changement de nom du projet

## Ancien nom → Nouveau nom

| Forme | Avant | Après |
|---|---|---|
| Nom complet | Otaku Shop / Otaku Shop Studio | **Vaisseau Manga 237** |
| Majuscules | OTAKU SHOP / OTAKU SHOP STUDIO | **VAISSEAU MANGA 237** |
| Slug / identifiant | `otakushop` | `vaisseaumanga237` |
| Clés localStorage | `otaku_theme`, `otaku_cookie_notice_ack` | `vm237_theme`, `vm237_cookie_notice_ack` |
| Signature NFT wallet | `"Otaku Shop — Vérification wallet…"` | `"Vaisseau Manga 237 — Vérification wallet…"` |

## Date du changement

2026-08-26

## Périmètre appliqué

- Tous les titres de pages (`<title>` / `metadata`)
- Composants UI : Navbar, Footer, CookieNotice, ThemeToggle
- Pages publiques : accueil, aide, galerie, cgv, mentions légales, politique de confidentialité
- Pages abonné : manga, jeux, my-remix, [slug]
- Pages admin et auth (login, register)
- Emails transactionnels (`src/lib/email.ts`)
- API NFT verify + WalletConnect — format du message de signature (les deux mis à jour ensemble pour rester cohérents)
- `package.json` (champ `name`)
- `docs/architecture.md` (en-tête)

## Ce qui n'a PAS été renommé

- Colonnes Supabase (`otaku_coin_balance`) — renommer une colonne DB requiert une migration SQL manuelle.
- Collection NFT sur OpenSea ("SWAP-SWAP") — nom externe, indépendant du site.
- Variables d'environnement (`EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`) — doivent être mises à jour manuellement dans Vercel et le fichier `.env.local`.

## Raisons

À détailler ultérieurement.
