/** Fix Timmy RH profile names in prod. Usage: node scripts/fix-timmy-rh-profile.mjs */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });
const EMAIL = "timmydarcy44@gmail.com";

async function main() {
  const { data: before, error: findErr } = await service
    .from("profiles")
    .select("id, email, first_name, last_name, display_name")
    .ilike("email", EMAIL)
    .maybeSingle();

  if (findErr || !before) {
    console.error("Profile not found", findErr);
    process.exit(1);
  }

  console.log("BEFORE:", JSON.stringify(before, null, 2));

  const { data: after, error: updateErr } = await service
    .from("profiles")
    .update({ first_name: "Timmy", last_name: "DARCY" })
    .eq("id", before.id)
    .select("id, email, first_name, last_name, display_name")
    .single();

  if (updateErr) {
    console.error("Update failed", updateErr);
    process.exit(1);
  }

  console.log("AFTER:", JSON.stringify(after, null, 2));

  const ok =
    after.first_name === "Timmy" &&
    after.last_name === "DARCY" &&
    after.email?.toLowerCase() === EMAIL;

  console.log(JSON.stringify({ ok, profile_id: after.id }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
