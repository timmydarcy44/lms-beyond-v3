import type { SupabaseClient } from "@supabase/supabase-js";

export type EmployeeDiagnosticPayload = {
  id: string;
  employee_id: string;
  created_at: string;
  idmc_score: number | null;
  results: Partial<
    Record<"stress" | "organisation" | "communication" | "decision" | "leadership", number>
  > | null;
  source?: "collaborateur_diagnostics" | "idmc_resultats";
};

export function diagnosticsHaveData(rows: EmployeeDiagnosticPayload[]): boolean {
  return rows.some((d) => {
    if (d.idmc_score != null && d.idmc_score > 0) return true;
    const r = d.results ?? {};
    return Object.values(r).some((v) => typeof v === "number" && v > 0);
  });
}

/** Charge les résultats IDMC du profil apprenant lié au collaborateur. */
export async function loadProfileIdmcDiagnostic(
  service: SupabaseClient,
  profileId: string,
  employeeId: string,
): Promise<EmployeeDiagnosticPayload | null> {
  const { data: idmcRow } = await service
    .from("idmc_resultats")
    .select("global_score, scores, responses, updated_at, created_at")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!idmcRow) return null;

  const scores = (idmcRow.scores ?? idmcRow.responses) as Record<string, unknown> | null;
  const global =
    typeof idmcRow.global_score === "number"
      ? idmcRow.global_score
      : scores && typeof scores === "object"
        ? Math.round(
            Object.values(scores)
              .filter((v): v is number => typeof v === "number")
              .reduce((s, v, _, arr) => s + v / arr.length, 0),
          )
        : null;

  if (global == null || global <= 0) return null;

  const results: EmployeeDiagnosticPayload["results"] = {};
  if (scores && typeof scores === "object") {
    const s = scores as Record<string, number>;
    if (typeof s.stress === "number") results.stress = s.stress;
    if (typeof s.organisation === "number") results.organisation = s.organisation;
    if (typeof s.communication === "number") results.communication = s.communication;
    if (typeof s.decision === "number") results.decision = s.decision;
    if (typeof s.leadership === "number") results.leadership = s.leadership;
  }

  return {
    id: `idmc-${profileId}`,
    employee_id: employeeId,
    created_at: String(idmcRow.updated_at ?? idmcRow.created_at ?? new Date().toISOString()),
    idmc_score: global,
    results: Object.keys(results).length > 0 ? results : null,
    source: "idmc_resultats",
  };
}
