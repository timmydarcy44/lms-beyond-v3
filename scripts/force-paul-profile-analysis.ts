/**
 * Force la régénération de l'analyse croisée (profiles.ai_analysis) pour Paul test2026.
 * Usage: npx tsx scripts/force-paul-profile-analysis.ts
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { maybeRefreshProfileAnalysisIfStale } from "../src/lib/learner/profile-analysis";

dotenv.config({ path: ".env.local" });

const PAUL_USER_ID = "23251989-2c4b-44d6-9616-e7f11078374a";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const result = await maybeRefreshProfileAnalysisIfStale(service, PAUL_USER_ID, {
    forceRegenerate: true,
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.refreshed) {
    console.error("Regeneration did not run:", result.reason);
    process.exit(1);
  }

  const { data } = await service
    .from("profiles")
    .select("ai_analysis")
    .eq("id", PAUL_USER_ID)
    .maybeSingle();

  const raw = data?.ai_analysis;
  let preview = "";
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      preview = String(parsed.text ?? raw).slice(0, 500);
    } catch {
      preview = raw.slice(0, 500);
    }
  }

  console.log("\nPreview:\n", preview);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
