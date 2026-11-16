/** 7 sections standard — procédures qualité Qualiopi. */

export const PROCEDURE_SECTION_KEYS = [
  "objet",
  "champ_application",
  "responsabilites",
  "deroulement",
  "suivi_preuves",
  "indicateurs_suivi",
  "revision",
] as const;

export type ProcedureSectionKey = (typeof PROCEDURE_SECTION_KEYS)[number];

export const PROCEDURE_SECTION_LABELS: Record<ProcedureSectionKey, string> = {
  objet: "Objet",
  champ_application: "Champ d’application",
  responsabilites: "Responsabilités",
  deroulement: "Déroulement",
  suivi_preuves: "Suivi et preuves",
  indicateurs_suivi: "Indicateurs de suivi",
  revision: "Révision",
};

export function sectionTitle(key: ProcedureSectionKey, position: number): string {
  return `${position}. ${PROCEDURE_SECTION_LABELS[key]}`;
}

/** Remplie = ≥ 40 caractères hors espaces. */
export function isSectionFilled(content: string | null | undefined): boolean {
  return String(content ?? "").replace(/\s+/g, "").length >= 40;
}

export function countFilledSections(
  sections: Array<{ key: string; content?: string | null }>,
): number {
  return sections.filter((s) => isSectionFilled(s.content)).length;
}
