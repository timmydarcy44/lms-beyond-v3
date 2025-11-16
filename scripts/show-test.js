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
    .select("id, slug, title, description, display_format, questions")
    .eq("id", "8f249ed9-85d2-4c2b-90f9-ddac9ed7c02d")
    .maybeSingle();

  console.log({ data, error });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



