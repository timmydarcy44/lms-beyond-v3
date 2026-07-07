import fs from "fs";
import pg from "pg";

const { Client } = pg;

const passwords = [
  process.env.SUPABASE_DB_PASSWORD,
  "Timmydarcy-14",
].filter(Boolean);

const hosts = [
  "db.zmcefidiiqqppowymoqb.supabase.co:5432/postgres",
  "aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
];

const users = ["postgres", "postgres.zmcefidiiqqppowymoqb"];

async function connect() {
  for (const user of users) {
    for (const host of hosts) {
      for (const password of passwords) {
        const conn = `postgresql://${user}:${encodeURIComponent(password)}@${host}`;
        const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
        try {
          await client.connect();
          console.log("Connected via", user, host);
          return client;
        } catch (e) {
          console.log("Fail", user, host, e.message);
          await client.end().catch(() => undefined);
        }
      }
    }
  }
  return null;
}

async function main() {
  const client = await connect();
  if (!client) {
    console.error("Could not connect to Postgres — apply migration manually in SQL Editor.");
    process.exit(2);
  }

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
    console.log("Migration applied.");
  }

  const after = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'collaborateur_entreprise_consentements'
     ) AS exists`,
  );
  console.log("AFTER exists:", after.rows[0].exists);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
