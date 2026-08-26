# KayJob API

API Node.js minimale connectée à Neon PostgreSQL. Elle protège les invariants du séquestre dans des transactions SQL et expose un contrat HTTP compatible avec une future implémentation Laravel.

Le stockage privé utilise Cloudflare R2 via l’API S3. Le bucket ne doit pas être exposé publiquement ; l’API délivre des URLs PUT temporaires pour les uploads et des URLs GET courtes pour les fichiers finaux. Les previews passent par `/preview-stream` et ne renvoient pas d’URL R2 au client.

## Lancer en local

```bash
npm install
npm run start:api
```

Les routes authentifiées utilisent `Authorization: Bearer <session_token>`. Pour les tests locaux uniquement, `X-User-Id` peut être utilisé quand `NODE_ENV` n'est pas `production`.

## Routes disponibles

- `GET /health`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `GET /api/services`
- `GET /api/profiles/:pseudo`
- `POST /api/me/profile`
- `POST /api/me/portfolio`
- `POST /api/uploads/presign`
- `GET /api/missions`
- `POST /api/missions`
- `POST /api/missions/:id/offers`
- `GET /api/me/orders`
- `GET /api/me/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/orders`
- `POST /api/orders/:id/pay`
- `POST /api/webhooks/payments/:provider`
- `POST /api/orders/:id/deliver-preview`
- `GET /api/orders/:id/preview-stream`
- `GET /api/orders/:id/files/:fileId`
- `POST /api/orders/:id/deliver-final`
- `POST /api/orders/:id/validate`
- `POST /api/orders/:id/dispute`
- `POST /api/orders/:id/review`
- `POST /api/orders/:id/messages`
- `GET /api/admin/overview`
- `POST /api/providers/withdraw`

Le job de libération automatique se lance avec `npm run api:release-expired`. Il utilise un verrou advisory PostgreSQL pour empêcher deux exécutions concurrentes. En production VPS, installer la planification toutes les 5 minutes avec :

```bash
sudo bash deploy/install-release-cron.sh /var/www/kayjob
```

Le modèle cron est aussi versionné dans `deploy/kayjob-release-expired.cron`. Le serveur doit fournir `DATABASE_URL` via son environnement ou `/var/www/kayjob/.env`.

## Déploiement Render

Le fichier `render.yaml` crée le service API et un Cron Job Render toutes les 5 minutes. Dans Render, choisir **New > Blueprint**, connecter le dépôt GitHub, puis renseigner les variables marquées `sync: false` dans les deux services. Le Cron Job ne nécessite que `DATABASE_URL`; il exécute `npm run api:release-expired` et ne dépend pas du service web.

Le provider `mock` est réservé au développement. Wave, Orange Money et Yas doivent être branchés derrière l’adaptateur avant production, avec vérification de signature et credentials sandbox/production officiels.
