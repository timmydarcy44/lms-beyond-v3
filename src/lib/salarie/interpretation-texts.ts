/**
 * Textes d'interprétation pour Mes bilans (espace salarié).
 * Ne contient que des textes déjà présents dans le code, ou des placeholders « À RÉDIGER ».
 * La table SQL `interpretation_texts` (migration) est le miroir persistant prévu.
 */

import type { DiscLabel } from "@/lib/disc/disc-questions-types";

export type InterpretationBand = "low" | "mid" | "high" | "any";
export type InterpretationKind =
  | "definition"
  | "observation"
  | "appui"
  | "vigilance"
  | "travailler"
  | "ce_que_ca_veut_dire"
  | "echelle";

export type InterpretationTextRow = {
  test: "disc" | "idmc" | "soft";
  dimension: string;
  band: InterpretationBand;
  kind: InterpretationKind;
  /** Contenu affiché ; « À RÉDIGER » = placeholder explicite. */
  text: string;
  source: "code" | "placeholder";
};

/** Définitions DISC (issues de DISC_OBS dans assessment-observations.ts), tutoiement salarié. */
export const DISC_DIMENSION_DEFINITIONS_TU: Record<DiscLabel, string> = {
  D: "Tu privilégies l'action, les décisions rapides et les objectifs clairs.",
  I: "Tu mises sur la communication, l'enthousiasme et la mobilisation des autres.",
  S: "Tu recherches la stabilité, l'écoute et un rythme de travail régulier.",
  C: "Tu valorises la rigueur, la qualité et le respect des procédures.",
};

export const DISC_DIMENSION_NAMES: Record<DiscLabel, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
};

export const DISC_BAR_COLORS: Record<DiscLabel, string> = {
  D: "#FF6B6B",
  I: "#FF9B54",
  S: "#6BE39B",
  C: "#8DB8FF",
};

/** Écart max−min < 15 → profil équilibré (brief Mes bilans v3). */
export const DISC_BALANCED_SPREAD_THRESHOLD = 15;

/**
 * Catalogue en mémoire. Les lignes `placeholder` doivent être rédigées plus tard.
 * Ne pas inventer de contenu métier ici.
 */
export const INTERPRETATION_TEXTS: InterpretationTextRow[] = [
  // DISC — définitions (code existant, tutoiement)
  ...(["D", "I", "S", "C"] as DiscLabel[]).map((dimension) => ({
    test: "disc" as const,
    dimension,
    band: "any" as const,
    kind: "definition" as const,
    text: DISC_DIMENSION_DEFINITIONS_TU[dimension],
    source: "code" as const,
  })),
  // DISC — blocs structurés manquants
  ...(["D", "I", "S", "C"] as DiscLabel[]).flatMap((dimension) =>
    (["appui", "vigilance", "travailler"] as const).map((kind) => ({
      test: "disc" as const,
      dimension,
      band: "any" as const,
      kind: kind as InterpretationKind,
      text: "À RÉDIGER",
      source: "placeholder" as const,
    })),
  ),
  // IDMC
  {
    test: "idmc",
    dimension: "*",
    band: "any",
    kind: "echelle",
    text: "Chaque aptitude est notée sur 100. Le trait à 50 marque le milieu de l'échelle (pas une moyenne population).",
    source: "code",
  },
  {
    test: "idmc",
    dimension: "*",
    band: "any",
    kind: "ce_que_ca_veut_dire",
    text: "À RÉDIGER",
    source: "placeholder",
  },
  // Soft skills
  {
    test: "soft",
    dimension: "*",
    band: "any",
    kind: "echelle",
    text: "Chaque soft skill est affichée sur 100 (conversion depuis le score /15 du test).",
    source: "code",
  },
  {
    test: "soft",
    dimension: "*",
    band: "any",
    kind: "ce_que_ca_veut_dire",
    text: "À RÉDIGER",
    source: "placeholder",
  },
];

export function listMissingInterpretationTexts(): InterpretationTextRow[] {
  return INTERPRETATION_TEXTS.filter((row) => row.source === "placeholder" || row.text === "À RÉDIGER");
}

export function findInterpretationText(
  test: InterpretationTextRow["test"],
  kind: InterpretationKind,
  dimension = "*",
): string | null {
  const row =
    INTERPRETATION_TEXTS.find((item) => item.test === test && item.kind === kind && item.dimension === dimension) ??
    INTERPRETATION_TEXTS.find((item) => item.test === test && item.kind === kind && item.dimension === "*");
  return row?.text ?? null;
}
