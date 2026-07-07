/**
 * Couche d'affichage « coach » du dashboard apprenant.
 * Ne modifie pas la logique interne : traduit les libellés froids
 * ("Non évaluée", "À développer") en formulations qui donnent envie d'agir,
 * et fournit des contenus de fallback pour ne jamais laisser une compétence vide.
 */

import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";

const UNEVALUATED_LEVELS = new Set(["Non évaluée", "Non renseigné", "Non évalué", "À explorer"]);

/** Niveau actuel affiché — plus jamais « Non évaluée ». */
export function coachingLevelDisplay(level: string): string {
  if (UNEVALUATED_LEVELS.has(level)) return "À explorer";
  return level;
}

/** Vrai si la compétence n'a pas encore été positionnée. */
export function isUnevaluatedLevel(level: string): boolean {
  return UNEVALUATED_LEVELS.has(level);
}

/** Écart affiché de façon positive. */
export function coachingGapDisplay(gapLabel: string): string {
  switch (gapLabel) {
    case "Aligné":
      return "Aligné";
    case "À consolider":
      return "À consolider";
    case "Écart majeur":
      return "Prochaine progression";
    case "Non évalué":
    case "À évaluer":
      return "À déterminer";
    default:
      return gapLabel;
  }
}

/** Statut EDGE affiché — orienté progression. */
export function coachingStatusDisplay(status: SkillGapStatus, isUnevaluated = false): string {
  if (isUnevaluated) return "À évaluer";
  switch (status) {
    case "validated":
      return "Alignée";
    case "in_progress":
      return "En progression";
    case "priority":
      return "Priorité EDGE";
    case "badge_available":
      return "Badge disponible";
    case "to_develop":
    default:
      return "À consolider";
  }
}

/** Importance de la compétence pour l'objectif (indicateur court). */
export function coachingImportanceLabel(
  status: SkillGapStatus,
  isUnevaluated: boolean,
): "Très importante" | "Importante" | "Utile" {
  if (status === "priority") return "Très importante";
  if (isUnevaluated) return "Importante";
  if (status === "to_develop" || status === "in_progress") return "Très importante";
  return "Importante";
}

/** Prochaine action recommandée (texte court pour la liste). */
export function coachingNextAction(
  skill: string,
  status: SkillGapStatus,
  isUnevaluated: boolean,
): string {
  if (isUnevaluated) return "Commencer l'évaluation";
  if (status === "validated") return "Déposer une preuve";
  if (status === "priority") return `Travailler « ${skill} » en priorité`;
  if (status === "badge_available") return "Obtenir le badge";
  return "Faire un exercice ciblé";
}

/** Niveau attendu pour l'objectif (fallback pédagogique). */
export function expectedLevelForObjective(status: SkillGapStatus): "Expert" | "Avancé" | "Intermédiaire" {
  if (status === "priority") return "Avancé";
  if (status === "validated") return "Expert";
  return "Intermédiaire";
}

const WHY_USEFUL: Record<string, string> = {
  communication: "Utile pour convaincre et fédérer",
  empathie: "Utile pour comprendre votre audience",
  creativite: "Utile pour créer du contenu original",
  influence: "Utile pour créer l'adhésion",
  organisation: "Utile pour tenir vos objectifs",
  negociation: "Utile pour conclure vos accords",
  leadership: "Utile pour entraîner une équipe",
  prospection: "Utile pour développer vos opportunités",
};

/** Phrase courte « Pourquoi c'est utile » pour la colonne du tableau. */
export function coachingWhyUseful(skill: string, objectiveLabel: string): string {
  const key = skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (WHY_USEFUL[key]) return WHY_USEFUL[key];
  for (const [pattern, text] of Object.entries(WHY_USEFUL)) {
    if (key.includes(pattern) || pattern.includes(key)) return text;
  }
  return `Atout pour « ${objectiveLabel} »`;
}

/** Prochaine action pour une force déjà identifiée. */
export function coachingForceAction(index: number): string {
  return index % 2 === 0 ? "Déposer une preuve" : "Continuer à pratiquer";
}
