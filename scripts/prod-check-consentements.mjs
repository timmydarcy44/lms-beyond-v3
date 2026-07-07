import fs from "fs";
import pg from "pg";

const { Client } = pg;
const conn =
  process.env.DATABASE_URL?.replace(/\[|\]/g, "") ??
  "postgresql://postgres.zmcefidiiqqppowymoqb:Timmydarcy-14@db.zmcefidiiqqppowymoqb.supabase.co:5432/postgres";

const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  const before = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'collaborateur_entreprise_consentements'
     ) AS exists`,
  );
  console.log("BEFORE exists:", before.rows[0].exists);

  if (!before.rows[0].exists) {
    const sql = fs.readFileSync(
      "supabase/migrations/20260605210000_collaborateur_entreprise_consentements.sql",
      "utf8",
    );
    await client.query(sql);
    console.log("Migration 20260605210000 applied.");
  }

  const after = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'collaborateur_entreprise_consentements'
     ) AS exists`,
  );
  console.log("AFTER exists:", after.rows[0].exists);

  const count = await client.query(
    "SELECT COUNT(*)::int AS n FROM public.collaborateur_entreprise_consentements",
  );
  console.log("Row count:", count.rows[0].n);

  await client.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
