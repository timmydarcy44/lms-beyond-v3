import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyTestResults,
  loadEmployeeTestResults,
} from "@/lib/entreprise/employee-profile-diagnostics";
import type { EmployeeRowLite } from "@/lib/entreprise/employee-test-status";

const ORPHAN_EMAIL_PATTERNS = [
  /^praticien@/i,
  /^demo@entreprise\./i,
  /^admin@/i,
];

function isLikelyOrphanTestAccount(email: string | null | undefined): boolean {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return ORPHAN_EMAIL_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Déplace DISC / IDMC / soft skills d'un profil vers le profil collaborateur cible. */
export async function transferTestResultsBetweenProfiles(
  service: SupabaseClient,
  fromProfileId: string,
  toProfileId: string,
): Promise<boolean> {
  if (!fromProfileId || !toProfileId || fromProfileId === toProfileId) return false;

  const source = await loadEmployeeTestResults(service, fromProfileId);
  if (!hasAnyTestResults(source)) return false;

  let moved = false;

  if (source.disc) {
    const { data: discRow } = await service
      .from("disc_resultats")
      .select("scores, updated_at")
      .eq("profile_id", fromProfileId)
      .maybeSingle();
    if (discRow) {
      const { error: upsertErr } = await service.from("disc_resultats").upsert(
        { profile_id: toProfileId, scores: discRow.scores, updated_at: discRow.updated_at },
        { onConflict: "profile_id" },
      );
      if (!upsertErr) {
        await service.from("disc_resultats").delete().eq("profile_id", fromProfileId);
        moved = true;
      }
    }
  }

  if (source.idmc_score != null || source.idmc_axes) {
    const { data: idmcRow } = await service
      .from("idmc_resultats")
      .select("global_score, scores, responses, updated_at")
      .eq("profile_id", fromProfileId)
      .maybeSingle();
    if (idmcRow) {
      const { error: upsertErr } = await service.from("idmc_resultats").upsert(
        {
          profile_id: toProfileId,
          global_score: idmcRow.global_score,
          scores: idmcRow.scores,
          responses: idmcRow.responses,
          updated_at: idmcRow.updated_at,
        },
        { onConflict: "profile_id" },
      );
      if (!upsertErr) {
        await service.from("idmc_resultats").delete().eq("profile_id", fromProfileId);
        moved = true;
      }
    }
  }

  if (source.soft_skills.length > 0) {
    const { data: softRow } = await service
      .from("soft_skills_resultats")
      .select("answers, scores, total_score, taken_at")
      .eq("learner_id", fromProfileId)
      .maybeSingle();
    if (softRow) {
      const { error: upsertErr } = await service.from("soft_skills_resultats").upsert(
        {
          learner_id: toProfileId,
          answers: softRow.answers,
          scores: softRow.scores,
          total_score: softRow.total_score,
          taken_at: softRow.taken_at,
        },
        { onConflict: "learner_id" },
      );
      if (!upsertErr) {
        await service.from("soft_skills_resultats").delete().eq("learner_id", fromProfileId);
        moved = true;
      }
    }
  }

  return moved;
}

/**
 * Si les tests ont été passés sur un compte « praticien » ou autre profil orphelin,
 * les rattache au collaborateur (ex. Jessica sur j.contentin@laposte.net).
 */
export async function reclaimOrphanTestsForEmployee(
  service: SupabaseClient,
  employee: EmployeeRowLite,
  targetProfileId: string,
): Promise<boolean> {
  const targetResults = await loadEmployeeTestResults(service, targetProfileId);
  if (hasAnyTestResults(targetResults)) return false;

  const { data: orgEmployees } = await service
    .from("employees")
    .select("profile_id")
    .eq("company_id", employee.company_id ?? "");
  const linkedProfileIds = new Set(
    (orgEmployees ?? [])
      .map((row) => String(row.profile_id ?? "").trim())
      .filter(Boolean),
  );

  const orphanCandidates: string[] = [];

  for (const table of ["disc_resultats", "idmc_resultats"] as const) {
    const { data: rows } = await service.from(table).select("profile_id").limit(200);
    for (const row of rows ?? []) {
      const pid = String(row.profile_id ?? "").trim();
      if (!pid || pid === targetProfileId || linkedProfileIds.has(pid)) continue;
      if (!orphanCandidates.includes(pid)) orphanCandidates.push(pid);
    }
  }

  const { data: softRows } = await service.from("soft_skills_resultats").select("learner_id").limit(200);
  for (const row of softRows ?? []) {
    const pid = String(row.learner_id ?? "").trim();
    if (!pid || pid === targetProfileId || linkedProfileIds.has(pid)) continue;
    if (!orphanCandidates.includes(pid)) orphanCandidates.push(pid);
  }

  for (const orphanId of orphanCandidates) {
    const orphanResults = await loadEmployeeTestResults(service, orphanId);
    if (!hasAnyTestResults(orphanResults)) continue;

    const { data: orphanProfile } = await service
      .from("profiles")
      .select("email, company_id")
      .eq("id", orphanId)
      .maybeSingle();

    const orphanEmail = orphanProfile?.email as string | null | undefined;
    const orphanCompanyId = orphanProfile?.company_id as string | null | undefined;
    const sameOrg =
      orphanCompanyId && employee.company_id
        ? orphanCompanyId === employee.company_id
        : false;

    if (!sameOrg && !isLikelyOrphanTestAccount(orphanEmail)) continue;

    const transferred = await transferTestResultsBetweenProfiles(service, orphanId, targetProfileId);
    if (transferred) {
      console.info(
        `[reclaimOrphanTestsForEmployee] ${employee.id}: tests transférés ${orphanId} → ${targetProfileId}`,
      );
      return true;
    }
  }

  return false;
}
