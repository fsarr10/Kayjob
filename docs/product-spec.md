# KayJob MVP

KayJob est une marketplace nationale qui connecte les étudiants prestataires avec des clients au Sénégal.

## MVP

- Auth téléphone/email.
- Profil public `kayjob.sn/{pseudo}`.
- Réalisations visibles dans le profil : image, lien externe, description et contexte.
- Services fixes et missions avec devis.
- Recherche nationale : la ville ne bloque pas les missions à distance.
- Commandes avec paiement séquestré.
- Messagerie, avis, litiges et back-office.
- Référentiel catégories/compétences administrable.
- Espace client : commandes, statut, validation, avis.
- Espace prestataire : services publiés, réalisations, revenus simulés.
- Espace admin : vérifications, transactions escrow, litiges et statistiques régionales.

## Hypothèse produit

Les services numériques sont disponibles nationalement dès le jour 1. Les filtres ville/région sont surtout structurants pour les services physiques.

## État livré

La V1 actuelle est un prototype final statique avec persistance navigateur via `localStorage`. Elle permet de tester le produit sans backend : création de mission, publication de service, commande, livraison, validation, avis, litige, messagerie et ajout de réalisation.

La phase production consiste à brancher ces écrans sur Laravel, Sanctum, stockage S3, WebSockets et fournisseurs de paiement locaux.
