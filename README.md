# KayJob

Marketplace nationale des talents étudiants au Sénégal.

## Contenu

- `public/` : application web KayJob unique, présentée directement à l’entrée publique et sans page vitrine séparée.
- `apps/web/` : source de l’application web KayJob avec dashboard, recherche, missions, commandes, messages, portfolio et admin.
- `database/schema.sql` : schéma PostgreSQL MVP compatible Neon.
- `database/neon-setup.md` : guide de connexion Neon.
- `docs/` : spécifications, architecture, business model et lancement.
- `apps/mobile/` : application mobile Expo 54 avec Expo Router.
- `apps/api/` : API Node.js connectée à Neon, séquestre, transitions de commandes et sécurité des messages.

## Ouvrir l'application web

```bash
xdg-open /home/falilou/Bureau/Kayjob/public/index.html
```

La racine publique sert désormais directement l’application KayJob, sans séparation en site vitrine distinct.

## Application mobile

L'application Expo 54 contient les écrans V1 :

- Accueil
- Services
- Missions
- Commandes
- Messages
- Portfolio public
- Compte / OTP / vérification
- Admin national

```bash
cd /home/falilou/Bureau/Kayjob/apps/mobile
npm install
npm run start
```

### Préparer une publication mobile

Le projet est configuré pour Expo Application Services avec les profils `development`, `preview` et `production`.

```bash
cd ~/Bureau/Kayjob/apps/mobile
npx expo-doctor
npx expo export --platform ios --clear
eas build --platform all --profile production
eas submit --platform all --profile production
```

Avant la première soumission, générer les assets PNG de store à partir de `apps/mobile/assets/kayjob-logo.svg`, renseigner les identifiants Apple/Google Play dans EAS, et remplacer les providers de paiement de démonstration par leurs credentials sandbox puis production.

## Vérifier et construire

```bash
npm run check
npm run build
```

## API backend

```bash
npm run start:api
```

Voir [apps/api/README.md](apps/api/README.md) pour les routes et le mécanisme d'authentification local.

## Base de données Neon

```bash
cp .env.example .env
# Ajouter DATABASE_URL depuis Neon dans .env
npm run db:check
npm run db:schema
npm run db:tables
```

Le workspace est relié au projet Neon `KayJob` (`green-smoke-94867582`) et le MCP Neon est configuré pour Codex dans `.codex/config.toml`.
