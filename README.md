# KayJob

Marketplace nationale des talents étudiants au Sénégal.

## Contenu

- `public/` : site vitrine produit complet et autonome.
- `apps/web/` : application web KayJob avec dashboard, recherche, missions, commandes, messages, portfolio et admin.
- `database/schema.sql` : schéma de base de données MVP.
- `docs/` : spécifications, architecture, business model et lancement.
- `apps/mobile/` : application mobile Expo 54 avec Expo Router.

## Ouvrir le site

```bash
xdg-open /home/falilou/Bureau/Kayjob/public/index.html
```

## Ouvrir l'application web

```bash
xdg-open /home/falilou/Bureau/Kayjob/apps/web/index.html
```

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

## Vérifier et construire

```bash
npm run check
npm run build
```
