/**
 * Vérifie le filtre wants_internal_badges pour le dropdown Open Badge.
 * Usage: node scripts/verify-internal-badges-orgs.mjs
 */
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

async function main() {
  const { data: all, error: allError } = await service
    .from("organizations")
    .select("id, name, slug, wants_internal_badges")
    .order("name");

  if (allError) {
    if (/wants_internal_badges/.test(allError.message)) {
      console.error("FAIL: colonne wants_internal_badges absente — appliquer la migration SQL.");
      process.exit(1);
    }
    throw allError;
  }

  const enabled = (all ?? []).filter((o) => o.wants_internal_badges === true);
  console.log("Organisations wants_internal_badges=true:", enabled.length);
  for (const org of enabled) {
    console.log(`  - ${org.name} (${org.slug ?? "—"})`);
  }

  const total = all?.length ?? 0;
  if (enabled.length === 1 && /edge/i.test(String(enabled[0]?.name ?? enabled[0]?.slug ?? ""))) {
    console.log(`\nPASS: une seule org (EDGE Lab) sur ${total} organisations.`);
    process.exit(0);
  }

  console.error(`\nFAIL: attendu 1 org EDGE Lab, trouvé ${enabled.length} sur ${total}.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
