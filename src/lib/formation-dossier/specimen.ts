/** Qualiopi Lot 7 — parcours de démonstration (dossier spécimen). */

export const SPECIMEN_BANNER_LABEL = "SPÉCIMEN";

export const SPECIMEN_BANNER_HINT =
  "Dossier de démonstration — exclu des indicateurs de résultats, du BPF et du score Qualiopi.";

export function isSpecimenFlag(value: unknown): boolean {
  return value === true;
}
