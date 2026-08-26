# Neon pour KayJob

KayJob utilise Neon comme base PostgreSQL managée.

## Configuration

1. Crée un projet Neon.
2. Copie la chaîne de connexion PostgreSQL avec `sslmode=require`.
3. Crée un fichier `.env` à partir de `.env.example`.
4. Renseigne `DATABASE_URL`.

Exemple :

```bash
cp .env.example .env
```

## Tester la connexion

Le script utilise le client `psql`.

```bash
npm run db:check
```

## Créer le schéma

```bash
npm run db:schema
```

## Laravel

Pour le backend Laravel, utiliser PostgreSQL :

```env
DB_CONNECTION=pgsql
DB_HOST=HOST.neon.tech
DB_PORT=5432
DB_DATABASE=DBNAME
DB_USERNAME=USER
DB_PASSWORD=PASSWORD
DB_SSLMODE=require
```

Les migrations Laravel devront reprendre le contenu de `database/schema.sql`.
