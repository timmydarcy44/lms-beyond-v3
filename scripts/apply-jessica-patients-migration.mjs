/**
 * Applique la migration jessica_cabinet_patients sur la base distante.
 * Usage: node scripts/apply-jessica-patients-migration.mjs
 */
import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL manquant dans .env.local");

const sql = fs.readFileSync(
  resolve(__dirname, "../supabase/migrations/20260710120000_jessica_cabinet_patients.sql"),
  "utf8",
);

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  try {
    console.log("→ Application migration jessica_cabinet_patients…");
    await client.query(sql);
    console.log("Migration appliquée avec succès.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
