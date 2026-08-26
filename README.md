# KayJob

Marketplace nationale des talents étudiants au Sénégal.

## Contenu

- `public/` : site web prototype complet et autonome.
- `database/schema.sql` : schéma de base de données MVP.
- `docs/` : spécifications, architecture, business model et lancement.
- `apps/mobile/` : squelette Expo 54.

## Ouvrir le site

```bash
xdg-open /home/falilou/Bureau/Kayjob/public/index.html
```

## Ouvrir l'application web

```bash
xdg-open /home/falilou/Bureau/Kayjob/apps/web/index.html
```

## Application mobile

Le squelette Expo 54 contient maintenant plusieurs écrans :

- Accueil
- Services
- Missions
- Commandes
- Portfolio public

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
