export const ABSENCE_STATUSES = ["to_justify", "proof_sent", "justified", "refused"] as const;
export type AbsenceStatus = (typeof ABSENCE_STATUSES)[number];

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  to_justify: "À justifier",
  proof_sent: "Justificatif envoyé",
  justified: "Justifiée",
  refused: "Refusée",
};

export const ABSENCE_KINDS = ["full", "late", "early_leave", "partial"] as const;
export type AbsenceKind = (typeof ABSENCE_KINDS)[number];

export const ABSENCE_KIND_LABELS: Record<AbsenceKind, string> = {
  full: "Absence complète",
  late: "Retard",
  early_leave: "Départ anticipé",
  partial: "Absence partielle",
};

export const ABSENCE_PROOF_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export function isAllowedAbsenceProof(mime: string, filename: string) {
  const m = mime.toLowerCase();
  if ((ABSENCE_PROOF_MIME as readonly string[]).includes(m)) return true;
  const ext = filename.toLowerCase().split(".").pop();
  return ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png";
}

export type AbsenceSummary = {
  hours: number;
  count: number;
  toJustify: number;
};

export function summarizeAbsences(
  rows: Array<{ duration_hours?: number | null; status?: string | null }>,
): AbsenceSummary {
  let hours = 0;
  let toJustify = 0;
  for (const r of rows) {
    hours += Number(r.duration_hours ?? 0);
    if (r.status === "to_justify" || r.status === "refused") toJustify += 1;
  }
  return {
    hours: Math.round(hours * 100) / 100,
    count: rows.length,
    toJustify,
  };
}
