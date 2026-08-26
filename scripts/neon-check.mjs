import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^['"]|['"]$/g, "");
    process.env[match[1]] ??= value;
  }
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

function psqlUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete("channel_binding");
  if (parsed.hostname.endsWith(".neon.tech") && !parsed.searchParams.has("options")) {
    const endpoint = parsed.hostname.split(".")[0].replace("-pooler", "");
    parsed.searchParams.set("options", `endpoint=${endpoint}`);
  }
  return parsed.toString();
}

if (!databaseUrl) {
  console.error("DATABASE_URL est manquant. Copie .env.example en .env puis ajoute l'URL Neon.");
  process.exit(1);
}

const result = spawnSync(
  "psql",
  [psqlUrl(databaseUrl), "-v", "ON_ERROR_STOP=1", "-c", "select current_database() as database, current_user as user, now() as connected_at;"],
  { encoding: "utf8", stdio: "pipe" }
);

if (result.error?.code === "ENOENT") {
  console.error("psql n'est pas installé. Installe le client PostgreSQL pour tester Neon depuis ce terminal.");
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Connexion Neon échouée.");
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);

if (!unpooledUrl) {
  console.error("DATABASE_URL_UNPOOLED est manquant. Il est nécessaire pour les migrations et tâches admin.");
  process.exit(1);
}

if (!authBaseUrl) {
  console.error("NEON_AUTH_BASE_URL est manquant. Il est nécessaire pour Neon Auth.");
  process.exit(1);
}

console.log("Variables Neon présentes: DATABASE_URL, DATABASE_URL_UNPOOLED, NEON_AUTH_BASE_URL.");
