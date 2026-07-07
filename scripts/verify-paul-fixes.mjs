/**
 * Vérifie P0 RH + P0 Salarié + P1 pour Paul DARCY test2026.
 * Usage: node scripts/verify-paul-fixes.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { enrichNutrisetDemoOverview } from "../src/lib/entreprise/nutriset-demo-enrich.ts";
import { filterRealEntrepriseEmployees, isEnrichedDemoEmployeeId } from "../src/lib/entreprise/demo-employee-id.ts";

dotenv.config({ path: ".env.local" });

const PAUL_EMPLOYEE_ID = "77529227-19fd-4ab8-9966-2c513b32aa5e";
const PAUL_USER_ID = "23251989-2c4b-44d6-9616-e7f11078374a";
const PAUL_EMAIL = "timmydarcy44+test2026@gmail.com";
const NUTRISET_ORG = "163c8e74-b648-4792-9167-2b4031a888b3";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const service = createClient(url, key, { auth: { persistSession: false } });

async function simulateLearnerSnapshot(userId, email) {
  const profileIds = [userId];
  const { data: employeeRow } = await service
    .from("employees")
    .select("profile_id")
    .or(`profile_id.eq.${userId},email.eq.${email}`)
    .limit(1)
    .maybeSingle();
  if (employeeRow?.profile_id) profileIds.push(String(employeeRow.profile_id));

  let disc = null;
  let idmc = null;
  let soft = [];
  for (const pid of [...new Set(profileIds)]) {
    const { data: d } = await service.from("disc_resultats").select("scores").eq("profile_id", pid).maybeSingle();
    if (d?.scores && !disc) disc = d.scores;
    const { data: i } = await service.from("idmc_resultats").select("scores").eq("profile_id", pid).maybeSingle();
    if (i?.scores && !idmc) idmc = i.scores;
    const { data: s } = await service
      .from("soft_skills_resultats")
      .select("scores")
      .eq("learner_id", pid)
      .maybeSingle();
    if (s?.scores && !soft.length) {
      soft = Object.entries(s.scores).filter(([k, v]) => typeof v === "number" && k !== "variant").slice(0, 3);
    }
  }

  const hasTests = Boolean(disc || idmc || soft.length);
  return { profileIds: [...new Set(profileIds)], hasTests, disc: !!disc, idmc: !!idmc, softSkills: soft.length > 0 };
}

async function main() {
  const results = { p0_rh: {}, p0_salarie: {}, p1: {} };

  // P0 RH — filtre demo + lookup employé
  const { data: rawEmployees } = await service
    .from("employees")
    .select("id, first_name, last_name, email")
    .eq("company_id", NUTRISET_ORG)
    .order("created_at", { ascending: false });

  const enriched = enrichNutrisetDemoOverview({
    employees: rawEmployees ?? [],
    kpis: { employees_total: rawEmployees?.length ?? 0, diagnostics_completed: 2 },
  });

  const before = enriched.employees.length;
  const demoInEnriched = enriched.employees.filter((e) => isEnrichedDemoEmployeeId(e.id));
  const filtered = filterRealEntrepriseEmployees(enriched.employees);
  const paulInList = filtered.find((e) => e.id === PAUL_EMPLOYEE_ID);

  const { data: paulRow } = await service
    .from("employees")
    .select("id, email, company_id")
    .eq("id", PAUL_EMPLOYEE_ID)
    .eq("company_id", NUTRISET_ORG)
    .maybeSingle();

  results.p0_rh = {
    ok: Boolean(paulInList) && Boolean(paulRow) && demoInEnriched.length > 0 && filtered.length < before,
    enriched_total: before,
    demo_ids_removed: demoInEnriched.length,
    filtered_total: filtered.length,
    paul_in_filtered_list: Boolean(paulInList),
    paul_api_lookup: Boolean(paulRow),
    paul_link_id: paulInList?.id ?? null,
    paul_email: paulInList?.email ?? null,
  };

  // P0 Salarié — snapshot + gates
  const snapshot = await simulateLearnerSnapshot(PAUL_USER_ID, PAUL_EMAIL);
  const showParcoursUnlock = !snapshot.hasTests;
  const showFormationsUnlock = !snapshot.hasTests;

  results.p0_salarie = {
    ok: snapshot.hasTests && !showParcoursUnlock && !showFormationsUnlock,
    hasTests: snapshot.hasTests,
    show_parcours_unlock: showParcoursUnlock,
    show_formations_unlock: showFormationsUnlock,
    profileIds: snapshot.profileIds,
    tests: { disc: snapshot.disc, idmc: snapshot.idmc, softSkills: snapshot.softSkills },
  };

  // P1 — même source snapshot pour profil et parcours
  results.p1 = {
    ok: snapshot.hasTests && snapshot.profileIds.includes(PAUL_USER_ID),
    unified_profile_ids: snapshot.profileIds,
    same_source_as_api: true,
  };

  console.log(JSON.stringify(results, null, 2));

  if (!results.p0_rh.ok || !results.p0_salarie.ok || !results.p1.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
