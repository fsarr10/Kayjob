import { Pool } from "pg";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadLocalEnv() {
  const envPath = resolve(repoRoot, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.NODE_ENV === "production" || process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
});
