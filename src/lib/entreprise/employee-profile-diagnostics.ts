import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import {
  fetchLatestSoftSkillsResult,
  parseSoftSkillsScoreEntries,
} from "@/lib/soft-skills/resolve-soft-skills-result";

export type EmployeeDiagnosticPayload = {
  id: string;
  employee_id: string;
  created_at: string;
  idmc_score: number | null;
  results: Partial<
    Record<"stress" | "organisation" | "communication" | "decision" | "leadership", number>
  > | null;
  source?: "collaborateur_diagnostics" | "profile_tests";
};

export type EmployeeTestResults = {
  disc: { D: number; I: number; S: number; C: number } | null;
  idmc_score: number | null;
  idmc_axes: Record<string, number> | null;
  soft_skills: Array<{ skill: string; score: number }>;
  updated_at: string | null;
};

function resolveIdmcAxesFromRow(scores: unknown): Record<string, number> | null {
  return resolveIdmcAxes(scores);
}

function averageAxes(axes: Record<string, number> | null): number | null {
  if (!axes) return null;
  const values = Object.values(axes).filter((v): v is number => typeof v === "number" && v > 0);
  if (!values.length) return null;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function parseDiscScores(raw: unknown): EmployeeTestResults["disc"] {
  const parsed = parseStoredDiscScores(raw as Record<string, unknown> | null);
  if (!parsed) return null;
  if (parsed.D + parsed.I + parsed.S + parsed.C <= 0) return null;
  return parsed;
}

function parseSoftSkills(raw: unknown): EmployeeTestResults["soft_skills"] {
  return parseSoftSkillsScoreEntries(raw).slice(0, 10);
}

export function hasAnyTestResults(results: EmployeeTestResults): boolean {
  if (results.disc) return true;
  if (results.idmc_score != null && results.idmc_score > 0) return true;
  if (results.idmc_axes && Object.values(results.idmc_axes).some((v) => v > 0)) return true;
  if (results.soft_skills.length > 0) return true;
  return false;
}

export function diagnosticsHaveData(rows: EmployeeDiagnosticPayload[]): boolean {
  return rows.some((d) => {
    if (d.idmc_score != null && d.idmc_score > 0) return true;
    const r = d.results ?? {};
    return Object.values(r).some((v) => typeof v === "number" && v > 0);
  });
}

/** Charge DISC, IDMC et soft skills depuis le profil apprenant. */
export async function loadEmployeeTestResults(
  service: SupabaseClient,
  profileId: string,
): Promise<EmployeeTestResults> {
  const empty: EmployeeTestResults = {
    disc: null,
    idmc_score: null,
    idmc_axes: null,
    soft_skills: [],
    updated_at: null,
  };

  const [{ data: discRow }, { data: idmcRow }, softRow] = await Promise.all([
    service.from("disc_resultats").select("scores, updated_at").eq("profile_id", profileId).maybeSingle(),
    service
      .from("idmc_resultats")
      .select("global_score, scores, responses, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle(),
    fetchLatestSoftSkillsResult(service, profileId, "scores, taken_at"),
  ]);

  const disc = parseDiscScores(discRow?.scores);
  const idmcRaw = idmcRow?.scores ?? idmcRow?.responses;
  const idmc_axes = resolveIdmcAxesFromRow(idmcRaw);
  const idmc_score =
    typeof idmcRow?.global_score === "number" && idmcRow.global_score > 0
      ? Math.round(idmcRow.global_score)
      : averageAxes(idmc_axes);

  const soft_skills = parseSoftSkills(softRow?.scores);

  const updated_at = String(
    idmcRow?.updated_at ?? discRow?.updated_at ?? softRow?.taken_at ?? "",
  ) || null;

  return { disc, idmc_score, idmc_axes, soft_skills, updated_at };
}

/** Convertit les résultats profil en entrée diagnostic pour la fiche entreprise. */
export function testResultsToDiagnostic(
  results: EmployeeTestResults,
  employeeId: string,
): EmployeeDiagnosticPayload | null {
  if (!hasAnyTestResults(results)) return null;

  const axes = results.idmc_axes ?? {};
  const idmc = results.idmc_score ?? averageAxes(results.idmc_axes) ?? 0;

  const resultsMap: NonNullable<EmployeeDiagnosticPayload["results"]> = {};
  if (typeof axes.A1 === "number" && axes.A1 > 0) resultsMap.stress = axes.A1;
  if (typeof axes.A4 === "number" && axes.A4 > 0) resultsMap.organisation = axes.A4;
  if (typeof axes.A3 === "number" && axes.A3 > 0) resultsMap.communication = axes.A3;
  if (typeof axes.A6 === "number" && axes.A6 > 0) resultsMap.decision = axes.A6;
  if (typeof axes.A2 === "number" && axes.A2 > 0) resultsMap.leadership = axes.A2;

  return {
    id: `profile-tests-${employeeId}`,
    employee_id: employeeId,
    created_at: results.updated_at ?? new Date().toISOString(),
    idmc_score: idmc > 0 ? idmc : null,
    results: Object.keys(resultsMap).length > 0 ? resultsMap : null,
    source: "profile_tests",
  };
}
