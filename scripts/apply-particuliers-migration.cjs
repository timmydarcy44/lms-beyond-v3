const fs = require("fs");
const { Client } = require("pg");

const env = fs.readFileSync(".env.local", "utf8");
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const sql = fs.readFileSync(
  "supabase/migrations/20260617100000_profiles_particuliers_edge_columns.sql",
  "utf8",
);

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);

  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN (
        'type_profil', 'access_connect', 'access_lms', 'access_care', 'access_pro',
        'role_type', 'first_name', 'email', 'role'
      )
    ORDER BY 1
  `);

  console.log("OK — colonnes profiles:", res.rows.map((r) => r.column_name).join(", "));

  const settings = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profile_settings'
    ORDER BY 1
  `);
  console.log("OK — user_profile_settings:", settings.rows.map((r) => r.column_name).join(", "));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
