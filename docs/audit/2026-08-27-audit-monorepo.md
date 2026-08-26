# Audit forensic — monorepo `vaisseau-mere-237`

- **Date :** 27 août 2026
- **Commit audité :** `fc7fbed` — branche `main`
- **Périmètre :** `apps/site` (vitrine statique) + `apps/vaisseaumanga237` (Next.js 16, Supabase, Stripe, NowPayments, NFT/Alchemy, Resend)
- **Méthode :** 4 divisions (Métier / Qualité / Architecture / Cybersécurité) · 16 sous-audits
- **Nature :** lecture seule — **aucun fichier de production modifié**
- **Sources d'exigences :** `apps/vaisseaumanga237/docs/userstories.md`, `docs/architecture.md`, `docs/plan-implementation.md`, `docs/changelog-nom.md`, `docs/MIGRATION.md`

---

## Résumé de l'audit

| Division | Statut | Synthèse |
| --- | --- | --- |
| Métier (Anton Ego) | 🔴 Bloquant | Pivot « accès NFT uniquement » non répercuté dans les user stories / le plan / `architecture.md`. La revalidation NFT (US 7.1 C3) n'est déclenchée par aucun planificateur : un accès payant accordé n'est jamais révoqué. |
| Qualité (Gordon Ramsay) | 🟡 Avertissement | 48 tests verts, mais `eslint` = 19 erreurs, `tsc` casse sur des artefacts dupliqués, et **aucune CI** ne les exécute. Erreurs avalées dans deux chemins de paiement, casts `as any` sur chaque appel base. |
| Architecture (Steve Jobs) | 🟡 Avertissement | Surface de paiement morte encore en ligne (`/api/payment/stripe`, `/api/subscription`, `/api/payment/crypto`). Deux systèmes d'autorisation coexistent : RLS = `is_subscriber()`, application = `is_nft_holder()`. Policies Storage décrites mais absentes des migrations. |
| Cybersécurité (Sherlock Holmes) | 🟡 Avertissement | Fondamentaux solides — `getUser()`, garde niveau 2, RLS anti-escalade, HMAC crypto, clé Alchemy jamais exposée. Failles restantes : endpoints tableau non authentifiés sans rate-limit, vérification de montant déléguée à une seule signature fragile. |

**Verdict global : 🔴 BLOQUANT** — 1 critique + 2 élevés empêchent l'acceptation en l'état. Le socle sécurité est sérieux ; les défauts sont ciblés et corrigeables.

### Totaux normalisés

| Sévérité | Nombre |
| --- | ---: |
| Critique | 1 |
| Élevé | 2 |
| Moyen | 9 |
| Faible | 13 |

---

## Index des sous-audits

| Sous-audit | Périmètre | Crit | Élevé | Moy | Faible | Verdict |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Business Logic | Modèle NFT-only vs code paiement | 1 | 1 | 1 | 0 | AUDIT_FAIL |
| Requirements Compliance | Epics 1–7 vs implémentation | 1 | 1 | 1 | 1 | AUDIT_FAIL |
| Doc-Sync | `architecture.md` · plan · `MIGRATION.md` | 0 | 1 | 2 | 2 | AUDIT_FAIL |
| A11y / UX | `apps/site` (vitrine) | 0 | 0 | 1 | 1 | AUDIT_WARN |
| Clean Code | routes API, lib, composants | 0 | 0 | 1 | 2 | AUDIT_WARN |
| Fail-Loud | chemins d'erreur silencieux | 0 | 0 | 2 | 1 | AUDIT_WARN |
| Test Quality | `tests/` (4 fichiers, 48 cas) | 0 | 0 | 2 | 0 | AUDIT_WARN |
| Mutation / Saboteur | gardes paiement & autorisation | 0 | 0 | 1 | 0 | AUDIT_WARN |
| Layer Enforcer | middleware · Server Components · RLS | 0 | 0 | 1 | 0 | AUDIT_WARN |
| YAGNI | endpoints & schéma morts | 0 | 1 | 0 | 2 | AUDIT_WARN |
| SRE / Performance | upload, revalidate, N+1 | 0 | 0 | 2 | 0 | AUDIT_WARN |
| Architecture Consistency | schéma SQL · Storage · cron | 0 | 1 | 1 | 1 | AUDIT_FAIL |
| Contextual Threat | abus paiement, spam commandes | 0 | 0 | 1 | 1 | AUDIT_WARN |
| SAST | injection, XSS, authz, secrets | 0 | 0 | 0 | 3 | AUDIT_PASS\* |
| Supply Chain / Artifact | lockfile, deps, artefacts `.next` | 0 | 0 | 1 | 2 | AUDIT_WARN |
| Privacy / Exfiltration | logs, emails, URLs externes | 0 | 0 | 0 | 1 | AUDIT_PASS |

\* *Aucune vulnérabilité d'injection confirmée dans le code lu ; RLS et policies Storage non vérifiables sans accès au projet Supabase (voir Limites).*

---

## Matrice des contrats principaux

| Exigence / contrat | Fichier(s) | Preuve | Statut |
| --- | --- | --- | --- |
| US 2.1 — Inscription + vérif. email | `auth/register/actions.ts` | `signUp({ options: { data: { pseudo } } })` | ⚠️ Config Supabase (« Confirm email ») non vérifiable |
| US 3.1 — Paiement fiat abonnement | `api/payment/stripe/route.ts` + webhook | webhook `route.ts:82-84` ignore toute session sans `tableauId` | 🔴 Marqué `[x]` fait, non fonctionnel |
| US 3.2 — Crypto abonnement + monnaie maison | `api/payment/crypto/route.ts:6-10` | renvoie `501` ; `otaku_coin` : tables `wallets` présentes, aucun code | 🔴 Non implémenté |
| US 4.1 / 4.2 — Droits d'affichage | `lib/display-guard.ts`, `permissions/route.ts:33` | cible doit être admin ; superadmin/créateur/délégué | 🟢 Conforme, testé |
| US 5.2 — Ajout catalogue admin | `api/upload/route.ts`, `admin/tableaux` | `resizeFit` → JPEG | ⚠️ Optimisation WebP annoncée, JPEG livré |
| US 5.3 — Personnalisation LLM, images intactes | `api/admin/manga/[id]/display/route.ts:65-68` | `typeof display_config === 'object'` seulement | ⚠️ Pas de gate « bloque jusqu'à validation » (C2) |
| US 5.5 — Promotion admin = superadmin seul | `api/admin/users/route.ts:71` + trigger SQL `001:237-250` | `if (role !== undefined && !isSuperAdmin(callerRole)) → 403` | 🟢 Conforme, **non testé** |
| US 7.1 C1/C2 — Accès via NFT | `api/nft/verify/route.ts`, `middleware.ts:54-61` | signature `ethers` + Alchemy + `tier='nft'` | 🟢 Conforme |
| US 7.1 C3 — Révocation sous 24 h | `api/nft/revalidate/route.ts` | aucun cron dans `vercel.json` ni `.github/workflows/` | 🔴 Non satisfait |
| Contrat — montant toujours lu en base | `nowpayments/webhook:95`, `tableau/stripe:39-65` | `expectedEur = Number(orderRow.amount_eur)` | 🟢 Conforme |
| Contrat — 1 seul système d'accès unifié | RLS `is_subscriber()` (001:286-308) vs app `isNftHolder` | policies acceptent `subscriber`, l'app non | 🔴 Deux systèmes |

---

## Top findings

### VM-C1 · Critique — La revalidation NFT n'est déclenchée par aucun planificateur

- **Preuve :** `src/app/api/nft/revalidate/route.ts` (existe, protégé par `CRON_SECRET`) · `vercel.json:3-8` (seul cron : `/api/keepalive`) · `.github/workflows/` (seul fichier : `pages-redirect.yml`).
- **Type :** Confirmé + écart documentaire — `docs/architecture.md:825` l'affirme opérationnel ; `docs/MIGRATION.md` (§ « Reste à faire ») et `docs/plan-implementation.md:120` reconnaissent l'inactivité.
- **Impact :** US 7.1 C3 exige que l'accès repasse à `free` dans les 24 h après revente / transfert du NFT. Aucun mécanisme ne l'exécute, et `CRON_SECRET` est absent de Vercel (la route renverrait `401` de toute façon). Un détenteur qui vend son NFT **conserve un accès complet indéfiniment** — manga, jeux, Club VIP. Le contrôle d'accès payant est irréversible une fois accordé.
- **Aggravation à l'échelle :** même une fois branché, le traitement est séquentiel avec un budget de 9 s (`route.ts:11`) et sans `ORDER BY` — au-delà de ~30 profils NFT, la fin de liste (non déterministe) n'est jamais revalidée.
- **Correction attendue :**
  1. La route n'exporte que `POST` ; Vercel Cron envoie un **GET** → renommer `POST` → `GET`, ajouter `export const dynamic = 'force-dynamic'`, `.trim()` sur le secret (cf. `keepalive/route.ts:25`).
  2. Ajouter `{ "path": "/api/nft/revalidate", "schedule": "0 3 * * *" }` dans `vercel.json`.
  3. Poser `CRON_SECRET` dans Vercel (`openssl rand -hex 32 | npx vercel env add CRON_SECRET production`) puis redéployer.
  4. Curseur tournant : colonne `profiles.last_revalidated_at` + `.order('last_revalidated_at', { nullsFirst: true }).limit(40)` + écriture de `last_revalidated_at = now()` sur chaque profil traité.
  5. Test dédié (401 sans bearer · révocation si `checkNftOwnership` → `false` · **pas** de révocation si Alchemy `throw`).
  6. Aligner `architecture.md:825` (GitHub Actions → Vercel Cron, POST → GET), cocher `plan-implementation.md:120`.

### VM-H1 · Élevé — Le produit a pivoté « NFT-only », le backlog et le plan disent l'inverse

- **Preuve :** `docs/plan-implementation.md:107` `- [x] Stripe Checkout abonnement + webhook → met à jour subscription_tier` (marqué **FAIT**) vs `api/payment/stripe/webhook/route.ts:82-84` (« Accès par abonnement Stripe supprimé — modèle NFT-only ») · `userstories.md` US 3.1 / 3.2 toujours actives · `api/subscription/route.ts:7` → `410` · `api/payment/crypto/route.ts:6` → `501` · `architecture.md` décrit encore le middleware avec `subscription_tier` / `subscription_expires_at`.
- **Type :** Écart documentaire corroboré (3 documents en désaccord entre eux et avec le code).
- **Impact :** Impossible, à la lecture des docs, de savoir quelles exigences sont en vigueur. Epic 3 entier (paiement fiat, crypto, monnaie maison) et le tier `subscriber` sont abandonnés sans trace formelle. Un contributeur — ou un audit — part de prémisses fausses.
- **Correction attendue :** Acter la décision « NFT-only » dans `docs/changelog-nom.md`. Marquer US 3.1 / 3.2 comme *abandonnées* ou *reportées*, corriger la case `[x]` de `plan-implementation.md:107`, aligner le middleware décrit dans `architecture.md` sur le code réel (`isNftHolder`).

### VM-H2 · Élevé — Surface de paiement morte, mais encore en ligne et capable d'encaisser

- **Preuve :** `api/payment/stripe/route.ts` crée toujours une session Checkout « abonnement 30 jours » · `route.ts:31-34` : si `STRIPE_ALLOWED_PRICE_IDS` non défini, *tout* `priceId` passe (garde `allowed.length > 0`) · `api/payment/stripe/webhook/route.ts:82-87` : session sans `tableauId` → `console.warn`, `{received:true}`, aucune écriture, **aucune alerte admin** · aucun composant n'appelle cette route (`grep api/payment` → seul `TableauCheckout.tsx` appelle `/api/payment/tableau/*`).
- **Type :** Confirmé — morte depuis l'UI, vivante comme endpoint HTTP authentifié.
- **Impact :** Un utilisateur qui POST cette route et complète le paiement Stripe **perd son argent sans contrepartie** : pas de tier, pas de ligne `payments`, pas de notification. Contraste net avec le chemin crypto `underpaid` qui, lui, marque la commande et alerte l'admin. Risque de litiges / *chargebacks* et d'atteinte à la confiance.
- **Correction attendue :** Supprimer `api/payment/stripe/route.ts`, `api/subscription/route.ts` et le stub `api/payment/crypto/route.ts`, ou les faire répondre `410 Gone` avant toute création de session. Retirer la branche « sans tableauId » du webhook.

---

## Détails par division

### Division Métier (Anton Ego)

- **Critique** `api/nft/revalidate/route.ts` : VM-C1 — revalidation inexistante.
- **Élevé** `api/payment/stripe/route.ts` : VM-H2 — encaissement sans contrepartie.
- **Élevé** `plan-implementation.md:107` : VM-H1 — pivot NFT-only non répercuté.
- **Moyen** `001_initial_schema.sql:286-308` : VM-M1 — deux systèmes d'accès (RLS `subscriber` vs app `nft`).
- **Moyen** `apps/site/script.js:51-60` : VM-M8 — le formulaire de contact n'envoie rien.
- **Faible** `apps/site/index.html`, `shop.html` : VM-L13 — pas de `meta description`, catégories shop en placeholder.

### Division Qualité (Gordon Ramsay)

- **Moyen** `.github/workflows/` : VM-M7 — aucune CI (`eslint` 19 erreurs, `tsc` cassé, 48 tests jamais armés).
- **Moyen** `api/payment/tableau/crypto/route.ts:76-85` : VM-M3 — erreur d'INSERT non vérifiée → facture orpheline.
- **Moyen** `lib/payment-validation.ts:100` + `nowpayments/webhook/route.ts:11-19` : VM-M4 — signature testée contre elle-même, complétion possible sans vérif de montant.
- **Moyen** `auth/login/actions.ts:28-33` : VM-M6 — création de profil fragile → verrouillage de compte.
- **Faible** ~20 routes admin : VM-L1 — `error.message` Postgres renvoyé brut au client.
- **Faible** `api/votes/route.ts:72-76` : VM-L7 — échec de `increment_remix_votes` seulement loggé → dérive du compteur.
- **Faible** `api/reading-progress/route.ts:3` : VM-L8 — `UUID_RE` non v4 (incohérent) ; validation avant `getUser()`.

### Division Architecture (Steve Jobs)

- **Élevé** `api/payment/stripe/route.ts`, `api/subscription/route.ts`, `api/payment/crypto/route.ts` : VM-H2 — surface morte encore en ligne.
- **Moyen** `MangaReader.tsx` / RLS : VM-M1 — frontière d'autorisation incohérente entre couches.
- **Moyen** `api/upload/route.ts:10-25` : VM-M9 — pas de plafond `width × height` (bombe de décompression jimp).
- **Faible** `package.json:25` : VM-L2 — `zod` déclaré, jamais importé.
- **Faible** `005_rate_limiting.sql` : VM-L3 — table `activation_attempts` morte (feature supprimée).
- **Faible** `012_manga_kind_artbook_enfants.sql` : VM-L4 — catégorie « livre-enfants » annoncée, contrainte n'ajoute que `'artbook'`.
- **Faible** `architecture.md:663-698` : VM-L5 — policies `storage.objects` décrites, absentes des migrations 001–012.

### Division Cybersécurité Offensive (Sherlock Holmes)

- **Moyen** `api/payment/tableau/stripe/route.ts:15-21`, `tableau/crypto/route.ts:19-25` : VM-M2 — endpoints non authentifiés, garde `origin`/`referer` falsifiable, INSERT `orders` sans rate-limit.
- **Moyen** `lib/payment-validation.ts:100` : VM-M4 — [RISQUE] sous-paiement accepté si la signature HMAC faiblit.
- **Faible** `next.config.ts:15` : VM-L10 — CSP `script-src 'self' 'unsafe-inline'`.
- **Faible** `apps/site/script.js:126,132,135` : VM-L11 — bio-modal via `innerHTML` (données dev statiques aujourd'hui).
- **Faible** `WalletConnect.tsx:40` / `nft/verify/route.ts:42-59` : VM-L12 — message signé construit par le client (pas de nonce serveur) ; anti-replay par timestamp OK.

---

## Détails par sous-audit spécialisé

### Business Logic Auditor
- **Verdict :** AUDIT_FAIL
- **Findings :** VM-C1, VM-H2, VM-M1.
- **Points conformes :** montant paiement toujours relu en base ; rejet de `partially_paid` (`payment-validation.ts:63`) ; idempotence sur `payment_ref` (`011_orders_constraints.sql`).

### Requirements Compliance Auditor
- **Verdict :** AUDIT_FAIL
- **Findings :** US 7.1 C3 non satisfaite (VM-C1) ; US 3.1 marquée `[x]` mais webhook vidé (VM-H1) ; US 3.2 non implémentée ; US 5.3 C2 (« bloque jusqu'à validation ») sans équivalent code (VM-L6).
- **Points conformes :** US 4.1 / 4.2 / 5.5 / 7.1 C1-C2 conformes (voir matrice).

### Doc-Sync Auditor
- **Verdict :** AUDIT_FAIL
- **Findings :** VM-H1 ; `architecture.md:363` documente un `CHECK` sur `orders.status` inexistant (VM-M5) ; `architecture.md` « Schéma complet » = état « 001 » alors que la réalité est 001 + 008…012 ; `architecture.md:825` revalidation présentée comme active.
- **Points conformes :** `docs/MIGRATION.md` — honnêteté remarquable, liste explicitement les écarts connus (CRON_SECRET, pas d'écran commandes, revalidation inactive).

### A11y/UX Checker
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M8 (faux envoi de formulaire) ; VM-L13 (SEO).
- **Points conformes :** `<html lang="fr">`, `alt` sur tous les `<img>`, 6 `<label>` pour 6 champs, `role="radiogroup"` / `aria-checked` dans `TableauCheckout.tsx:54-59`, `<title>` distincts, pas de scroll horizontal.

### Clean Code Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM-L1 (`error.message` brut) ; `(svc as any)` sur chaque appel base (raison documentée : types Supabase manuels, `TODO supabase gen types`).
- **Points conformes :** helpers d'autorisation purs et testables (`lib/roles.ts`, `lib/display-guard.ts:10-20`) ; `escapeHtml` centralisé (`lib/email.ts:156`).

### Fail-Loud Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M3 (INSERT non vérifié) ; VM-M6 (profil non créé) ; VM-L7 (compteur votes) ; webhook Stripe branche « sans tableauId » silencieuse (`route.ts:84`).
- **Points conformes :** `lib/alchemy.ts:13-17` — `throw` explicite si config incomplète ; `nowpayments/webhook` — alerte admin + statut `underpaid` sur refus ; `keepalive/route.ts:25` — `.trim()` documenté pour éviter le 401 silencieux.

### Test Quality Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M4 (`nowpayments-webhook.test.ts:57-63` signe avec le même algo que l'impl → valide le code contre lui-même) ; aucun test sur `middleware.ts`, `admin/users` PATCH (US 5.5), `api/upload`, `api/nft/verify`, `api/nft/revalidate`.
- **Points conformes :** `nowpayments-webhook.test.ts` exerce le **handler réel** avec dépendances mockées ; `payment-validation.test.ts` couvre le scénario d'audit (sous-paiement) et les entrées string/null.

### Mutation/Saboteur Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** supprimer `if (role !== undefined && !isSuperAdmin(callerRole))` de `admin/users/route.ts:71` ne casserait **aucun** test (US 5.5 non couverte). Vider `isNftHolder` pour `return true` casserait `roles.test.ts` mais pas de test d'intégration middleware.
- **Points conformes :** `nowpayments-webhook.test.ts` tue explicitement la mutation « suppression de la garde de refus » (`it("NE complète PAS ...")`).

### Layer Enforcer
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M1 — la frontière d'autorisation diffère entre RLS (niveau 3) et application (niveaux 1-2).
- **Points conformes :** middleware edge → Server Component (garde niveau 2, `manga/[slug]/page.tsx:49-52`) → RLS ; `createServiceClient()` isolé dans `lib/supabase/server.ts`, jamais importé côté client.

### YAGNI Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM-H2 (routes paiement mortes) ; VM-L2 (`zod`) ; VM-L3 (`activation_attempts`) ; helpers SQL `is_nft_holder()` / `is_subscriber()` qui se recouvrent depuis le pivot.
- **Points conformes :** pas d'abstraction spéculative dans les routes ; `getStripe()` / `getResend()` lazy-init justifiés (clés absentes au build).

### SRE/Performance Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M9 (bombe de décompression jimp) ; `nft/revalidate` séquentiel + budget 9 s → tail jamais revalidée (aggrave VM-C1).
- **Points conformes :** `AbortSignal.timeout(8_000)` sur Alchemy (`lib/alchemy.ts:29`), `AbortController` 10 s sur NowPayments (`tableau/crypto/route.ts:89-90`), `cache: 'no-store'` sur les appels externes, RPC atomiques `increment_*` (migrations 003, 006).

### Architecture Consistency Auditor
- **Verdict :** AUDIT_FAIL
- **Findings :** VM-L5 (policies Storage hors migrations) ; VM-M5 (`CHECK` fantôme sur `orders.status`) ; `architecture.md` schéma non aligné sur 008…012 ; cron GitHub Actions annoncé, jamais créé.
- **Points conformes :** structure des dossiers conforme à `architecture.md` (`app/(public)`, `app/(subscriber)`, `app/admin`, `app/api`) ; middleware `getUser()` conforme à la doc.

### Contextual Threat Analyst
- **Verdict :** AUDIT_WARN
- **Findings :** VM-M2 (spam de commandes `pending` / factures NowPayments / sessions Stripe) ; VM-M4 (sous-paiement si signature contournable).
- **Points conformes :** `nowpayments/webhook:87-92` — rejet si `order_id.tableau_id` ≠ commande ; `votes/route.ts:47-56` — interdit de voter pour son propre remix et vérifie la cohérence `photoId`.

### SAST Scanner
- **Verdict :** AUDIT_PASS\*
- **Findings :** VM-L6 (injection CSS via `display_config` non validé, contexte `color:`), VM-L10 (CSP `unsafe-inline`), VM-L11 (`innerHTML` site vitrine, données dev).
- **Points conformes :** aucun `dangerouslySetInnerHTML` (grep `src/`) ; `ethers.verifyMessage` + `ADDRESS_RE` + regex de message stricte (`nft/verify/route.ts:42`) ; requêtes Supabase paramétrées (`.eq()`, jamais de SQL concaténé) ; `auth/callback/route.ts:9` — garde open-redirect.
- **Limite :** RLS et policies `storage.objects` non vérifiables sans accès au projet Supabase.

### Supply Chain & Artifact Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** pas de `npm audit` en CI (VM-M7) ; `zod` mort (VM-L2) ; artefacts `.next` dupliqués (`… 2.json`, `BUILD_ID 2`) dans l'arbre — collision de synchro cloud, cassent `tsc` (VM-L9).
- **Points conformes :** `package-lock.json` présent et versionné ; `.env.local` et `.next/` correctement gitignorés (`grep` → seul `.env.example` est suivi) ; dépendances récentes et cohérentes (Next 16.2.9, React 19.2.4).

### Privacy/Exfiltration Auditor
- **Verdict :** AUDIT_PASS
- **Findings :** aucun.
- **Points conformes :** `lib/alchemy.ts:32-35` — le corps de réponse Alchemy n'est jamais repris (l'URL contient `ALCHEMY_API_KEY`) ; IP hashée SHA-256 avant insertion (`005_rate_limiting.sql:7`) ; templates email échappés (`escapeHtml`) ; `NEXT_PUBLIC_` réservé aux clés publiques (aucune clé serveur préfixée) ; `Referrer-Policy: strict-origin-when-cross-origin`.

---

## Points conformes — à préserver

- **Auth serveur :** `getUser()` (revalide le JWT) et jamais `getSession()`, aux 3 points — `middleware.ts:25`, `lib/auth.ts:10,17`.
- **Défense en profondeur :** garde niveau 2 dans `manga/[slug]/page.tsx:49-52` (re-vérif `isNftHolder` avant génération des URLs signées) ; bucket `manga` privé, URLs signées 1 h côté serveur (`lib/supabase/storage.ts`).
- **RLS :** trigger `prevent_privilege_escalation` indépendant (`001:231-250`), vue `public_profiles` en `security_invoker=false`, RPC `SECURITY DEFINER` avec `revoke execute … from public, anon, authenticated` (migrations 004, 007), `set search_path = public` systématique.
- **US 5.5 :** promotion admin réservée au superadmin — double filet applicatif (`admin/users/route.ts:71`) + trigger SQL.
- **US 4.1 / 4.2 :** `lib/display-guard.ts` + `permissions/route.ts:33` (la cible doit être admin) — correct et couvert par `display-guard.test.ts`.
- **Paiement crypto tableau :** montant toujours relu en base, rejet de `partially_paid`, idempotence sur `payment_ref`, statut `underpaid` régularisable (`pending` **et** `underpaid` acceptés en complétion), alerte admin sur sous-paiement.
- **Test du handler réel :** `nowpayments-webhook.test.ts` exerce la route avec dépendances mockées et tue la mutation « suppression de la garde de refus ».
- **En-têtes de sécurité** (`next.config.ts`) : HSTS preload, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `Permissions-Policy` restrictive.
- **Honnêteté documentaire :** `docs/MIGRATION.md` liste explicitement les écarts connus.
- **Open-redirect :** `auth/callback/route.ts:9` — `startsWith('/') && !startsWith('//')`.

---

## Limites de vérification & commandes exécutées

### Limites

- **Projet Supabase inaccessible :** impossible de confirmer que les 12 migrations sont réellement appliquées, que la RLS est active en prod, que « Confirm email » est activé (US 2.1 C1), et que les policies `storage.objects` de `architecture.md` existent (aucune migration ne les contient — VM-L5).
- **Variables d'environnement Vercel inconnues :** `STRIPE_ALLOWED_PRICE_IDS`, `CRON_SECRET`, `NFT_REQUIRED_TOKEN_ID` — état non vérifiable.
- **Webhooks** non rejouables sans secrets réels ; signature NowPayments non testée contre une fixture authentique (VM-M4).
- **Tests e2e absents** (auth, paiement, lecture, droits) — prévus `plan-implementation.md:179`.
- `npx tsc --noEmit` bloqué par des artefacts `.next` dupliqués (VM-L9) — typecheck complet non réalisé.

### Commandes exécutées

| Commande | Résultat |
| --- | --- |
| `npx vitest run` | **48/48 ✓** (4 fichiers) |
| `npx eslint .` | **19 erreurs, 7 warnings** |
| `npx tsc --noEmit` | Échec — conflit sur `.next/types/cache-life.d 2.ts` (artefacts dupliqués) |
| `git ls-files`, `git log`, lectures de fichiers | — |

Aucune commande destructrice, aucune installation de dépendance.

---

*Audit réalisé selon la skill `audit-agent` (4 divisions, 16 sous-audits). Les personas (Ego, Ramsay, Jobs, Holmes) servent la mémorisation ; chaque constat est ancré par une preuve `fichier:ligne`. Version consultable : artefact HTML publié le 27/08/2026.*
