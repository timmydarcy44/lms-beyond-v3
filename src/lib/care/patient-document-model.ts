export type CareDocumentKind = "report" | "test_result" | "invoice" | "other";

export type PatientDocumentScore = {
  label: string;
  value: number;
  max: number;
};

export type PatientDocument = {
  id: string;
  kind: CareDocumentKind;
  title: string;
  sharedAt: string;
  openedAt: string | null;
  practitionerName: string;
  hasFile: boolean;
  test: {
    scores: PatientDocumentScore[];
    comment: string;
    commentedAt: string;
    takenAt: string;
  } | null;
};

export const DOCUMENT_KIND_LABEL: Record<CareDocumentKind, string> = {
  report: "Compte rendu",
  test_result: "Résultat de test",
  invoice: "Facture",
  other: "Document",
};

const KINDS = new Set<CareDocumentKind>(["report", "test_result", "invoice", "other"]);

export function asDocumentKind(value: unknown): CareDocumentKind {
  return KINDS.has(value as CareDocumentKind) ? (value as CareDocumentKind) : "other";
}

export function parseDocumentScores(value: unknown): PatientDocumentScore[] {
  if (!Array.isArray(value)) return [];
  const scores: PatientDocumentScore[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? "").replace(/\s+/g, " ").trim();
    const score = Number(row.value);
    const max = Number(row.max);
    if (!label || !Number.isFinite(score) || !Number.isFinite(max) || max <= 0 || score < 0) continue;
    scores.push({ label, value: score, max });
  }
  return scores;
}
