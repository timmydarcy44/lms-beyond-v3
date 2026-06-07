/**
 * Active le studio LMS Jessica Contentin pour contentin.cabinet@gmail.com
 * Usage: node scripts/seed-jessica-studio.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) throw new Error("Missing SUPABASE env");

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const ORG_ID = "17d6def2-2422-4628-83ab-24b04746c19c";
const JESSICA_ID = "fcdc770d-4474-43ae-97d6-e70ef7e58779";
const EMAIL = "contentin.cabinet@gmail.com";

async function main() {
  await sb.from("profiles").update({
    role: "formateur",
    role_type: "formateur",
    school_id: ORG_ID,
    first_name: "Jessica",
    last_name: "CONTENTIN",
    full_name: "Jessica CONTENTIN",
  }).eq("id", JESSICA_ID);

  const { data: mem } = await sb
    .from("org_memberships")
    .select("id")
    .eq("org_id", ORG_ID)
    .eq("user_id", JESSICA_ID)
    .maybeSingle();

  if (!mem) {
    await sb.from("org_memberships").insert({
      org_id: ORG_ID,
      user_id: JESSICA_ID,
      role: "admin",
    });
  }

  const { data: sa } = await sb
    .from("super_admins")
    .select("id")
    .eq("user_id", JESSICA_ID)
    .maybeSingle();

  if (!sa) {
    await sb.from("super_admins").insert({
      user_id: JESSICA_ID,
      is_active: true,
    });
  } else {
    await sb.from("super_admins").update({ is_active: true }).eq("user_id", JESSICA_ID);
  }

  const { count } = await sb
    .from("paths")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ORG_ID);

  console.log("✓ Studio Jessica Contentin activé");
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Org: Jessica Contentin (${ORG_ID})`);
  console.log(`  Rôle: formateur + org admin + super_admin`);
  console.log(`  Parcours existants sur l'org: ${count ?? 0}`);
  console.log("");
  console.log("Accès:");
  console.log("  /super/jessica-dashboard  — admin studio");
  console.log("  /dashboard/formateur      — création parcours/formations");
  console.log("  /super/studio/parcours/new — nouveau parcours");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
