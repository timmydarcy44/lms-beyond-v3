/** Source de vérité partagée apprenant / tuteur pour les missions entreprise. */

export const MISSION_STATUSES = [
  "assigned",
  "submitted",
  "changes_requested",
  "validated",
] as const;

export type MissionStatus = (typeof MISSION_STATUSES)[number];

/** Normalise les anciens statuts DB vers le canon v2. */
export function normalizeMissionStatus(raw: string | null | undefined): MissionStatus {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "assigned" || s === "todo" || s === "in_progress") return "assigned";
  if (s === "submitted") return "submitted";
  if (s === "changes_requested" || s === "correction_requested" || s === "invalid") {
    return "changes_requested";
  }
  if (s === "validated" || s === "done") return "validated";
  return "assigned";
}

export type LearnerMissionLabel = {
  key: MissionStatus;
  label: string;
  color: "amber" | "blue" | "green";
};

/** Libellé unique côté apprenant (pas de doublon « envoyée / en attente »). */
export function learnerMissionLabel(
  status: MissionStatus,
  opts?: { dueDate?: string | null; started?: boolean },
): LearnerMissionLabel {
  if (status === "submitted") {
    return { key: status, label: "Chez ton tuteur", color: "blue" };
  }
  if (status === "changes_requested") {
    return { key: status, label: "À reprendre", color: "amber" };
  }
  if (status === "validated") {
    return { key: status, label: "Validée", color: "green" };
  }
  // assigned
  const hasDue = Boolean(opts?.dueDate);
  const started = Boolean(opts?.started);
  if (hasDue || started) {
    return { key: status, label: "Preuve manquante", color: "amber" };
  }
  return { key: status, label: "À faire", color: "amber" };
}

export function isActionableForLearner(status: MissionStatus) {
  return status === "assigned" || status === "changes_requested";
}

export function progressSegments(status: MissionStatus): Array<"done" | "current" | "todo"> {
  if (status === "validated") return ["done", "done", "done"];
  if (status === "submitted") return ["done", "done", "current"];
  if (status === "changes_requested") return ["done", "current", "todo"];
  return ["done", "current", "todo"];
}

export const PROGRESS_LABELS = ["Confiée", "Preuve envoyée", "Validée"] as const;

export const MIN_PROOF_TEXT = 20;

export function hasValidProofText(note: string | null | undefined) {
  return String(note ?? "").trim().length >= MIN_PROOF_TEXT;
}
