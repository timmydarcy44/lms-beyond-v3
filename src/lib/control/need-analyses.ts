export type NeedAnalysisRecommendation = {
  label: string;
  notes: string;
  catalog_course_id?: string | null;
};

export type NeedAnalysisStatus = "draft" | "complete";

export type NeedAnalysisPlaceMode = "" | "presentiel" | "visio" | "mixte";
export type NeedAnalysisFunding = "" | "opco" | "entreprise" | "mixte" | "inconnu";

/** Champs structurés de prise de notes (récolte besoins). */
export type NeedAnalysisDetails = {
  place: string;
  place_mode: NeedAnalysisPlaceMode;
  duration: string;
  dates: string;
  budget: string;
  funding: NeedAnalysisFunding;
  headcount: string;
  roles: string;
  level: string;
  experience: string;
  audience_notes: string;
  constraints_notes: string;
};

export const EMPTY_NEED_ANALYSIS_DETAILS: NeedAnalysisDetails = {
  place: "",
  place_mode: "",
  duration: "",
  dates: "",
  budget: "",
  funding: "",
  headcount: "",
  roles: "",
  level: "",
  experience: "",
  audience_notes: "",
  constraints_notes: "",
};

export type OrganizationNeedAnalysis = {
  id: string;
  organization_id: string | null;
  deal_id: string | null;
  title: string;
  context_problem: string;
  expected_outcomes: string;
  audience: string;
  constraints: string;
  disability_accommodations: string;
  decided_adaptations: string;
  details: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
  status: NeedAnalysisStatus;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const PLACE_MODE_LABEL: Record<Exclude<NeedAnalysisPlaceMode, "">, string> = {
  presentiel: "Présentiel",
  visio: "Visio",
  mixte: "Mixte",
};

const FUNDING_LABEL: Record<Exclude<NeedAnalysisFunding, "">, string> = {
  opco: "OPCO",
  entreprise: "Entreprise",
  mixte: "Mixte OPCO / entreprise",
  inconnu: "Financement à préciser",
};

export function normalizeNeedAnalysisDetails(raw: unknown): NeedAnalysisDetails {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const placeMode = String(row.place_mode ?? "");
  const funding = String(row.funding ?? "");
  return {
    place: String(row.place ?? "").trim(),
    place_mode:
      placeMode === "presentiel" || placeMode === "visio" || placeMode === "mixte"
        ? placeMode
        : "",
    duration: String(row.duration ?? "").trim(),
    dates: String(row.dates ?? "").trim(),
    budget: String(row.budget ?? "").trim(),
    funding:
      funding === "opco" || funding === "entreprise" || funding === "mixte" || funding === "inconnu"
        ? funding
        : "",
    headcount: String(row.headcount ?? "").trim(),
    roles: String(row.roles ?? "").trim(),
    level: String(row.level ?? "").trim(),
    experience: String(row.experience ?? "").trim(),
    audience_notes: String(row.audience_notes ?? "").trim(),
    constraints_notes: String(row.constraints_notes ?? "").trim(),
  };
}

export function composeAudienceText(details: NeedAnalysisDetails, fallback = "") {
  const lines = [
    details.headcount ? `Effectif : ${details.headcount}` : null,
    details.roles ? `Postes : ${details.roles}` : null,
    details.level ? `Niveau : ${details.level}` : null,
    details.experience ? `Expérience : ${details.experience}` : null,
    details.audience_notes || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : fallback.trim();
}

export function composeConstraintsText(details: NeedAnalysisDetails, fallback = "") {
  const lines = [
    details.place_mode ? `Modalité : ${PLACE_MODE_LABEL[details.place_mode]}` : null,
    details.place ? `Lieu : ${details.place}` : null,
    details.duration ? `Durée : ${details.duration}` : null,
    details.dates ? `Dates / période : ${details.dates}` : null,
    details.budget ? `Budget : ${details.budget}` : null,
    details.funding ? `Financement : ${FUNDING_LABEL[details.funding]}` : null,
    details.constraints_notes || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : fallback.trim();
}

export function isNeedAnalysisComplete(input: {
  context_problem?: string | null;
  expected_outcomes?: string | null;
  audience?: string | null;
  constraints?: string | null;
  disability_accommodations?: string | null;
  decided_adaptations?: string | null;
  details?: NeedAnalysisDetails | null;
}) {
  const details = input.details ?? EMPTY_NEED_ANALYSIS_DETAILS;
  const audience = composeAudienceText(details, input.audience ?? "");
  const constraints = composeConstraintsText(details, input.constraints ?? "");
  return (
    String(input.context_problem ?? "").trim().length > 0 &&
    String(input.expected_outcomes ?? "").trim().length > 0 &&
    audience.length > 0 &&
    constraints.length > 0 &&
    String(input.disability_accommodations ?? "").trim().length > 0 &&
    String(input.decided_adaptations ?? "").trim().length > 0
  );
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
  const details = normalizeNeedAnalysisDetails(row.details);
  return {
    id: String(row.id),
    organization_id: row.organization_id ? String(row.organization_id) : null,
    deal_id: row.deal_id ? String(row.deal_id) : null,
    title: String(row.title ?? ""),
    context_problem: String(row.context_problem ?? ""),
    expected_outcomes: String(row.expected_outcomes ?? ""),
    audience: String(row.audience ?? "") || composeAudienceText(details),
    constraints: String(row.constraints ?? "") || composeConstraintsText(details),
    disability_accommodations: String(row.disability_accommodations ?? ""),
    decided_adaptations: String(row.decided_adaptations ?? ""),
    details,
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
  details?: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
}) {
  const details = analysis.details ?? EMPTY_NEED_ANALYSIS_DETAILS;
  const audience = composeAudienceText(details, analysis.audience);
  const constraints = composeConstraintsText(details, analysis.constraints);
  const lines = [
    analysis.title.trim() ? `Titre : ${analysis.title.trim()}` : null,
    analysis.context_problem.trim()
      ? `Contexte et problème :\n${analysis.context_problem.trim()}`
      : null,
    analysis.expected_outcomes.trim()
      ? `Résultats attendus :\n${analysis.expected_outcomes.trim()}`
      : null,
    audience ? `Public :\n${audience}` : null,
    constraints ? `Contraintes :\n${constraints}` : null,
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
  "id, organization_id, deal_id, title, context_problem, expected_outcomes, audience, constraints, disability_accommodations, decided_adaptations, details, recommendations, status, completed_at, created_by, updated_by, created_at, updated_at";

/** Payload commun create/update — compose audience/constraints depuis details. */
export function buildNeedAnalysisWritePayload(body: Record<string, unknown>) {
  const details = normalizeNeedAnalysisDetails(body.details);
  const context_problem = String(body.context_problem ?? "").trim();
  const expected_outcomes = String(body.expected_outcomes ?? "").trim();
  const disability_accommodations = String(body.disability_accommodations ?? "").trim();
  const decided_adaptations = String(body.decided_adaptations ?? "").trim();
  const audience = composeAudienceText(details, String(body.audience ?? ""));
  const constraints = composeConstraintsText(details, String(body.constraints ?? ""));
  const recommendations = normalizeRecommendations(body.recommendations);
  return {
    details,
    context_problem,
    expected_outcomes,
    audience,
    constraints,
    disability_accommodations,
    decided_adaptations,
    recommendations,
  };
}
