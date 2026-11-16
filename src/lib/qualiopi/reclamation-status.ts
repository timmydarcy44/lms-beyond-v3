/** Statuts canoniques réclamations Qualiopi v2 (ind. 31). */

export const RECLAMATION_STEPS = [
  "received",
  "acknowledged",
  "analysis",
  "answered",
  "closed",
] as const;

export type ReclamationStep = (typeof RECLAMATION_STEPS)[number];

export const RECLAMATION_STEP_LABELS: Record<ReclamationStep, string> = {
  received: "Reçue",
  acknowledged: "Accusé de réception",
  analysis: "Analyse",
  answered: "Réponse",
  closed: "Clôturée",
};

/** Anciens codes encore possibles en lecture. */
const LEGACY: Record<string, ReclamationStep> = {
  open: "received",
  in_progress: "analysis",
  closed: "closed",
};

export function parseReclamationStep(raw: unknown): ReclamationStep {
  const s = String(raw ?? "").trim();
  if ((RECLAMATION_STEPS as readonly string[]).includes(s)) return s as ReclamationStep;
  return LEGACY[s] ?? "received";
}

export function isOpenStep(step: ReclamationStep): boolean {
  return step !== "closed";
}

export function isTodoStep(step: ReclamationStep): boolean {
  return step === "received" || step === "acknowledged" || step === "analysis" || step === "answered";
}

export type ReclamationTimestamps = {
  received_at?: string | null;
  ack_at?: string | null;
  answered_at?: string | null;
  closed_at?: string | null;
  status?: string | null;
  response?: string | null;
};

/** Dérive l’étape affichée (status canonique + horodatages). */
export function resolveReclamationStep(row: ReclamationTimestamps): ReclamationStep {
  const status = parseReclamationStep(row.status);
  if (status === "closed" || row.closed_at) return "closed";
  if (status === "answered" || row.answered_at) return "answered";
  if (status === "analysis") return "analysis";
  if (status === "acknowledged" || row.ack_at) {
    if (row.response && String(row.response).trim()) return "answered";
    return status === "acknowledged" || row.ack_at ? (status === "analysis" ? "analysis" : "acknowledged") : "acknowledged";
  }
  return "received";
}

export function stepIndex(step: ReclamationStep): number {
  return RECLAMATION_STEPS.indexOf(step);
}
