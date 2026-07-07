/**
 * Vérifie que le chemin léger overview (sans resolveEmployeeTestStatus) répond vite.
 * Usage: node scripts/verify-overview-light.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const NUTRISET_ORG_ID = "163c8e74-b648-4792-9167-2b4031a888b3";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const t0 = Date.now();

  const [
    { data: org, error: orgErr },
    { data: employees, error: empErr },
    { data: diagnostics, error: diagErr },
  ] = await Promise.all([
    service.from("organizations").select("id, name").eq("id", NUTRISET_ORG_ID).maybeSingle(),
    service
      .from("employees")
      .select("id, first_name, last_name, email, profile_id")
      .eq("company_id", NUTRISET_ORG_ID),
    service
      .from("collaborateur_diagnostics")
      .select("employee_id, collaborateur_id, completed_at, idmc_score")
      .eq("organisation_id", NUTRISET_ORG_ID),
  ]);

  const elapsed = Date.now() - t0;

  if (orgErr || empErr || diagErr) {
    console.error({ orgErr, empErr, diagErr });
    process.exit(1);
  }

  const diagByEmp = new Map();
  for (const row of diagnostics ?? []) {
    if (row.employee_id) diagByEmp.set(row.employee_id, row);
  }

  let withStatus = 0;
  for (const emp of employees ?? []) {
    const diag = diagByEmp.get(emp.id);
    const profileId = emp.profile_id ?? diag?.collaborateur_id ?? null;
    if (profileId || diag) withStatus++;
  }

  const result = {
    ok: true,
    org: org?.name ?? null,
    employees_count: employees?.length ?? 0,
    diagnostics_count: diagnostics?.length ?? 0,
    employees_with_status: withStatus,
    elapsed_ms: elapsed,
    under_3s: elapsed < 3000,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.under_3s) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
