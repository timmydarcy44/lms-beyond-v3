/**
 * Diagnostic inscription expert — usage local uniquement.
 * node scripts/test-expert-register.mjs
 */
import { readFileSync } from "node:fs";
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("No .env.local");
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("env:", {
  hasUrl: Boolean(url),
  hasServiceKey: Boolean(key),
  hasResend: Boolean(process.env.RESEND_API_KEY),
});

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `diag-expert-${Date.now()}@example.com`;
const firstName = "Diag";
const lastName = "Test";

console.log("\n1. inviteUserByEmail...");
const redirectTo = "http://localhost:3001/auth/set-password?next=%2Fdashboard%2Fexpert&flow=expert";
const invite = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { role_type: "expert", first_name: firstName, last_name: lastName },
  redirectTo,
});
console.log("invite:", invite.error?.message ?? "ok", invite.data?.user?.id);

let userId = invite.data?.user?.id;
if (!userId) {
  console.log("\n2. createUser fallback...");
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { role_type: "expert", first_name: firstName, last_name: lastName },
  });
  console.log("create:", created.error?.message ?? "ok", created.data?.user?.id);
  userId = created.data?.user?.id;
}

if (!userId) {
  process.exit(1);
}

console.log("\n3. profiles upsert...");
const profile = await supabase.from("profiles").upsert(
  { id: userId, email, role: "expert", full_name: `${firstName} ${lastName}` },
  { onConflict: "id" },
);
console.log("profile:", profile.error?.message ?? "ok", profile.error?.code, profile.error?.details);

console.log("\n4. experts upsert full...");
const full = await supabase.from("experts").upsert(
  {
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    is_active: false,
    review_status: "pending_review",
    wants_certification: false,
    references: [{ _type: "edge_registration_meta" }],
  },
  { onConflict: "id" },
);
console.log("experts full:", full.error?.message ?? "ok", full.error?.code, full.error?.hint);

if (full.error) {
  console.log("\n5. experts upsert minimal...");
  const minimal = await supabase.from("experts").upsert(
    { id: userId, email, first_name: firstName, last_name: lastName },
    { onConflict: "id" },
  );
  console.log("experts minimal:", minimal.error?.message ?? "ok", minimal.error?.code);
}

console.log("\n6. generateLink...");
const link = await supabase.auth.admin.generateLink({
  type: "signup",
  email,
  options: { redirectTo },
});
console.log("link:", link.error?.message ?? "ok", Boolean(link.data?.properties?.action_link));

console.log("\nDone userId:", userId);
