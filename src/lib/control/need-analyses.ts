export type NeedAnalysisRecommendation = {
  label: string;
  notes: string;
  catalog_course_id?: string | null;
};

export type NeedAnalysisStatus = "draft" | "complete";

export type OrganizationNeedAnalysis = {
  id: string;
  organization_id: string;
  deal_id: string | null;
  title: string;
  context_problem: string;
  expected_outcomes: string;
  audience: string;
  constraints: string;
  disability_accommodations: string;
  decided_adaptations: string;
  recommendations: NeedAnalysisRecommendation[];
  status: NeedAnalysisStatus;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NeedAnalysisWriteInput = {
  title?: string;
  deal_id?: string | null;
  context_problem?: string;
  expected_outcomes?: string;
  audience?: string;
  constraints?: string;
  disability_accommodations?: string;
  decided_adaptations?: string;
  recommendations?: NeedAnalysisRecommendation[];
  /** Si true, force status complete quand les 6 blocs sont remplis ; sinon draft. */
  markComplete?: boolean;
};

const REQUIRED_FIELDS = [
  "context_problem",
  "expected_outcomes",
  "audience",
  "constraints",
  "disability_accommodations",
  "decided_adaptations",
] as const;

export function isNeedAnalysisComplete(input: {
  context_problem?: string | null;
  expected_outcomes?: string | null;
  audience?: string | null;
  constraints?: string | null;
  disability_accommodations?: string | null;
  decided_adaptations?: string | null;
}) {
  return REQUIRED_FIELDS.every((key) => String(input[key] ?? "").trim().length > 0);
}

export function normalizeRecommendations(raw: unknown): NeedAnalysisRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      return {
        label,
        notes: String(row.notes ?? "").trim(),
        catalog_course_id: row.catalog_course_id ? String(row.catalog_course_id) : null,
      };
    })
    .filter(Boolean) as NeedAnalysisRecommendation[];
}

export function mapNeedAnalysisRow(row: Record<string, unknown>): OrganizationNeedAnalysis {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    deal_id: row.deal_id ? String(row.deal_id) : null,
    title: String(row.title ?? ""),
    context_problem: String(row.context_problem ?? ""),
    expected_outcomes: String(row.expected_outcomes ?? ""),
    audience: String(row.audience ?? ""),
    constraints: String(row.constraints ?? ""),
    disability_accommodations: String(row.disability_accommodations ?? ""),
    decided_adaptations: String(row.decided_adaptations ?? ""),
    recommendations: normalizeRecommendations(row.recommendations),
    status: row.status === "complete" ? "complete" : "draft",
    completed_at: row.completed_at ? String(row.completed_at) : null,
    created_by: row.created_by ? String(row.created_by) : null,
    updated_by: row.updated_by ? String(row.updated_by) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** Brief agrégé pour préremplir Sur-mesure. */
export function needAnalysisToSurMesureBrief(analysis: {
  title: string;
  context_problem: string;
  expected_outcomes: string;
  audience: string;
  constraints: string;
  disability_accommodations: string;
  decided_adaptations: string;
  recommendations: NeedAnalysisRecommendation[];
}) {
  const lines = [
    analysis.title.trim() ? `Titre : ${analysis.title.trim()}` : null,
    analysis.context_problem.trim()
      ? `Contexte et problème :\n${analysis.context_problem.trim()}`
      : null,
    analysis.expected_outcomes.trim()
      ? `Résultats attendus :\n${analysis.expected_outcomes.trim()}`
      : null,
    analysis.audience.trim() ? `Public :\n${analysis.audience.trim()}` : null,
    analysis.constraints.trim() ? `Contraintes :\n${analysis.constraints.trim()}` : null,
    analysis.disability_accommodations.trim()
      ? `Handicap / aménagements :\n${analysis.disability_accommodations.trim()}`
      : null,
    analysis.decided_adaptations.trim()
      ? `Adaptations décidées :\n${analysis.decided_adaptations.trim()}`
      : null,
  ].filter(Boolean);

  if (analysis.recommendations.length) {
    lines.push(
      `Préconisations :\n${analysis.recommendations
        .map((r) => `- ${r.label}${r.notes ? ` — ${r.notes}` : ""}`)
        .join("\n")}`,
    );
  }

  return lines.join("\n\n");
}

export const NEED_ANALYSIS_SURMESURE_STORAGE_KEY = "byound.surmesure.briefFromBesoin";

export const NEED_ANALYSIS_SELECT =
  "id, organization_id, deal_id, title, context_problem, expected_outcomes, audience, constraints, disability_accommodations, decided_adaptations, recommendations, status, completed_at, created_by, updated_by, created_at, updated_at";
