import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const password = process.env.SUPABASE_DB_PASSWORD || "Timmydarcy-14";
const ref = "zmcefidiiqqppowymoqb";
const regions = [
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
];

for (const region of regions) {
  for (const port of [5432, 6543]) {
    const host = `aws-0-${region}.pooler.supabase.com:${port}/postgres`;
    const conn = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}`;
    const client = new pg.Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      const r = await client.query("select current_database()");
      console.log("OK", region, port, r.rows[0]);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log("fail", region, port, (e.message || "").slice(0, 100));
      await client.end().catch(() => undefined);
    }
  }
}

console.error("no pooler connection");
process.exit(2);
