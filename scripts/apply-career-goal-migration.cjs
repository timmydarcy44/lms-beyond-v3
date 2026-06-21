const fs = require("fs");
const { Client } = require("pg");

const env = fs.readFileSync(".env.local", "utf8");
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
if (!dbUrl) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

const sql = fs.readFileSync(
  "supabase/migrations/20260619120000_profiles_career_goal.sql",
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
      AND column_name IN ('career_goal', 'career_goal_other')
    ORDER BY 1
  `);

  console.log(
    "OK — colonnes career_goal:",
    res.rows.map((r) => r.column_name).join(", ") || "(none)",
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
