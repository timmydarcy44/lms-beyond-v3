/** Libellés orientés marque EDGE — sans mention « IA » côté interface publique. */

export const EDGE_CONFIDENCE_LABEL = "Score de confiance EDGE";
export const EDGE_STATUS_LABEL = "Statut EDGE";
export const EDGE_ANALYSIS_LABEL = "Analyse EDGE";
export const EDGE_EVALUATION_LABEL = "Évaluation EDGE";
export const EDGE_RELIABILITY_LABEL = "Indice de fiabilité EDGE";

/** Nettoie les libellés stockés (anciennes analyses) pour l'affichage public. */
export function sanitizeEdgePublicCopy(text: string): string {
  return text
    .replace(/\bConfiance IA\b/gi, EDGE_CONFIDENCE_LABEL)
    .replace(/\bÉvaluation IA\b/gi, EDGE_EVALUATION_LABEL)
    .replace(/\bAnalyse IA\b/gi, EDGE_ANALYSIS_LABEL)
    .replace(/\bEntretien IA\b/gi, "Entretien expérientiel EDGE")
    .replace(/\bIA a analysé\b/gi, "EDGE a analysé")
    .replace(/\bintelligence artificielle\b/gi, "méthodologie EDGE")
    .replace(/\bIA\b/g, "EDGE");
}

export const DEFAULT_EDGE_EVALUATION_METHODS = [
  "Entretien expérientiel EDGE",
  "Analyse sémantique EDGE",
  "Cohérence avec le référentiel métier",
  "Historique du profil",
] as const;
