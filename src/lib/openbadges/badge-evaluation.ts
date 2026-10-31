/** Méthodes d'évaluation configurables pour un BadgeClass (Open Badges). */
export const BADGE_EVALUATION_METHODS = [
  { id: "qcm", label: "Questionnaire" },
  { id: "case_study", label: "Étude de cas" },
  { id: "dictation", label: "Réponse orale" },
  { id: "video", label: "Vidéo" },
  { id: "pdf_upload", label: "Document" },
  { id: "playground", label: "Playground IA" },
] as const;

export const PLAYGROUND_DEFAULT_MAX_ATTEMPTS = 2;

export type BadgeEvaluationMethodId = (typeof BADGE_EVALUATION_METHODS)[number]["id"];

const METHOD_LABEL_BY_ID = Object.fromEntries(
  BADGE_EVALUATION_METHODS.map((m) => [m.id, m.label]),
) as Record<BadgeEvaluationMethodId, string>;

export const BADGE_LEVEL_OPTIONS = [1, 2, 3, 4, 5] as const;

export function isBadgeEvaluationMethodId(value: string): value is BadgeEvaluationMethodId {
  return BADGE_EVALUATION_METHODS.some((m) => m.id === value);
}

export function formatEvaluationMethodsSummary(methodIds: string[]): string {
  return methodIds
    .map((id) => (isBadgeEvaluationMethodId(id) ? METHOD_LABEL_BY_ID[id] : id))
    .filter(Boolean)
    .join(", ");
}

/** Affichage org (ex. renommage Byound Lab / EDGE LAB → Byound). */
export function formatOrganizationDisplayName(name: string): string {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (
    key === "byound" ||
    key === "byound lab" ||
    key === "edge lab" ||
    key === "edgelab" ||
    key === "edgebs" ||
    key === "edge"
  ) {
    return "Byound";
  }
  return trimmed;
}
