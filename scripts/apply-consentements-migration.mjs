import pg from "pg";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

config({ path: ".env.local" });
config({ path: ".env" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
const supabaseUrl = (
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
).trim();
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

function buildConnectionUrls() {
  const urls = [
    process.env.DATABASE_URL?.replace(/\[|\]/g, "")?.trim(),
    process.env.DIRECT_URL?.trim(),
  ].filter(Boolean);

  if (!password || !projectRef) return urls;

  const encoded = encodeURIComponent(password);
  const regions = [
    process.env.SUPABASE_DB_REGION?.trim(),
    "eu-west-3",
    "eu-central-1",
    "eu-west-1",
  ].filter(Boolean);

  urls.push(
    `postgresql://postgres.${projectRef}:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
  );

  for (const region of [...new Set(regions)]) {
    urls.push(
      `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    );
  }
  return [...new Set(urls)];
}

async function connectClient() {
  for (const connectionString of buildConnectionUrls()) {
    const label = connectionString.replace(/:([^:@/]+)@/, ":***@");
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });
    try {
      await client.connect();
      console.log("Connected via", label);
      return client;
    } catch (e) {
      console.error("Connection failed:", label, "->", (e.message || e).split("\n")[0]);
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

const migrationSql = readFileSync(
  join(root, "supabase/migrations/20260605210000_collaborateur_entreprise_consentements.sql"),
  "utf8",
);

async function run() {
  const client = await connectClient();
  if (!client) {
    console.error("NO_DB_CONNECTION — paste SQL in Supabase SQL Editor.");
    process.exit(2);
  }

  const existsBefore = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'collaborateur_entreprise_consentements'
    ) AS exists;
  `);
  console.log("BEFORE exists:", existsBefore.rows[0].exists);

  if (!existsBefore.rows[0].exists) {
    await client.query(migrationSql);
    console.log("Migration 20260605210000 applied.");
  }

  const existsAfter = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'collaborateur_entreprise_consentements'
    ) AS exists;
  `);
  console.log("AFTER exists:", existsAfter.rows[0].exists);

  await client.end();
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
