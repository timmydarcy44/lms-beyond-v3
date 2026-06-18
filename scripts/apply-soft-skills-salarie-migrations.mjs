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

if (!projectRef) {
  console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

function buildConnectionUrls() {
  const urls = [
    process.env.DATABASE_URL?.trim(),
    process.env.DIRECT_URL?.trim(),
    process.env.POSTGRES_URL_NON_POOLING?.trim(),
  ].filter(Boolean);

  if (!password) return urls;

  const encoded = encodeURIComponent(password);
  const region = process.env.SUPABASE_DB_REGION?.trim();
  urls.push(
    `postgresql://postgres.${projectRef}:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
  );
  if (region) {
    urls.push(
      `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    );
  }
  return [...new Set(urls)];
}

async function connectClient() {
  const urls = buildConnectionUrls();
  if (urls.length === 0) {
    console.error(
      "Missing DATABASE_URL or SUPABASE_DB_PASSWORD (voir Supabase → Settings → Database)",
    );
    process.exit(1);
  }

  for (const connectionString of urls) {
    const label = connectionString.replace(/:([^:@/]+)@/, ":***@");
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
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

  console.error(
    "Aucune connexion Postgres disponible. Appliquez le SQL manuellement dans Supabase SQL Editor.",
  );
  process.exit(1);
}

const createMigration = readFileSync(
  join(root, "supabase/migrations/20260407160000_soft_skills_resultats_salarie.sql"),
  "utf8",
);
const aiMigration = readFileSync(
  join(root, "supabase/migrations/20260618100000_soft_skills_resultats_salarie_ai_analysis.sql"),
  "utf8",
);

const rlsSql = `
-- RLS already in migration file; idempotent re-apply if needed
alter table public.soft_skills_resultats_salarie enable row level security;
drop policy if exists "soft_skills_resultats_salarie_own" on public.soft_skills_resultats_salarie;
create policy "soft_skills_resultats_salarie_own"
  on public.soft_skills_resultats_salarie
  for all
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());
grant select, insert, update, delete on public.soft_skills_resultats_salarie to authenticated;
grant all on public.soft_skills_resultats_salarie to service_role;
`;

async function run() {
  const client = await connectClient();
  console.log("Project ref:", projectRef);

  const existsBefore = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats_salarie'
    ) AS exists;
  `);
  console.log("BEFORE exists:", existsBefore.rows[0].exists);

  if (!existsBefore.rows[0].exists) {
    console.log("\nApplying create migration + RLS...");
    await client.query(createMigration);
    await client.query(rlsSql);
    console.log("Create migration applied.");
  } else {
    console.log("Table already exists, skipping create.");
  }

  console.log("\nApplying ai_analysis migration...");
  await client.query(aiMigration);
  console.log("ai_analysis migration applied.");

  const existsAfter = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats_salarie'
    ) AS exists;
  `);
  console.log("\nAFTER exists:", existsAfter.rows[0].exists);

  const cols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats_salarie'
    ORDER BY ordinal_position;
  `);
  console.log("\nCOLUMNS:");
  for (const c of cols.rows) console.log(`  ${c.column_name} (${c.data_type})`);

  const rls = await client.query(`
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'soft_skills_resultats_salarie';
  `);
  console.log("\nRLS enabled:", rls.rows[0]?.relrowsecurity);

  await client.end();
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
