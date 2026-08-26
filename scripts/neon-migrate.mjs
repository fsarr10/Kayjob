import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL_UNPOOLED ou DATABASE_URL est manquant.");
  process.exit(1);
}

const parsed = new URL(databaseUrl);
parsed.searchParams.delete("channel_binding");
if (parsed.hostname.endsWith(".neon.tech") && !parsed.searchParams.has("options")) {
  parsed.searchParams.set("options", `endpoint=${parsed.hostname.split(".")[0].replace("-pooler", "")}`);
}

const migrations = readdirSync("database/migrations")
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const migration of migrations) {
  console.log(`\nApplying ${migration}`);
  const result = spawnSync("psql", [parsed.toString(), "-v", "ON_ERROR_STOP=1", "-f", `database/migrations/${migration}`], {
    stdio: "inherit",
    shell: false
  });
  if (result.error) {
    console.error("psql est requis pour appliquer la migration Neon.", result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`\nApplied ${migrations.length} migration(s).`);
