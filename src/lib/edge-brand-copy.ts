/** @deprecated Préférer `@/lib/byound-brand` — alias conservés pour imports existants. */
import {
  BYOUND_ANALYSIS_LABEL,
  BYOUND_CONFIDENCE_LABEL,
  BYOUND_EVALUATION_LABEL,
  BYOUND_RELIABILITY_LABEL,
  BYOUND_STATUS_LABEL,
  sanitizePublicBrandCopy,
} from "@/lib/byound-brand";

export const EDGE_CONFIDENCE_LABEL = BYOUND_CONFIDENCE_LABEL;
export const EDGE_STATUS_LABEL = BYOUND_STATUS_LABEL;
export const EDGE_ANALYSIS_LABEL = BYOUND_ANALYSIS_LABEL;
export const EDGE_EVALUATION_LABEL = BYOUND_EVALUATION_LABEL;
export const EDGE_RELIABILITY_LABEL = BYOUND_RELIABILITY_LABEL;

/** @deprecated Utiliser `sanitizePublicBrandCopy`. */
export function sanitizeEdgePublicCopy(text: string): string {
  return sanitizePublicBrandCopy(text);
}

export const DEFAULT_EDGE_EVALUATION_METHODS = [
  "Entretien expérientiel Byound",
  "Analyse sémantique Byound",
  "Cohérence avec le référentiel métier",
  "Historique du profil",
] as const;
