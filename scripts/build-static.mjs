import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await cp(resolve(root, "public"), resolve(dist, "site"), { recursive: true });
await cp(resolve(root, "apps", "web"), resolve(dist, "app"), { recursive: true });
