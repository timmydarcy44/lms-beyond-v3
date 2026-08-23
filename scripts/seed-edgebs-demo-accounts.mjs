/**
 * Crée les comptes démo EDGE Business + organisation + mocks DB.
 *
 * Usage:
 *   node -r dotenv/config scripts/seed-edgebs-demo-accounts.mjs dotenv_config_path=.env.local
 *
 * Comptes:
 *   demo@edgebs.fr            → RH entreprise (dashboard/entreprise)
 *   demoentreprise@edgebs.fr  → RH entreprise (dashboard/entreprise)
 *   demosalarie@edgebs.fr     → salarié (dashboard/salarie)
 * Mot de passe: Timmydarcy-14
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
config({ path: ".env" });

/** Aligné avec src/lib/entreprise/edgebs-demo-data.ts */
export const EDGEBS_DEMO_ORG_ID = "e7b5c4d2-8a1f-4e3b-9c6d-2f0a8b7e5d41";
const ORG_NAME = "EDGE Business Demo";
const ORG_SLUG = "edge-business-demo";
const PASSWORD = process.env.EDGEBS_DEMO_PASSWORD?.trim() || "Timmydarcy-14";

const ACCOUNTS = [
  {
    email: "demo@edgebs.fr",
    first_name: "Demo",
    last_name: "EDGE",
    role: "entreprise",
    role_type: "entreprise",
    membership_role: "admin",
    job_title: "Directeur Associé",
    department: "Direction",
  },
  {
    email: "demoentreprise@edgebs.fr",
    first_name: "Camille",
    last_name: "RH",
    role: "entreprise",
    role_type: "admin_hr",
    membership_role: "admin",
    job_title: "Responsable RH",
    department: "Ressources Humaines",
  },
  {
    email: "demosalarie@edgebs.fr",
    first_name: "Alex",
    last_name: "Martin",
    role: "salarie",
    role_type: "salarie",
    membership_role: "learner",
    job_title: "Account Manager",
    department: "Sales",
  },
];

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
  for (let page = 1; page <= 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const match = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser(account) {
  const fullName = `${account.first_name} ${account.last_name}`;
  let userId = await findUserIdByEmail(account.email);
  const metadata = {
    first_name: account.first_name,
    last_name: account.last_name,
    full_name: fullName,
    company_name: ORG_NAME,
    role_type: account.role_type,
    account_type: account.role === "salarie" ? "salarie" : "entreprise",
    signup_source: "edgebs_demo",
    needs_password_setup: false,
  };

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(`updateUser ${account.email}: ${error.message}`);
    console.log("Updated auth:", account.email, userId);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) throw new Error(`createUser ${account.email}: ${error?.message}`);
    userId = data.user.id;
    console.log("Created auth:", account.email, userId);
  }
  return userId;
}

async function ensureOrg() {
  const { data: byId } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", EDGEBS_DEMO_ORG_ID)
    .maybeSingle();

  if (byId?.id) {
    await supabase
      .from("organizations")
      .update({
        name: ORG_NAME,
        slug: ORG_SLUG,
        onboarding_step: "account_activated",
        edge_profile_completed: true,
      })
      .eq("id", EDGEBS_DEMO_ORG_ID);
    console.log("Org exists:", EDGEBS_DEMO_ORG_ID);
    return EDGEBS_DEMO_ORG_ID;
  }

  const { data: bySlug } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();

  if (bySlug?.id) {
    console.log("Org by slug (using existing id):", bySlug.id);
    console.warn(
      "WARNING: existing slug org id differs from EDGEBS_DEMO_ORG_ID constant — update edgebs-demo-data.ts if needed:",
      bySlug.id,
    );
    return bySlug.id;
  }

  const { error } = await supabase.from("organizations").insert({
    id: EDGEBS_DEMO_ORG_ID,
    name: ORG_NAME,
    slug: ORG_SLUG,
    onboarding_step: "account_activated",
    edge_profile_completed: true,
  });

  if (error) {
    // fallback without fixed id
    const { data, error: e2 } = await supabase
      .from("organizations")
      .insert({
        name: ORG_NAME,
        slug: ORG_SLUG,
        onboarding_step: "account_activated",
        edge_profile_completed: true,
      })
      .select("id")
      .single();
    if (e2 || !data?.id) throw new Error(`org insert: ${error.message} / ${e2?.message}`);
    console.warn("Org created with generated id — update EDGEBS_ORG_ID:", data.id);
    return data.id;
  }

  console.log("Created org:", EDGEBS_DEMO_ORG_ID);
  return EDGEBS_DEMO_ORG_ID;
}

async function upsertProfile(userId, account, orgId) {
  const fullName = `${account.first_name} ${account.last_name}`;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: account.email,
      first_name: account.first_name,
      last_name: account.last_name,
      full_name: fullName,
      role: account.role,
      role_type: account.role_type,
      company_id: orgId,
      entreprise: ORG_NAME,
      poste_actuel: account.job_title,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`profile ${account.email}: ${error.message}`);
}

async function upsertMembership(userId, orgId, role) {
  const { error } = await supabase.from("org_memberships").upsert(
    { org_id: orgId, user_id: userId, role },
    { onConflict: "org_id,user_id" },
  );
  if (error) {
    // try without onConflict
    const { data: existing } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) {
      const { error: e2 } = await supabase.from("org_memberships").insert({
        org_id: orgId,
        user_id: userId,
        role,
      });
      if (e2) throw new Error(`membership: ${e2.message}`);
    }
  }
}

async function upsertEmployee(userId, account, orgId) {
  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", orgId)
    .eq("email", account.email)
    .maybeSingle();

  const row = {
    company_id: orgId,
    profile_id: userId,
    email: account.email,
    first_name: account.first_name,
    last_name: account.last_name,
    job_title: account.job_title,
    department: account.department,
  };

  if (existing?.id) {
    await supabase.from("employees").update(row).eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({ id: randomUUID(), ...row })
    .select("id")
    .single();
  if (error) {
    console.warn("employees insert skipped:", error.message);
    return null;
  }
  return data?.id ?? null;
}

async function main() {
  const orgId = await ensureOrg();
  const created = [];

  for (const account of ACCOUNTS) {
    const userId = await ensureAuthUser(account);
    await upsertProfile(userId, account, orgId);
    await upsertMembership(userId, orgId, account.membership_role);
    const employeeId = await upsertEmployee(userId, account, orgId);
    created.push({ ...account, userId, employeeId });
  }

  console.log("\n=== Comptes démo EDGE Business ===");
  console.log("Organisation:", ORG_NAME, orgId);
  console.log("Mot de passe:", PASSWORD);
  for (const c of created) {
    console.log(`- ${c.email} → ${c.role} (${c.userId})`);
  }
  console.log("\nLogin:");
  console.log("  RH: /entreprises/connexion ou /login → /dashboard/entreprise");
  console.log("  Salarié: /login → /dashboard/salarie");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
