# Architecture KayJob

- Backend cible : Laravel + Sanctum, PostgreSQL, Redis.
- Web : site public et dashboard en React/Next.js à industrialiser depuis ce prototype.
- Mobile : Expo 54 + Expo Router.
- Temps réel : WebSockets/Soketi.
- Fichiers : stockage S3-compatible.
- Paiements : interface `PaymentProvider` pour Wave, Orange Money, Free Money et carte.

Le prototype actuel est statique pour valider le produit avant l'industrialisation backend.

## Passage production

1. Créer l'API Laravel avec les tables du schéma SQL.
2. Remplacer `localStorage` par des endpoints REST authentifiés.
3. Stocker les réalisations et livrables dans un bucket S3-compatible.
4. Connecter les paiements via adaptateurs fournisseur et webhooks idempotents.
5. Activer WebSockets pour conversations et notifications.
6. Déployer le web, puis compiler l'app mobile Expo avec EAS.
