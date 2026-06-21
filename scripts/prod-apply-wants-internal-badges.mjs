import fs from "fs";
import pg from "pg";

const { Client } = pg;

const password = process.env.SUPABASE_DB_PASSWORD || "Timmydarcy-14";
const projectRef = "zmcefidiiqqppowymoqb";

const hosts = [
  `db.${projectRef}.supabase.co:5432/postgres`,
  `aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
];

const users = ["postgres", `postgres.${projectRef}`];

async function connect() {
  for (const user of users) {
    for (const host of hosts) {
      const conn = `postgresql://${user}:${encodeURIComponent(password)}@${host}`;
      const client = new Client({
        connectionString: conn,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
      });
      try {
        await client.connect();
        console.log("Connected via", user, host);
        return client;
      } catch (e) {
        console.log("Fail", user, host, (e.message || e).split("\n")[0]);
        await client.end().catch(() => undefined);
      }
    }
  }
  return null;
}

async function main() {
  const client = await connect();
  if (!client) {
    console.error("Could not connect to Postgres");
    process.exit(2);
  }

  const sql = fs.readFileSync(
    "supabase/migrations/20260621120000_organizations_wants_internal_badges.sql",
    "utf8",
  );
  await client.query(sql);

  const res = await client.query(`
    SELECT name, slug, wants_internal_badges
    FROM public.organizations
    WHERE wants_internal_badges = true
    ORDER BY name
  `);

  console.log("Orgs enabled:", res.rows.length);
  for (const row of res.rows) {
    console.log(`  - ${row.name} (${row.slug ?? "—"})`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
