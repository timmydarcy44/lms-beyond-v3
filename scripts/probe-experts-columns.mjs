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

const cols = [
  "headline",
  "specialties",
  "formats_supported",
  "regions",
  "is_active",
  "review_status",
  "references",
  "bio",
  "avatar_url",
  "photo_url",
  "linkedin_url",
  "wants_certification",
  "registration_step",
];

for (const col of cols) {
  const id = randomUUID();
  const email = `col-${col}-${Date.now()}@mailinator.com`;
  const row = { id, email, first_name: "T", last_name: "C" };
  if (["specialties", "formats_supported", "regions"].includes(col)) row[col] = ["x"];
  else if (col === "references") row[col] = [];
  else if (["is_active", "wants_certification"].includes(col)) row[col] = false;
  else if (col === "registration_step") row[col] = 0;
  else if (col === "review_status") row[col] = "pending_review";
  else row[col] = "test";

  const { error } = await s.from("experts").upsert(row, { onConflict: "id" });
  console.log(col + ":", error ? `MISSING (${error.code})` : "OK");
  if (!error) await s.from("experts").delete().eq("id", id);
}
