/**
 * Marque produit affichée dans l’UI, les e-mails et les métadonnées (edgebs.fr).
 * Les identifiants code (EDGE_COLORS, routes /edge-lab, etc.) restent inchangés.
 */

export const BYOUND_PRODUCT_NAME = "Byound";

export const BYOUND_CERTIFIED = "Byound Certified";
export const BYOUND_ONLINE = "Byound Online";
export const BYOUND_BUSINESS = "Byound Business";

export const BYOUND_CONFIDENCE_LABEL = "Score de confiance Byound";
export const BYOUND_STATUS_LABEL = "Statut Byound";
export const BYOUND_ANALYSIS_LABEL = "Analyse Byound";
export const BYOUND_EVALUATION_LABEL = "Évaluation Byound";
export const BYOUND_RELIABILITY_LABEL = "Indice de fiabilité Byound";

/** Remplace les mentions Byound / IA legacy dans du texte stocké ou généré. */
export function sanitizePublicBrandCopy(text: string): string {
  return text
    .replace(/\bConfiance IA\b/gi, BYOUND_CONFIDENCE_LABEL)
    .replace(/\bÉvaluation IA\b/gi, BYOUND_EVALUATION_LABEL)
    .replace(/\bAnalyse IA\b/gi, BYOUND_ANALYSIS_LABEL)
    .replace(/\bEntretien IA\b/gi, "Entretien expérientiel Byound")
    .replace(/\bEntretien expérientiel Byound\b/gi, "Entretien expérientiel Byound")
    .replace(/\bIA a analysé\b/gi, "Byound a analysé")
    .replace(/\bEDGE a analysé\b/gi, "Byound a analysé")
    .replace(/\bintelligence artificielle\b/gi, "méthodologie Byound")
    .replace(/\bByound Certified\b/g, BYOUND_CERTIFIED)
    .replace(/\bByound Online\b/g, BYOUND_ONLINE)
    .replace(/\bByound Business\b/g, BYOUND_BUSINESS)
    .replace(/\bEDGE\b/g, BYOUND_PRODUCT_NAME)
    .replace(/\bIA\b/g, BYOUND_PRODUCT_NAME);
}
