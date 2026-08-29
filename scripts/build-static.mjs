import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await cp(resolve(root, "public"), dist, { recursive: true });

const apiUrl = process.env.KAYJOB_API_URL || "";
const indexPath = resolve(dist, "index.html");
const html = await readFile(indexPath, "utf8");
await writeFile(indexPath, html.replaceAll("__KAYJOB_API_URL__", apiUrl), "utf8");
