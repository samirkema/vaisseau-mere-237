# Audit de suivi — monorepo `vaisseau-mere-237`

- **Date :** 16 septembre 2026
- **Commit audité :** `037ff7e` — branche `main`
- **Référence :** fait suite à [`2026-08-27-audit-monorepo.md`](2026-08-27-audit-monorepo.md)
  (commit `fc7fbed`). Ce rapport n'est **pas** un audit intégral : il couvre le
  delta entre les deux commits (`git diff --stat fc7fbed..037ff7e` → 53 fichiers,
  +1901/-3043 lignes) et revérifie l'état des findings ouverts du précédent audit.
- **Nature :** lecture seule — aucun fichier de production modifié.

---

## Résumé de l'audit

| Division | Statut | Synthèse |
| --- | --- | --- |
| Métier (Anton Ego) | 🟡 Avertissement | Le backlog (`userstories.md`) décrit toujours des Epics entiers (paiement hybride, jeux) dont le code a été **supprimé**, pas juste pivoté. `docs/CHANGELOG.md` n'a pas suivi les 3 derniers commits. |
| Qualité (Gordon Ramsay) | 🟢 OK | 54/54 tests verts. Le retrait Deku/Naruto et la fiche produit ne laissent aucune classe CSS orpheline, aucun `id` cassé, aucune référence morte. |
| Architecture (Steve Jobs) | 🔴 Bloquant | `VM-H2` du précédent audit (routes de paiement mortes/dangereuses) **toujours ouvert et non corrigé** — et son périmètre s'est élargi : deux webhooks entiers sont maintenant 100 % inatteignables. Schéma DB orphelin (7 tables) en expansion. |
| Cybersécurité (Sherlock Holmes) | 🟡 Avertissement | Élémentaire, et pourtant : le retrait des tableaux Deku/Naruto pour droits IP a nettoyé les pages mais pas les fichiers sources — les visuels restent servis publiquement, juste dépubliés. |

**Verdict : 🔴 Bloquant** — porté par un finding déjà connu (`VM-H2`, non corrigé depuis le 27 août) et non par une régression introduite par ce lot de commits, qui est lui-même propre.

### Totaux normalisés

| Sévérité | Nombre |
| --- | ---: |
| Critique | 0 |
| Élevé | 2 (1 report, 1 nouveau) |
| Moyen | 4 |
| Faible | 2 |

---

## Index des sous-audits

| Sous-audit | Périmètre | Crit | Élevé | Moy | Faible | Verdict |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Business Logic | bouton Commander, webhooks tableau | 0 | 0 | 1 | 0 | AUDIT_WARN |
| Requirements Compliance | userstories.md vs code actuel | 0 | 1 | 0 | 0 | AUDIT_FAIL |
| Doc-Sync | CHANGELOG.md, userstories.md | 0 | 0 | 1 | 0 | AUDIT_WARN |
| A11y/UX | shop.html, produit.html | 0 | 0 | 1 | 0 | AUDIT_WARN |
| Clean Code | shop-data.js, shop.js, produit.js, style.css | 0 | 0 | 0 | 0 | AUDIT_PASS |
| Fail-Loud | n/a (aucun nouveau chemin serveur) | 0 | 0 | 0 | 0 | AUDIT_PASS |
| Test Quality | tests/ (5 fichiers, 54 cas) | 0 | 0 | 0 | 0 | AUDIT_PASS |
| Layer Enforcer | suppression jeux/remix/tableaux | 0 | 0 | 0 | 0 | AUDIT_PASS |
| YAGNI | webhooks morts, schéma DB orphelin | 0 | 1 | 1 | 0 | AUDIT_FAIL |
| Architecture Consistency | routes API vs webhooks restants | 0 | 1 | 0 | 0 | AUDIT_FAIL |
| Contextual Threat | webhooks publics, endpoint stripe abonnement | 0 | 0 | 0 | 0 | AUDIT_WARN* |
| SAST | shop feature (carrousel, XSS, navigation) | 0 | 0 | 0 | 0 | AUDIT_PASS |
| Privacy/Exfiltration | visuels IP retirés mais servis | 0 | 0 | 1 | 1 | AUDIT_FAIL |

\* Pas de nouveau vecteur : les webhooks restent protégés par signature (HMAC/Stripe). Le risque est fonctionnel (argent pris sans contrepartie sur `/api/payment/stripe`), déjà noté au 27/08 — voir Top Findings.

---

## Top findings

### VM2-H1 · Élevé — `VM-H2` (27/08) toujours ouvert, périmètre élargi

- **Preuve :** `src/app/api/payment/stripe/route.ts` — `git diff fc7fbed..037ff7e` ne montre que 2 lignes changées : le endpoint qui crée une session Checkout « abonnement » sans jamais délivrer d'accès (webhook `stripe/webhook:82-84` l'acquitte sans effet) **existe toujours, identique**. `api/subscription/route.ts` (410) et `api/payment/crypto/route.ts` (501) aussi inchangés.
- **Nouveau depuis le 27/08 :** `api/payment/tableau/stripe` et `api/payment/tableau/crypto` — les **seules** routes qui pouvaient produire un `metadata.tableauId` ou un `order_id` au format `pendingId__tableauId__formatIndex` — ont été supprimées (`698433f`). Or `api/payment/stripe/webhook/route.ts` (branche `tableauId`, lignes 28-80) et `api/payment/nowpayments/webhook/route.ts` (entier, 195 lignes) attendent toujours ce format. `lib/payment-validation.ts` et les fonctions `sendTableauOrderToAdmin`/`sendTableauOrderConfirmation` (`lib/email.ts`) n'ont plus **aucun appelant vivant** en dehors de ces deux webhooks.
- **Type :** Confirmé (`grep` exhaustif — aucune autre route ne référence `tableauId`, `payment-validation`, ou les fonctions email tableau).
- **Impact :** Deux endpoints webhook publics et authentifiés par signature externe restent déployés pour un flux qui n'existe plus nulle part côté produit. Ils ne présentent pas de faille d'injection (signature vérifiée avant tout accès DB), mais consomment une surface d'attaque et une charge cognitive pour rien. Plus grave : `/api/payment/stripe` reste exploitable tel quel — un appel direct + paiement Stripe réel prend l'argent d'un client sans lui donner accès à rien.
- **Correction attendue :** Supprimer `api/payment/stripe/route.ts`, `api/payment/stripe/webhook/route.ts`, `api/payment/nowpayments/webhook/route.ts`, `api/subscription/route.ts`, `api/payment/crypto/route.ts`, `lib/payment-validation.ts`, les fonctions tableau de `lib/email.ts`, et leurs tests (`payment-validation.test.ts`, `nowpayments-webhook.test.ts`) — ou les remplacer par un unique `410 Gone` documenté si les webhooks Stripe/NowPayments existants côté prestataire ne peuvent pas être désactivés immédiatement.

### VM2-H2 · Élevé — Le backlog décrit des fonctionnalités supprimées comme des exigences actives

- **Preuve :** `docs/userstories.md` (non modifié dans ce lot) liste toujours l'Epic 3 « Écosystème Économique et Paiements Hybrides » (US 3.1 fiat, US 3.2 crypto + monnaie maison) et l'Epic 6 « Gamification et Mode Jeu ». Or : `src/app/(subscriber)/jeux/`, `my-remix/`, `src/components/canvas/*`, `api/remixes`, `api/votes`, `admin/jeux` — tous supprimés (`05819d2`, `698433f`). `api/payment/tableau/*` — supprimé. `otaku_coin`/`wallets` — jamais implémenté (déjà noté au 27/08, toujours vrai).
- **Type :** Écart documentaire corroboré — c'est la confirmation aggravée de `VM-H1` (27/08) : à l'époque le code était pivoté silencieusement, il est maintenant **supprimé** silencieusement.
- **Impact :** Le backlog produit ne reflète plus du tout le périmètre réel de l'application. Un onboarding ou un audit futur qui se fierait à `userstories.md` partirait sur des bases fausses pour deux epics entières.
- **Correction attendue :** Marquer Epic 3 et Epic 6 comme *abandonnées* dans `userstories.md`, avec un renvoi vers le commit/la raison de suppression.

### VM2-M1 · Moyen — Images des tableaux IP retirées des pages mais toujours servies publiquement

- **Preuve :** `images/shop/Gemini_Generated_Image_yepep8yepep8yepe.jpg` (271 239 octets — taille strictement identique à l'ancien `manga-deku-237.jpg`, supprimé en `037ff7e`) et `images/shop/IMG_1937 copie.JPG` (108 024 octets — identique à l'ancien `manga-naruto-alloco-237.jpg`) sont toujours présents dans `apps/site/images/shop/` et non ignorés par git. `grep` confirme : aucune page HTML ni script ne les référence.
- **Type :** Confirmé (comparaison de taille de fichier) + `[RISQUE]` sur le contenu exact (non ouvert visuellement, mais la coïncidence de taille à l'octet près sur les deux fichiers est trop précise pour être fortuite).
- **Impact :** Le but du commit `037ff7e` (« retire Deku & Naruto — droits IP ») est de cesser de publier ce contenu. Or ces fichiers restent servis à leur URL directe par Vercel — un moteur de recherche d'images, un crawler, ou quiconque connaît/devine le nom de fichier y accède toujours. Dépublier une page ne dépublie pas le fichier.
- **Correction attendue :** Supprimer les deux fichiers du dépôt (`git rm`), pas seulement leurs références.

### VM2-M2 · Moyen — Bouton « Commander » sur la carte produit n'exécute pas de commande

- **Preuve :** `apps/site/shop.js` — le gestionnaire de clic unique (`document.addEventListener('click', ...)`) traite `.view-product-btn` et `.order-product-btn` de façon identique : les deux naviguent vers `produit.html?id=...`. Le bouton porte pourtant le label « Commander » (`shop.html:134-136`).
- **Type :** Confirmé.
- **Impact :** Mineur en UX — le visiteur clique « Commander » en s'attendant à initier une commande (WhatsApp/email) et atterrit sur une fiche produit. L'intention réelle (« Commander » = « voir l'article pour commander ensuite ») n'est pas ce que dit le libellé.
- **Correction attendue :** Renommer en « Voir & commander →» ou dupliquer un vrai raccourci WhatsApp sur la carte.

### VM2-M3 · Moyen — `docs/CHANGELOG.md` non mis à jour depuis le 27 août

- **Preuve :** dernière entrée datée « 27 août 2026 » ; aucune trace des commits `c87e0f5` (fiche produit dédiée), `d54d3ea` (ajout tableau Miroir d'Eau), `037ff7e` (retrait IP Deku/Naruto).
- **Correction attendue :** Ajouter une entrée « Version du 16 septembre 2026 ».

### VM2-M4 · Moyen — Schéma DB orphelin en expansion

- **Preuve :** aucune migration (`013` = dernière, ne touche que `profiles`) n'a retiré `remixes`, `votes`, `wallets`, `wallet_transactions`, `activation_attempts`, `tableaux`, `orders`, ni les RPC `increment_remix_votes`/`increment_views_count` associées à des fonctionnalités supprimées. `tableaux`/`orders` s'ajoutent désormais à la liste (routes `admin/tableaux/*` et `payment/tableau/*` supprimées).
- **Correction attendue :** Migration de nettoyage (`DROP TABLE`) une fois confirmé qu'aucune donnée historique n'est à conserver, ou au minimum documenter le gel de ce sous-schéma.

---

## Détails par division

### Division Métier (Anton Ego)
- **Élevé** `docs/userstories.md` : VM2-H2.
- **Moyen** `shop.js` : VM2-M2 (bouton trompeur).
- **Moyen** `docs/CHANGELOG.md` : VM2-M3.
- Point conforme : la suppression jeux/remix/club-vip/tableaux a été **exécutée intégralement** côté code — aucune page, route ou lien mort trouvé (voir Layer Enforcer).

### Division Qualité (Gordon Ramsay)
- Aucun défaut confirmé sur le lot audité. 54/54 tests verts (`./node_modules/.bin/vitest run`). Toutes les classes CSS utilisées par `shop.html`/`produit.html` sont définies (`.btn-secondary`, `.product-img--contain` vérifiées). `node --check` propre sur `shop-data.js`, `shop.js`, `produit.js`.
- Observation environnementale (pas un défaut code) : le run de tests a pris 119 s sur cette machine (import 189 s) contre 0,3 s lors du run initial — variance machine, pas de régression repérée (les doublons `.next` signalés le 27/08 ont quasi disparu : 1 fichier dupliqué contre des dizaines).

### Division Architecture (Steve Jobs)
- **Élevé** `api/payment/stripe/*`, `api/payment/nowpayments/webhook` : VM2-H1.
- **Moyen** schéma DB : VM2-M4.
- Point conforme : `middleware.ts` simplifié à `/manga` + `/admin` — cohérent avec les pages restantes, aucune route fantôme dans le matcher.

### Division Cybersécurité Offensive (Sherlock Holmes)
- **Moyen** `images/shop/*` : VM2-M1 — élémentaire, et pourtant : dépublier une page ne dépublie pas le fichier qu'elle montrait.
- Point conforme : les deux webhooks morts restent protégés par vérification de signature (HMAC-SHA512 / Stripe) — aucune requête forgée ne peut les faire écrire en base malgré leur inutilité fonctionnelle.

---

## Détails par sous-audit

### Business Logic Auditor
- **Verdict :** AUDIT_WARN
- **Findings :** VM2-M2.
- **Points conformes :** le carrousel `produit.js` n'affiche flèches/points que si `images.length > 1` — conforme à la demande initiale (« s'il y en a plusieurs »). Le bloc description reste masqué tant que `description === ''` — conforme à « pour l'instant ne mets rien ».

### Requirements Compliance Auditor
- **Verdict :** AUDIT_FAIL — VM2-H2.

### Doc-Sync Auditor
- **Verdict :** AUDIT_WARN — VM2-M3. `docs/architecture.md`/`plan-implementation.md` inchangés depuis le 27/08 (déjà à jour sur le volet NFT).

### A11y/UX Checker
- **Verdict :** AUDIT_WARN — VM2-M2 (label bouton). Points conformes : carrousel navigable au clavier (← →) et au doigt (swipe), `aria-label` sur les flèches, `aria-current` sur les points, alternatives textuelles sur les images produit.

### Clean Code / Fail-Loud / Test Quality / Layer Enforcer Auditors
- **Verdict :** AUDIT_PASS pour les quatre. Rien à reprocher sur le lot audité ; suppression jeux/remix/tableaux exécutée sans reliquat (`grep` exhaustif sur `club-vip|/jeux|my-remix|admin/tableaux|TableauxAdminPanel|canvas/|api/remixes|api/votes|RemixGallery|DrawingCanvas` → zéro résultat dans `src/`).

### YAGNI Auditor
- **Verdict :** AUDIT_FAIL — VM2-H1 (webhooks + `payment-validation.ts` + fonctions email tableau, tous morts), VM2-M4 (schéma DB).

### Architecture Consistency Auditor
- **Verdict :** AUDIT_FAIL — VM2-H1 : les routes qui produisaient le contrat de données (`tableauId`, `order_id`) que les webhooks valident ont disparu ; les webhooks n'ont pas suivi.

### Contextual Threat Analyst
- **Verdict :** AUDIT_WARN — scénario : un tiers découvre `/api/payment/stripe`, crée un `priceId` Stripe arbitraire (aucune restriction `STRIPE_ALLOWED_PRICE_IDS` vérifiée dans ce lot — état inchangé depuis le 27/08), paie, ne reçoit rien. Pas de nouveau vecteur introduit par ce lot de commits.

### SAST Scanner
- **Verdict :** AUDIT_PASS. Pas de `dangerouslySetInnerHTML`/`innerHTML` non maîtrisé introduit par `produit.js` (utilise `textContent`/`createElement`). Navigation par `productId` provenant d'un `data-product-id` statique (pas d'entrée utilisateur libre).

### Supply Chain & Artifact Auditor
- **Verdict :** AUDIT_PASS. `node_modules` (264 Mo) et `.next` (16 Mo) de taille normale ; les artefacts dupliqués `… 2.json` signalés le 27/08 ont quasi disparu (1 restant contre des dizaines).

### Privacy/Exfiltration Auditor
- **Verdict :** AUDIT_FAIL — VM2-M1.

---

## Points conformes

- Suppression jeux/my-remix/club-vip/canvas/remixes/votes/admin-tableaux : **exhaustive**, zéro référence orpheline trouvée dans `src/`.
- `compte/page.tsx` : le lien résiduel vers `/club-vip` signalé au 27/08 a été nettoyé.
- Fiche produit (`produit.html`/`produit.js`) : carrousel conditionnel, clavier + tactile, toutes classes CSS définies, comportement testé en navigation réelle.
- Retrait Deku/Naruto : données, cartes et images produit supprimées proprement de `shop-data.js`/`shop.html` (seuls les fichiers sources bruts restent orphelins — VM2-M1).
- Suite de tests toujours 100 % verte (54/54) malgré -3043/+1901 lignes de refactor.
- VM-C1 (revalidation NFT, fix du 27/08) : code stable, aucune régression détectée.

---

## Limites de vérification & commandes exécutées

- Pas d'accès Supabase/Vercel : impossible de confirmer si `CRON_SECRET`/migration `013` ont bien été appliqués en production (déjà signalé le 27/08, statut inconnu).
- Contenu exact des deux images orphelines (`VM2-M1`) déduit par taille de fichier identique à l'octet, pas par inspection visuelle.
- Commandes exécutées : `git diff --stat fc7fbed..037ff7e`, `git ls-files`, `grep` exhaustifs sur les motifs de fonctionnalités supprimées, `node --check` sur les 3 scripts shop, `./node_modules/.bin/vitest run` (54/54 ✓, 119 s), `ls -la` sur les images orphelines. Aucune commande destructrice.
