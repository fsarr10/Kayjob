# Architecture KayJob

- Backend cible : Laravel + Sanctum, PostgreSQL, Redis.
- Web : site public et dashboard en React/Next.js à industrialiser depuis ce prototype.
- Mobile : Expo 54 + Expo Router.
- Temps réel : WebSockets/Soketi.
- Fichiers : stockage S3-compatible.
- Paiements : interface `PaymentProvider` pour Wave, Orange Money, Free Money et carte.

Le prototype actuel est statique pour valider le produit avant l'industrialisation backend.
