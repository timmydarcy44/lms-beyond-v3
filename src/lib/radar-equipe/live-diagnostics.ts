import type { SupabaseClient } from "@supabase/supabase-js";

/** Collaborateurs de l'organisation qui ont terminé les trois tests (DISC, IDMC, soft skills). */
export async function countCompletedEmployeeDiagnostics(
  service: SupabaseClient,
  organisationId: string,
): Promise<number> {
  const { data: employees, error } = await service
    .from("employees")
    .select("profile_id")
    .eq("company_id", organisationId)
    .limit(500);
  if (error || !employees?.length) return 0;

  const profileIds = [
    ...new Set(
      employees
        .map((row) => String((row as { profile_id?: string | null }).profile_id ?? "").trim())
        .filter(Boolean),
    ),
  ];
  if (!profileIds.length) return 0;

  const [disc, idmc, softLearner, softEmployee] = await Promise.all([
    service.from("disc_resultats").select("profile_id").in("profile_id", profileIds),
    service.from("idmc_resultats").select("profile_id").in("profile_id", profileIds),
    service.from("soft_skills_resultats").select("learner_id").in("learner_id", profileIds),
    service.from("soft_skills_resultats_salarie").select("learner_id").in("learner_id", profileIds),
  ]);

  const discIds = new Set((disc.data ?? []).map((row) => String(row.profile_id)));
  const idmcIds = new Set((idmc.data ?? []).map((row) => String(row.profile_id)));
  const softIds = new Set([
    ...(softLearner.data ?? []).map((row) => String(row.learner_id)),
    ...(softEmployee.data ?? []).map((row) => String(row.learner_id)),
  ]);

  return profileIds.filter((id) => discIds.has(id) && idmcIds.has(id) && softIds.has(id)).length;
}
