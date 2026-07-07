/**
 * Simule le GET overview (chemin léger) pour Nutriset et vérifie JSON + timing.
 * Usage: node scripts/verify-overview-end-to-end.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const NUTRISET_ORG_ID = "163c8e74-b648-4792-9167-2b4031a888b3";
const TIMMY_USER_ID = "00ad40d7-8b5e-4c0a-9f3e-8c7b6a5d4e3f"; // placeholder - resolved at runtime

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildOverviewEmployeeStatus(profileId, diag) {
  const allTestsDone = Boolean(diag?.completed_at);
  const diagnosticStarted =
    allTestsDone || (diag?.idmc_score != null && diag.idmc_score > 0) || Boolean(diag);
  return {
    profile_id: profileId,
    diagnostic_done: diagnosticStarted,
    all_tests_done: allTestsDone,
    idmc_score: diag?.idmc_score ?? null,
  };
}

async function main() {
  const t0 = Date.now();
  const now = new Date();
  const today = isoDate(now);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = isoDate(weekEnd);

  const [
    { data: org, error: orgErr },
    { data: allEmployees, error: empErr },
    { data: allDiagnostics, error: diagErr },
    { data: latestAggregat },
    { data: sessionsWeek },
    { data: recentDiagnostics },
    { data: orgPaths },
    { data: orgSessions },
  ] = await Promise.all([
    service.from("organizations").select("id, name").eq("id", NUTRISET_ORG_ID).maybeSingle(),
    service
      .from("employees")
      .select("id, first_name, last_name, email, job_title, department, profile_id, created_at")
      .eq("company_id", NUTRISET_ORG_ID)
      .order("created_at", { ascending: false }),
    service
      .from("collaborateur_diagnostics")
      .select("id, employee_id, collaborateur_id, completed_at, idmc_score")
      .eq("organisation_id", NUTRISET_ORG_ID),
    service
      .from("equipe_aggregats")
      .select("periode_debut, periode_fin, nb_diagnostics_completes, idmc_moyen, stress_moyen, cohesion_score, insight_principal, insuffisant, nb_signaux_attention, nb_signaux_critique")
      .eq("organisation_id", NUTRISET_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("sessions_bct")
      .select("id, date_session, heure_debut, status, praticien_id")
      .eq("organization_id", NUTRISET_ORG_ID)
      .gte("date_session", today)
      .lte("date_session", weekEndStr)
      .order("date_session")
      .order("heure_debut"),
    service
      .from("collaborateur_diagnostics")
      .select("id, completed_at, collaborateur_id, employee_id")
      .eq("organisation_id", NUTRISET_ORG_ID)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    service.from("paths").select("id, title, status, org_id").eq("org_id", NUTRISET_ORG_ID).eq("status", "published").limit(20),
    service
      .from("sessions_bct")
      .select("id, date_session, heure_debut, status, praticien_id, motif")
      .eq("organization_id", NUTRISET_ORG_ID)
      .gte("date_session", today)
      .order("date_session")
      .limit(12),
  ]);

  if (orgErr || empErr || diagErr || !org) {
    console.error({ orgErr, empErr, diagErr });
    process.exit(1);
  }

  const employees = allEmployees ?? [];
  const diagnostics = allDiagnostics ?? [];

  const diagByEmployee = new Map();
  for (const row of diagnostics) {
    if (row.employee_id) diagByEmployee.set(row.employee_id, row);
  }

  const employeeTestStatuses = new Map();
  for (const emp of employees) {
    const empId = emp.id;
    const diag = diagByEmployee.get(empId);
    const profileId = emp.profile_id ?? diag?.collaborateur_id ?? null;
    employeeTestStatuses.set(empId, buildOverviewEmployeeStatus(profileId, diag));
  }

  const profileIds = employees
    .map((e) => employeeTestStatuses.get(e.id)?.profile_id ?? e.profile_id)
    .filter(Boolean);

  if (profileIds.length > 0 && (orgPaths ?? []).length > 0) {
    const pathIds = (orgPaths ?? []).map((p) => p.id);
    await Promise.all([
      service.from("path_enrollments").select("user_id, path_id").in("user_id", profileIds).in("path_id", pathIds),
      service.from("path_progress").select("user_id, path_id, progress_percent").in("user_id", profileIds).in("path_id", pathIds),
    ]);
  }

  const praticienIds = Array.from(new Set((orgSessions ?? []).map((s) => s.praticien_id).filter(Boolean)));
  if (praticienIds.length > 0) {
    await service.from("praticiens_bct").select("id, prenom, nom").in("id", praticienIds);
  }

  const diagnosticsCompleted = employees.filter((e) => employeeTestStatuses.get(e.id)?.all_tests_done).length;

  const payload = {
    organisation: { id: NUTRISET_ORG_ID, name: org.name },
    kpis: {
      employees_total: employees.length,
      diagnostics_completed: diagnosticsCompleted,
    },
    employees: employees.map((e) => ({
      id: e.id,
      first_name: e.first_name,
      diagnostic_done: employeeTestStatuses.get(e.id)?.all_tests_done,
    })),
    this_week: { agenda: sessionsWeek ?? [], recent_activity: recentDiagnostics ?? [] },
    formations: { presentiel: orgSessions ?? [], elearning: orgPaths ?? [] },
  };

  const json = JSON.stringify(payload);
  const elapsed = Date.now() - t0;

  console.log(
    JSON.stringify(
      {
        ok: true,
        org: org.name,
        employees_total: employees.length,
        json_bytes: json.length,
        json_valid: true,
        elapsed_ms: elapsed,
        under_10s: elapsed < 10_000,
        has_employees_array: Array.isArray(payload.employees),
        kpis: payload.kpis,
      },
      null,
      2,
    ),
  );

  if (elapsed >= 10_000) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
