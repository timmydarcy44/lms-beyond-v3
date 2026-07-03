import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("No .env.local");
  }
}

loadEnvLocal();

const { createClient } = await import("@supabase/supabase-js");
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const cols = ["bio_long", "certification_status", "is_certified_beyond"];

for (const col of cols) {
  const id = randomUUID();
  const email = `col-${col}-${Date.now()}@mailinator.com`;
  const row = { id, email, first_name: "T", last_name: "C" };
  if (col === "is_certified_beyond") row[col] = false;
  else if (col === "certification_status") row[col] = "none";
  else row[col] = "test";

  const { error } = await s.from("experts").upsert(row, { onConflict: "id" });
  console.log(col + ":", error ? `MISSING (${error.code}) ${error.message}` : "OK");
  if (!error) await s.from("experts").delete().eq("id", id);
}

const profileSelect =
  "id,email,first_name,last_name,headline,bio,bio_long,avatar_url,photo_url,specialties,formats_supported,references,review_status,is_active,wants_certification,certification_status,is_certified_beyond,registration_step,linkedin_url,regions";

const { data: experts } = await s.from("experts").select("id").limit(1);
if (experts?.[0]?.id) {
  const { error } = await s.from("experts").select(profileSelect).eq("id", experts[0].id).maybeSingle();
  console.log("profile editor select:", error ? `${error.code} ${error.message}` : "OK");
}
