import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyTestResults,
  loadEmployeeTestResults,
  type EmployeeTestResults,
} from "@/lib/entreprise/employee-profile-diagnostics";
import {
  collectEmployeeProfileCandidates,
  resolveAndLinkEmployeeProfile,
} from "@/lib/entreprise/resolve-employee-profile";

export type EmployeeRowLite = {
  id: string;
  email?: string | null;
  profile_id?: string | null;
  company_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type EmployeeTestStatus = {
  profile_id: string | null;
  test_results: EmployeeTestResults;
  has_disc: boolean;
  has_idmc: boolean;
  has_soft_skills: boolean;
  /** Au moins un test complété */
  diagnostic_done: boolean;
  /** DISC + IDMC + soft skills */
  all_tests_done: boolean;
  idmc_score: number | null;
};

function emptyTests(): EmployeeTestResults {
  return { disc: null, idmc_score: null, idmc_axes: null, soft_skills: [], updated_at: null };
}

export function buildTestStatus(results: EmployeeTestResults, profileId: string | null): EmployeeTestStatus {
  const has_disc = Boolean(results.disc);
  const has_idmc = Boolean(
    (results.idmc_score != null && results.idmc_score > 0) ||
      (results.idmc_axes && Object.values(results.idmc_axes).some((v) => v > 0)),
  );
  const has_soft_skills = results.soft_skills.length > 0;
  return {
    profile_id: profileId,
    test_results: results,
    has_disc,
    has_idmc,
    has_soft_skills,
    diagnostic_done: has_disc || has_idmc || has_soft_skills,
    all_tests_done: has_disc && has_idmc && has_soft_skills,
    idmc_score: results.idmc_score,
  };
}

/** Trouve le profil avec tests et lie l'employé. */
export async function resolveEmployeeTestStatus(
  service: SupabaseClient,
  employee: EmployeeRowLite,
): Promise<EmployeeTestStatus> {
  const candidates = await collectEmployeeProfileCandidates(service, employee);

  for (const profileId of candidates) {
    const results = await loadEmployeeTestResults(service, profileId);
    if (hasAnyTestResults(results)) {
      await resolveAndLinkEmployeeProfile(service, { ...employee, profile_id: profileId }, profileId);
      return buildTestStatus(results, profileId);
    }
  }

  const fallbackId = candidates[0] ?? null;
  if (fallbackId) {
    await resolveAndLinkEmployeeProfile(service, employee, fallbackId);
    const results = await loadEmployeeTestResults(service, fallbackId);
    return buildTestStatus(results, fallbackId);
  }

  return buildTestStatus(emptyTests(), null);
}

/** Assure une équipe par défaut pour l'organisation (requis par collaborateur_diagnostics). */
export async function ensureDefaultEquipeId(
  service: SupabaseClient,
  organisationId: string,
): Promise<string | null> {
  const { data: existing } = await service
    .from("equipes")
    .select("id")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return String(existing.id);

  const { data: created, error } = await service
    .from("equipes")
    .insert({ organisation_id: organisationId, name: "Équipe principale" })
    .select("id")
    .single();

  if (error) {
    console.warn("[ensureDefaultEquipeId]", error.message);
    return null;
  }
  return String(created.id);
}

function discDominantLetter(disc: NonNullable<EmployeeTestResults["disc"]>): "D" | "I" | "S" | "C" {
  const entries = Object.entries(disc) as Array<["D" | "I" | "S" | "C", number]>;
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "S";
}

/** Synchronise collaborateur_diagnostics depuis les tests profil (vue entreprise). */
export async function syncCollaborateurDiagnosticFromTests(
  service: SupabaseClient,
  employee: EmployeeRowLite,
  organisationId: string,
  status: EmployeeTestStatus,
): Promise<void> {
  if (!status.profile_id || !status.diagnostic_done) return;

  const equipeId = await ensureDefaultEquipeId(service, organisationId);
  if (!equipeId) return;

  const stress = status.test_results.idmc_axes?.A1 ?? null;
  const row: Record<string, unknown> = {
    collaborateur_id: status.profile_id,
    equipe_id: equipeId,
    organisation_id: organisationId,
    employee_id: employee.id,
    idmc_score: status.idmc_score,
    stress_score: stress,
    disc_profil: status.test_results.disc ? discDominantLetter(status.test_results.disc) : null,
    actif: true,
    completed_at: status.all_tests_done
      ? status.test_results.updated_at ?? new Date().toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await service.from("collaborateur_diagnostics").upsert(row, {
    onConflict: "collaborateur_id",
  });
  if (error) {
    console.warn("[syncCollaborateurDiagnosticFromTests]", error.message);
  }

  await service
    .from("employees")
    .update({ profile_id: status.profile_id, equipe_id: equipeId })
    .eq("id", employee.id);
}
