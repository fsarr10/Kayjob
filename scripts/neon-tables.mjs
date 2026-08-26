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

function psqlUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete("channel_binding");
  if (parsed.hostname.endsWith(".neon.tech") && !parsed.searchParams.has("options")) {
    const endpoint = parsed.hostname.split(".")[0].replace("-pooler", "");
    parsed.searchParams.set("options", `endpoint=${endpoint}`);
  }
  return parsed.toString();
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL_UNPOOLED ou DATABASE_URL est manquant.");
  process.exit(1);
}

const result = spawnSync(
  "psql",
  [
    psqlUrl(databaseUrl),
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name;"
  ],
  { encoding: "utf8", stdio: "pipe" }
);

if (result.error?.code === "ENOENT") {
  console.error("psql n'est pas installé.");
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Lecture des tables Neon échouée.");
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
