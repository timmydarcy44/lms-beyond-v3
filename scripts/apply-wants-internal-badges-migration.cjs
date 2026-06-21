const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const root = path.join(__dirname, "..");
const password = process.env.SUPABASE_DB_PASSWORD?.trim();
const supabaseUrl = (
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
).trim();
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

function buildConnectionUrls() {
  const urls = [
    process.env.DATABASE_URL?.replace(/\[|\]/g, "")?.trim(),
    process.env.DIRECT_URL?.trim(),
    process.env.POSTGRES_URL_NON_POOLING?.trim(),
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
    const client = new Client({
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

const sql = fs.readFileSync(
  path.join(root, "supabase/migrations/20260621120000_organizations_wants_internal_badges.sql"),
  "utf8",
);

async function main() {
  const client = await connectClient();
  if (!client) {
    console.error("NO_DB_CONNECTION — paste SQL in Supabase SQL Editor.");
    process.exit(2);
  }

  const colBefore = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = 'wants_internal_badges'
    ) AS exists;
  `);
  console.log("BEFORE column exists:", colBefore.rows[0].exists);

  await client.query(sql);
  console.log("Migration applied.");

  const res = await client.query(`
    SELECT id, name, slug, wants_internal_badges
    FROM public.organizations
    WHERE wants_internal_badges = true
    ORDER BY name
  `);

  console.log("Orgs wants_internal_badges=true:", res.rows.length);
  for (const row of res.rows) {
    console.log(`  - ${row.name} (${row.slug ?? "—"})`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
