export const PROCEDURE_STATUSES = ["draft", "in_review", "validated", "archived"] as const;
export type ProcedureStatus = (typeof PROCEDURE_STATUSES)[number];

export const PROCEDURE_STATUS_LABELS: Record<ProcedureStatus, string> = {
  draft: "Brouillon",
  in_review: "En validation",
  validated: "Validée",
  archived: "Archivée",
};

export type ProcedureStatusTone = "amber" | "blue" | "green" | "red" | "muted";

export function displayProcedureStatus(row: {
  status?: string | null;
  current_version?: string | null;
  next_review_at?: string | null;
}): { label: string; tone: ProcedureStatusTone } {
  const status = (row.status ?? "draft") as ProcedureStatus;
  if (row.next_review_at) {
    const d = new Date(row.next_review_at);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) {
      return { label: "Revue dépassée", tone: "red" };
    }
  }
  if (status === "validated") {
    return { label: `Validée v${row.current_version || "1.0"}`, tone: "green" };
  }
  if (status === "in_review") return { label: "En validation", tone: "blue" };
  if (status === "archived") return { label: "Archivée", tone: "muted" };
  return { label: "Brouillon", tone: "amber" };
}

/** Prochaine version majeure depuis 0.1 / 1.0 / 1.1 → 1.0 / 2.0 / 2.0 */
export function nextMajorVersion(current: string | null | undefined): string {
  const raw = String(current ?? "0.1").trim();
  const major = Number.parseInt(raw.split(".")[0] ?? "0", 10);
  if (!Number.isFinite(major) || major < 1) return "1.0";
  return `${major + 1}.0`;
}

/** Édition d’une procédure validée → brouillon v{x}.1 */
export function draftFromValidated(current: string | null | undefined): string {
  const raw = String(current ?? "1.0").trim();
  const major = Number.parseInt(raw.split(".")[0] ?? "1", 10) || 1;
  return `${major}.1`;
}
