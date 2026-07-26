import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const sql = fs.readFileSync(
  "supabase/migrations/20260726170000_jessica_questionnaire_responses.sql",
  "utf8",
);

const base = process.env.DATABASE_URL;
const pwd = process.env.SUPABASE_DB_PASSWORD;
if (!base || !pwd) {
  console.error("DATABASE_URL / SUPABASE_DB_PASSWORD manquant");
  process.exit(1);
}

const url = new URL(base);
url.password = pwd;

const client = new Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query(sql);
  console.log("Migration jessica_questionnaire_responses OK");
} finally {
  await client.end();
}
