/**
 * Applique la migration catalog_items/catalog_access via l'API SQL Supabase (service role).
 * Usage: node scripts/apply-catalog-migration.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
  process.exit(1);
}

const migrationPath = resolve(
  __dirname,
  "../supabase/migrations/20260708220000_create_catalog_items_and_access.sql",
);
const sql = readFileSync(migrationPath, "utf8");

const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("RPC exec_sql indisponible, tentative via pg meta…", res.status, text.slice(0, 200));
  console.log("\n→ Exécutez manuellement le fichier SQL dans Supabase Studio → SQL Editor:");
  console.log(migrationPath);
  process.exit(1);
}

console.log("Migration catalog appliquée.");
