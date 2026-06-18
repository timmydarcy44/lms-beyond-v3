import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("NO_DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const tables = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name ILIKE '%soft%skill%'
  ORDER BY table_name;
`);

console.log("=== SOFT SKILLS RELATED TABLES (public) ===");
for (const row of tables.rows) {
  console.log(`${row.table_schema}.${row.table_name}`);
}

const existsSalarie = await client.query(`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats_salarie'
  ) AS exists;
`);
console.log("\n=== soft_skills_resultats_salarie EXISTS ===");
console.log(existsSalarie.rows[0].exists);

const existsApprenant = await client.query(`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats'
  ) AS exists;
`);
console.log("\n=== soft_skills_resultats EXISTS ===");
console.log(existsApprenant.rows[0].exists);

if (existsApprenant.rows[0].exists) {
  const cols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'soft_skills_resultats'
    ORDER BY ordinal_position;
  `);
  console.log("\n=== soft_skills_resultats COLUMNS ===");
  for (const c of cols.rows) console.log(`  ${c.column_name} (${c.data_type})`);
}

try {
  const migrations = await client.query(`
    SELECT version, name
    FROM supabase_migrations.schema_migrations
    WHERE name ILIKE '%soft%skill%'
       OR version IN (
         '20260407160000',
         '20260503103000',
         '20260513130000',
         '20260618100000'
       )
    ORDER BY version;
  `);
  console.log("\n=== APPLIED MIGRATIONS (soft skills related) ===");
  for (const m of migrations.rows) console.log(`${m.version}  ${m.name ?? ""}`);
} catch (e) {
  console.log("\n=== MIGRATIONS TABLE ===");
  console.log(String(e.message || e));
}

const legacy = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name ILIKE '%soft_skills%legacy%'
  ORDER BY table_name;
`);
if (legacy.rows.length) {
  console.log("\n=== LEGACY SOFT SKILLS TABLES ===");
  for (const r of legacy.rows) console.log(r.table_name);
}

const counts = [];
for (const name of ["soft_skills_resultats", "soft_skills_resultats_salarie", "soft_skills_resultats_legacy_pre_20260503"]) {
  const ex = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists`,
    [name],
  );
  if (!ex.rows[0].exists) continue;
  const c = await client.query(`SELECT COUNT(*)::int AS n FROM public."${name}"`);
  counts.push({ table: name, rows: c.rows[0].n });
}
console.log("\n=== ROW COUNTS ===");
console.log(JSON.stringify(counts, null, 2));

await client.end();
