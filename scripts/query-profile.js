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
    .from("profiles")
    .select("id,email,full_name")
    .eq("email", "timdarcypro@gmail.com")
    .maybeSingle();

  console.log({ data, error });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



