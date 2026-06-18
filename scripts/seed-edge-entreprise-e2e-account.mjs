/**
 * Crée un compte entreprise EDGE prêt pour test E2E (email confirmé, profil entreprise, overlay en attente).
 *
 * Usage:
 *   node -r dotenv/config scripts/seed-edge-entreprise-e2e-account.mjs dotenv_config_path=.env.local
 *
 * Compte par défaut:
 *   Email: edge-e2e-entreprise@edgebs.fr
 *   Mot de passe: EdgeE2E-Entreprise2026!
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

function generateOrgSlug(name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "org"}-${Math.random().toString(36).slice(2, 6)}`;
}

const TEST_EMAIL = process.env.EDGE_E2E_ENTREPRISE_EMAIL?.trim() || "edge-e2e-entreprise@edgebs.fr";
const TEST_PASSWORD = process.env.EDGE_E2E_ENTREPRISE_PASSWORD?.trim() || "EdgeE2E-Entreprise2026!";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  for (let page = 1; page <= 10; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const match = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId = await findUserIdByEmail(TEST_EMAIL);

  if (userId) {
    await supabase.auth.admin.updateUserById(userId, {
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: "Camille",
        last_name: "Test",
        full_name: "Camille Test",
        company_name: "EDGE Demo RH",
        role_type: "entreprise",
        account_type: "entreprise",
        signup_source: "edge_entreprises",
        needs_password_setup: false,
      },
    });
    console.log("Updated existing auth user:", userId);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: "Camille",
        last_name: "Test",
        full_name: "Camille Test",
        company_name: "EDGE Demo RH",
        role_type: "entreprise",
        account_type: "entreprise",
        signup_source: "edge_entreprises",
        trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        needs_password_setup: false,
      },
    });
    if (error || !data.user) {
      console.error("createUser failed:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Created auth user:", userId);
  }

  const orgSlug = generateOrgSlug("EDGE Demo RH");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: "EDGE Demo RH",
      slug: orgSlug,
      onboarding_step: "account_activated",
      edge_profile_completed: false,
    })
    .select("id")
    .single();

  let orgId = org?.id;
  if (orgError) {
    const { data: existingOrg } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    orgId = existingOrg?.company_id ?? null;
    if (!orgId) {
      const fallback = await supabase
        .from("organizations")
        .insert({ name: "EDGE Demo RH", slug: orgSlug })
        .select("id")
        .single();
      orgId = fallback.data?.id ?? null;
    }
  }

  if (!orgId) {
    console.error("Could not resolve organization id");
    process.exit(1);
  }

  await supabase.from("profiles").upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      first_name: "Camille",
      last_name: "Test",
      full_name: "Camille Test",
      role: "entreprise",
      role_type: "entreprise",
      company_id: orgId,
      entreprise: "EDGE Demo RH",
    },
    { onConflict: "id" },
  );

  await supabase.from("org_memberships").upsert(
    { org_id: orgId, user_id: userId, role: "admin" },
    { onConflict: "org_id,user_id" },
  );

  try {
    await supabase.from("organizations").update({ edge_profile_completed: false }).eq("id", orgId);
  } catch {
    /* column may be missing until migration applied */
  }

  console.log("\n=== Compte test entreprise EDGE ===");
  console.log("Email:", TEST_EMAIL);
  console.log("Mot de passe:", TEST_PASSWORD);
  console.log("Organisation:", orgId);
  console.log("\nParcours E2E:");
  console.log("1. /entreprises/connexion → inscription OU login avec ce compte");
  console.log("2. Si inscription fresh: email → set-password → /dashboard/entreprise → overlay");
  console.log("3. Overlay → /onboarding/" + orgId);
  console.log("4. Stepper → invite collabs → /dashboard/entreprise");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
