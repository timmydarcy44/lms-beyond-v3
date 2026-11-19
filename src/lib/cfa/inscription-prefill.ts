import type { ParcoursDiploma, ParcoursSituation } from "@/lib/cfa/admission-challenge";

/**
 * Correspondance réponses page candidature → champs CERFA / inscription.
 *
 * | Page (parcours)              | Champ inscription              | Valeur CERFA          |
 * |------------------------------|--------------------------------|-----------------------|
 * | diplôme bac_* / bac_plus_*   | Diplôme le plus élevé          | Baccalauréat / Bac+2… |
 * | situation lyceen             | Situation avant le contrat     | Scolaire              |
 * | situation etudiant           | Situation avant le contrat     | Étudiant              |
 * | situation emploi             | Situation avant le contrat     | Salarié               |
 * | situation recherche          | Situation avant le contrat     | Demandeur d'emploi    |
 * | situation reconversion       | Situation avant le contrat     | Inactif               |
 * | situation lyceen             | Dernière classe suivie         | Terminale (défaut)    |
 * | situation etudiant           | Dernière classe suivie         | (vide / à préciser)   |
 */
export const PARCOURS_TO_HIGHEST_DIPLOMA: Record<ParcoursDiploma, string> = {
  brevet: "Aucun",
  cap_bep: "CAP / BEP",
  bac_general: "Baccalauréat",
  bac_techno: "Baccalauréat",
  bac_pro: "Baccalauréat",
  bac_plus_1: "Baccalauréat",
  bac_plus_2: "Bac+2",
  bac_plus_3: "Bac+3 ou plus",
  aucun: "Aucun",
};

export const PARCOURS_TO_PRIOR_SITUATION: Record<ParcoursSituation, string> = {
  lyceen: "Scolaire",
  etudiant: "Étudiant",
  emploi: "Salarié",
  recherche: "Demandeur d'emploi",
  reconversion: "Inactif",
};

export const PARCOURS_TO_LAST_CLASS: Partial<Record<ParcoursSituation, string>> = {
  lyceen: "Terminale",
  etudiant: "BTS",
};

export type PrefillHints = {
  highestDiploma?: string;
  priorSituation?: string;
  lastClass?: string;
  sources: Partial<Record<"highestDiploma" | "priorSituation" | "lastClass", true>>;
};

export function prefillFromParcours(parcours: Record<string, unknown> | null | undefined): PrefillHints {
  const sources: PrefillHints["sources"] = {};
  const diploma = parcours?.diploma as ParcoursDiploma | undefined;
  const situation = parcours?.situation as ParcoursSituation | undefined;
  const hints: PrefillHints = { sources };

  if (diploma && PARCOURS_TO_HIGHEST_DIPLOMA[diploma]) {
    hints.highestDiploma = PARCOURS_TO_HIGHEST_DIPLOMA[diploma];
    sources.highestDiploma = true;
  }
  if (situation && PARCOURS_TO_PRIOR_SITUATION[situation]) {
    hints.priorSituation = PARCOURS_TO_PRIOR_SITUATION[situation];
    sources.priorSituation = true;
  }
  if (situation && PARCOURS_TO_LAST_CLASS[situation]) {
    hints.lastClass = PARCOURS_TO_LAST_CLASS[situation];
    sources.lastClass = true;
  }
  return hints;
}
