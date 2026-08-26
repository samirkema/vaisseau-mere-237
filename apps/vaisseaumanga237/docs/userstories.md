# Backlog Produit & User Stories - Otaku Shop (V1 & V2)

## 📖 Epic 1 : Navigation et Expérience de Lecture (Le cœur de la plateforme)

**User Story 1.1 : Catalogue et Découverte**
*En tant qu'utilisateur, je veux parcourir un catalogue mêlant hits mondiaux et pépites indépendantes afin de découvrir de nouvelles œuvres à lire.*
*   **Critère 1 :** *Étant donné* que je suis sur la page d'accueil, *Quand* je navigue sur le site, *Alors* je vois les œuvres triées par catégories (Mangas, Webtoons, BD) et par popularité.
*   **Critère 2 :** *Étant donné* que je cherche une œuvre précise, *Quand* j'utilise la barre de recherche avec des mots-clés, *Alors* le système me retourne des résultats pertinents instantanément.

**User Story 1.2 : Lecteur Interactif**
*En tant que lecteur, je veux utiliser un lecteur fluide et adapté aux formats (scroll vertical pour webtoon, page par page pour manga) afin d'avoir une expérience de lecture optimale.*
*   **Critère 1 :** *Étant donné* que je lance un Webtoon, *Quand* je fais défiler l'écran, *Alors* la lecture se fait en scroll vertical continu sans coupure.
*   **Critère 2 :** *Étant donné* que je quitte la plateforme au milieu d'un chapitre, *Quand* je me reconnecte, *Alors* le lecteur me propose de reprendre ma lecture exactement là où je m'étais arrêté.

---

## 🔐 Epic 2 : Gestion des Comptes et Sécurité

**User Story 2.1 : Inscription et Vérification**
*En tant que nouvel arrivant, je veux créer un compte sécurisé via e-mail et mot de passe afin d'accéder à l'écosystème Otaku Shop.*
*   **Critère 1 :** *Étant donné* que je remplis le formulaire d'inscription, *Quand* je valide, *Alors* je reçois un e-mail avec un lien de vérification pour activer mon compte.
*   **Critère 2 :** *Étant donné* que je tente d'accéder aux contenus payants sans compte, *Quand* je clique sur "Lire", *Alors* le système me redirige vers le tunnel d'inscription obligatoire.

**User Story 2.2 : Récupération de compte**
*En tant qu'utilisateur ayant oublié ses identifiants, je veux pouvoir réinitialiser mon mot de passe afin de retrouver l'accès à ma bibliothèque.*
*   **Critère 1 :** *Étant donné* que je clique sur "Mot de passe oublié", *Quand* je saisis mon adresse e-mail, *Alors* je reçois un lien sécurisé et temporaire pour définir un nouveau mot de passe.

---

## 💳 Epic 3 : Écosystème Économique et Paiements Hybrides

**User Story 3.1 : Paiement Fiat (Monnaie classique via Stripe)**
*En tant qu'utilisateur classique, je veux pouvoir acheter des chapitres ou m'abonner en payant en euros (ou autre devise) par carte bancaire afin d'utiliser la plateforme simplement.*
*   **Critère 1 :** *Étant donné* que je valide mon panier, *Quand* je choisis "Paiement par carte", *Alors* la passerelle Stripe s'ouvre, accepte ma devise locale et sécurise la transaction.

**User Story 3.2 : Paiement Web3 et Crypto-monnaie**
*En tant qu'utilisateur technophile, je veux payer mes achats en Bitcoin ou avec la "Monnaie Maison" d'Otaku Shop afin de profiter de l'écosystème Web3.*
*   **Critère 1 :** *Étant donné* que je possède de la crypto sur la plateforme, *Quand* je finalise un achat, *Alors* mon solde en crypto-monnaie est débité instantanément et j'accède au contenu.

---

## 🎨 Epic 4 : Propriété Intellectuelle et Espace Créateur

**User Story 4.1 : Hiérarchie stricte des droits d'affichage**
*En tant que créateur d'une œuvre (possédant le statut d'Admin), je veux être le seul avec le Super Admin à détenir par défaut les droits de modification de l'affichage visuel de mon œuvre, afin d'en protéger l'identité artistique.*
*   **Critère 1 :** *Étant donné* qu'une œuvre est publiée, *Quand* un utilisateur standard ou un administrateur non invité tente de modifier le design de l'interface associée, *Alors* le système bloque l'action, car ce droit est strictement réservé au Créateur-Admin et au Super Admin.
*   **Critère 2 :** *Étant donné* que je suis connecté avec le rôle de Super Admin, *Quand* j'accède aux paramètres d'affichage d'une œuvre, *Alors* le système m'octroie systématiquement tous les droits de modification visuelle sans restriction.

**User Story 4.2 : Partage des permissions restreint aux Administrateurs**
*En tant que créateur (Admin), je veux pouvoir déléguer mes droits d'affichage spécifiquement à d'autres profils administrateurs afin de travailler en équipe sur le design de mon œuvre.*
*   **Critère 1 :** *Étant donné* que je suis le créateur principal, *Quand* je partage l'accès dans mes paramètres de droits, *Alors* le système vérifie que l'invité possède bien le rôle "Administrateur" avant de lui octroyer les droits de modification du design.

---

## 📑 Epic 5 : Administration, LLM et Analytique (V2)

**User Story 5.1 : Connexion Admin Sécurisée**
*En tant qu'administrateur, je veux accéder au back-office de façon sécurisée afin d'éviter les accès non autorisés.*
*   **Critère 1 :** *Étant donné* que j'ai les droits admin, *Quand* je me connecte avec mon email normal, *Alors* le système vérifie mon rôle en base de données et m'accorde l'accès au tableau de bord réservé au staff.
*   **Note d'implémentation :** Le suffixe `_admin` (ex: `nom@mail.com_admin`) peut être utilisé comme aiguillage UX pour rediriger automatiquement vers `/admin` après connexion. Il ne constitue en aucun cas une frontière de sécurité — l'autorisation repose uniquement sur le champ `role` en BDD.

**User Story 5.2 : Gestion rapide du catalogue**
*En tant qu'administrateur, je veux ajouter des mangas et des tableaux de données depuis le site web afin de mettre à jour le catalogue sans toucher au code.*
*   **Critère 1 :** *Étant donné* que je suis dans le back-office, *Quand* j'utilise le formulaire d'ajout (drag & drop des planches, titre, auteur), *Alors* l'œuvre est instantanément formatée, optimisée et publiée sur le site.

**User Story 5.3 : Personnalisation UI assistée par LLM**
*En tant qu'administrateur autorisé, je veux utiliser une IA (LLM) pour générer des interfaces de lecture personnalisées, sans altérer l'œuvre, afin d'offrir des ambiances uniques.*
*   **Critère 1 :** *Étant donné* que je demande à l'IA de modifier l'interface d'un webtoon, *Quand* la requête est générée, *Alors* le code source empêche strictement le LLM de modifier le fichier image des planches originales.
*   **Critère 2 :** *Étant donné* qu'une modification touche aux visuels, *Quand* le système la détecte, *Alors* il bloque l'application jusqu'à ce qu'une demande explicite soit validée par un profil autorisé.

**User Story 5.4 : Analytique et Suivi des Performances**
*En tant qu'administrateur, je veux consulter les statistiques d'utilisation (Analytics) afin de piloter la croissance de la plateforme.*
*   **Critère 1 :** *Étant donné* que j'ouvre l'onglet Analytics, *Quand* la page charge, *Alors* je visualise les statistiques détaillées (trafic, comportement, revenus, œuvres performantes).

**User Story 5.5 : Création de profil Admin réservée au Super Admin**
*En tant que Super Admin, je veux être le seul à pouvoir créer ou promouvoir un compte au rôle "Admin" afin qu'aucun administrateur ne puisse accorder des droits d'administration sans ma supervision directe.*
*   **Critère 1 :** *Étant donné* que je suis connecté avec le rôle Super Admin, *Quand* je promeus un utilisateur au rôle "Admin" depuis le panneau de gestion, *Alors* la promotion est enregistrée et l'utilisateur obtient les droits administrateur.
*   **Critère 2 :** *Étant donné* que je suis connecté avec le rôle Admin (pas Super Admin), *Quand* je tente de promouvoir un utilisateur au rôle "Admin" — que ce soit via l'interface ou directement via l'API —, *Alors* le système bloque l'action et retourne une erreur explicite.
*   **Critère 3 :** *Étant donné* qu'un utilisateur quelconque tente de modifier son propre champ `role` en base de données, *Quand* la requête est reçue, *Alors* le système la rejette automatiquement quel que soit le rôle de l'appelant.

---

## 💰 Epic 7 : Accès NFT

**User Story 7.1 : Accès complet via possession de NFT**
*En tant que détenteur d'un NFT Otaku Shop, je veux que la plateforme reconnaisse automatiquement ma possession afin d'obtenir un accès complet sans souscrire à un abonnement classique.*
*   **Critère 1 :** *Étant donné* que je connecte mon wallet crypto depuis mon compte, *Quand* je signe le message de vérification, *Alors* le système vérifie côté serveur que mon adresse détient bien le NFT requis et attache le tier "nft" à mon profil sans jamais exposer de clé blockchain au navigateur.
*   **Critère 2 :** *Étant donné* que mon profil est au tier "nft", *Quand* j'accède aux sections protégées (manga, jeux, my-remix), *Alors* j'y accède librement, exactement comme un abonné classique.
*   **Critère 3 :** *Étant donné* que je ne détiens plus le NFT (revente ou transfert), *Quand* le système effectue sa vérification périodique (toutes les 24h), *Alors* mon tier repasse automatiquement à "free" et mon accès aux contenus protégés est révoqué.
*   **Critère 4 :** *Étant donné* que je n'ai ni abonnement ni NFT, *Quand* je navigue sur le site, *Alors* je n'ai accès qu'à la galerie, l'aide et mon compte.

---

## 🎮 Epic 6 : Gamification et Mode Jeu (V2)

**User Story 6.1 : Mode Développeur (Jeux)**
*En tant que développeur, je veux accéder à un mode développeur pour les jeux afin de tester mes créations avant leur mise en ligne.*
*   **Critère 1 :** *Étant donné* que j'ai un accès développeur, *Quand* j'active le mode test sur le module de jeu, *Alors* je peux lancer et déboguer les éléments ludiques sans que cela ne soit visible par la communauté publique.
