import { isEdgeLabOrganizationSlug } from "@/lib/galaxy-branding";
import { normalizeThematicKey } from "@/lib/galaxy-thematic-helpers";

/**
 * Thématiques canoniques (EDGE Lab) : libellés affichés et enregistrés tels quels
 * (pas de normalisation de casse côté builder — la valeur en base = le texte choisi).
 */
export const EDGE_LAB_COURSE_CATEGORY_LABELS: readonly string[] = [
  "Intelligence artificielle",
  "Automatisation & IA commerciale",
  "Analyse comportementale",
  "Communication & Storytelling professionnel",
  "Leadership & Management",
  "Négociation & Influence",
  "Métacognition & Apprentissage",
  "Soft Skills & Intelligence émotionnelle",
  "Pilotage de la performance & KPIs",
  "Transition écologique & RSE",
  "Créativité & Innovation",
  "Gestion du temps & Productivité",
  "Recrutement & Marque employeur",
  "Titre NTC",
] as const;

const EDGE_LAB_PREFIX = "edge-lab-cat-";

/**
 * Options pour <select> : `id` opaque — l’enregistrement côté API
 * (save-course) ne persiste un `category_id` que s’il est un UUID.
 */
export function getEdgeLabThematicBuilderOptions(): Array<{ id: string; name: string }> {
  return EDGE_LAB_COURSE_CATEGORY_LABELS.map((name, i) => ({
    id: `${EDGE_LAB_PREFIX}${i}`,
    name,
  }));
}

/**
 * Rétrocompatibilité (anciens libellés, casse différente) : renvoie le libellé canonique de la liste.
 */
export function tryMatchEdgeLabCategoryName(input: string | null | undefined): string | null {
  if (input == null) return null;
  const n = normalizeThematicKey(String(input));
  for (const label of EDGE_LAB_COURSE_CATEGORY_LABELS) {
    if (normalizeThematicKey(label) === n) return label;
  }
  return null;
}

export function isExactEdgeLabLabel(s: string): boolean {
  return (EDGE_LAB_COURSE_CATEGORY_LABELS as ReadonlyArray<string>).includes(s);
}

export { resolveThematicBuilderSelectValue as resolveThematicSelectValue } from "@/lib/galaxy-thematic-helpers";

export function shouldUseEdgeLabThematicList(organizationSlug: string | null | undefined): boolean {
  return isEdgeLabOrganizationSlug(organizationSlug);
}
