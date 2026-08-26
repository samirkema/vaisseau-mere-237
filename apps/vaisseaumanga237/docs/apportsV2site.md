# Apports Prévus pour la V2 - Spécifications Techniques et Fonctionnelles

## 🛠️ Architecture et Développement Technique
*   Refonte technique garantissant un code propre et rigoureux.
*   Mise en place d'une architecture logicielle optimale, spécifiquement pensée pour anticiper et faciliter le développement futur de l'application.

## 👑 Mode Administrateur et Gestion de Contenu
*   Conception d'un tableau de bord administrateur permettant l'ajout de tableaux et de mangas de manière rapide, fluide et optimisée, directement depuis l'interface web.
*   Intégration d'un module d'analytique (Analytics) complet, fournissant des statistiques détaillées sur le trafic, le comportement des utilisateurs, les performances des œuvres et les indicateurs clés de croissance de la plateforme.
*   Gestion hiérarchique des droits : seul le Super Admin peut créer ou promouvoir un compte au rôle "Admin". Un admin ordinaire ne peut pas accorder ce rôle, ni via l'interface ni via l'API.
*   Création d'un module de personnalisation avancée pour modifier le design et l'interface d'affichage spécifique à chaque manga, webtoon ou bande dessinée.
*   Possibilité d'intégrer un Modèle de Langage (LLM) pour assister cette personnalisation, sous couvert d'une règle absolue : interdiction stricte d'altérer l'œuvre originale ou les dessins sans une demande et une acceptation explicites.
*   Intégration d'un module de jeu incluant un environnement de test dédié (mode développeur).
*   Gestion des droits de modification de l'affichage : mise en place d'un système de partage des permissions pour modifier l'affichage visuel d'une BD ou d'une œuvre. Par défaut, seul le créateur initial détient ces droits d'édition d'affichage.
*   Connexion administrateur : l'admin se connecte avec son email normal. Le suffixe `_admin` peut servir d'aiguillage UX pour rediriger vers `/admin`, mais l'autorisation réelle repose exclusivement sur le champ `role` en base de données — jamais sur le format de l'email.

## 🔐 Expérience Utilisateur et Sécurité des Comptes
*   Déploiement d'un module de connexion utilisateur propre, fiable et sécurisé.
*   Intégration complète des protocoles de vérification des adresses e-mail et de la procédure de réinitialisation des mots de passe oubliés.
*   Mise en place d'un tunnel d'inscription systématique requérant la création d'un compte complet (e-mail et mot de passe) pour tout nouvel utilisateur.

## 💳 Écosystème Économique et Monétisation
*   Création et intégration directe d'une crypto-monnaie propriétaire (monnaie maison) au cœur de la plateforme.
*   Implémentation d'une passerelle de paiement hybride garantissant l'acceptation et la gestion fluide des transactions en crypto-monnaies (Bitcoin et monnaie propriétaire).
*   Intégration parallèle d'un système bancaire classique assurant la gestion et l'acceptation sécurisée des paiements fiduciaires en euros.