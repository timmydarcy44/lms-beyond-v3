const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://fqqqejpakbccwvrlolpc.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, key);

async function main() {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log({ error });
  if (data) {
    for (const row of data) {
      console.log({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        published: row.published,
        org_id: row.org_id,
        created_by: row.created_by,
        display_format: row.display_format,
        category: row.category,
        evaluation_type: row.evaluation_type,
      });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



