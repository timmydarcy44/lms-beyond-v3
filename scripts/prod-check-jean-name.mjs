import pg from "pg";

const { Client } = pg;
const conn =
  process.env.DATABASE_URL?.replace(/\[|\]/g, "") ??
  "postgresql://postgres.zmcefidiiqqppowymoqb:Timmydarcy-14@db.zmcefidiiqqppowymoqb.supabase.co:5432/postgres";

const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  const roche = await client.query(`
    SELECT p.id, p.email, p.first_name, p.last_name, p.display_name,
           e.first_name AS emp_first, e.last_name AS emp_last, e.email AS emp_email
    FROM profiles p
    LEFT JOIN employees e ON e.profile_id = p.id OR lower(e.email) = lower(p.email)
    WHERE lower(coalesce(p.last_name, '')) LIKE '%rochepos%'
       OR lower(coalesce(p.email, '')) LIKE '%rochepos%'
       OR lower(coalesce(e.last_name, '')) LIKE '%rochepos%'
    LIMIT 20`);

  console.log("ROCHEPOSE ACCOUNTS:");
  console.log(JSON.stringify(roche.rows, null, 2));

  const timmy = await client.query(`
    SELECT p.id, p.email, p.first_name, p.last_name, p.display_name,
           u.raw_user_meta_data->>'first_name' AS meta_first,
           u.raw_user_meta_data->>'prenom' AS meta_prenom
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE lower(p.email) LIKE '%timmydarcy%' OR lower(p.email) LIKE '%test20%'
    LIMIT 10`);

  console.log("TIMMY/TEST20 ACCOUNTS:");
  console.log(JSON.stringify(timmy.rows, null, 2));

  await client.end();
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
