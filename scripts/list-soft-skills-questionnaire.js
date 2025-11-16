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
    .from("mental_health_questionnaires")
    .select("id,title,org_id,created_at")
    .eq("title", "Soft Skills – Profil 360")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log({ data, error });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


