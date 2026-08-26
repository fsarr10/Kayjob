# Architecture KayJob

- Backend cible : Laravel + Sanctum, Neon PostgreSQL, Redis.
- Web : site public et dashboard en React/Next.js à industrialiser depuis ce prototype.
- Mobile : Expo 54 + Expo Router.
- Temps réel : WebSockets/Soketi.
- Fichiers : stockage S3-compatible.
- Paiements : interface `PaymentProvider` pour Wave, Orange Money, Free Money et carte.
- Base de données : Neon avec connexion PostgreSQL SSL. L'application utilise `DATABASE_URL` pooled, les migrations utilisent `DATABASE_URL_UNPOOLED`.
- Auth : Neon Auth via `NEON_AUTH_BASE_URL`.
- Agent tooling : Neon MCP projet configuré pour Codex et agent-skills `neon` / `neon-postgres` installés.

Le prototype actuel est statique pour valider le produit avant l'industrialisation backend.

## Passage production

1. Créer l'API Laravel avec les tables du schéma SQL.
2. Créer le projet Neon, renseigner `DATABASE_URL`, puis exécuter `npm run db:schema`.
3. Remplacer `localStorage` par des endpoints REST authentifiés.
4. Stocker les réalisations et livrables dans un bucket S3-compatible.
5. Connecter les paiements via adaptateurs fournisseur et webhooks idempotents.
6. Activer WebSockets pour conversations et notifications.
7. Déployer le web, puis compiler l'app mobile Expo avec EAS.
