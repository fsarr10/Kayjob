# KayJob API

API Node.js minimale connectée à Neon PostgreSQL. Elle protège les invariants du séquestre dans des transactions SQL et expose un contrat HTTP compatible avec une future implémentation Laravel.

## Lancer en local

```bash
npm install
npm run start:api
```

Les routes authentifiées de développement utilisent `X-User-Id`. Ce mécanisme est volontairement refusé en production : il doit être remplacé par Neon Auth/Sanctum ou un JWT vérifié avant déploiement public.

## Routes disponibles

- `GET /health`
- `GET /api/services`
- `POST /api/orders`
- `POST /api/orders/:id/pay`
- `POST /api/webhooks/payments/:provider`
- `POST /api/orders/:id/deliver-preview`
- `GET /api/orders/:id/preview-stream`
- `POST /api/orders/:id/deliver-final`
- `POST /api/orders/:id/validate`
- `POST /api/orders/:id/dispute`
- `POST /api/orders/:id/messages`

Le provider `mock` est réservé au développement. Wave, Orange Money et Yas doivent être implémentés derrière l’adaptateur avant production, avec vérification de signature et credentials sandbox/production officiels.
