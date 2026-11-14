/**
 * Référentiel Qualiopi — façade compatible.
 * Source de vérité : `QUALIOPI_INDICATORS` (32 indicateurs).
 */

import {
  QUALIOPI_CRITERION_NAMES,
  QUALIOPI_INDICATOR_COUNT,
  QUALIOPI_INDICATORS,
  type QualiopiIndicatorDef,
} from "@/lib/qualiopi/indicators";

export type QualiopiIndicator = {
  id: number;
  title: string;
  summary: string;
  productHint?: string;
};

export type QualiopiCriterion = {
  id: number;
  title: string;
  indicators: QualiopiIndicator[];
};

function toLegacy(ind: QualiopiIndicatorDef): QualiopiIndicator {
  return {
    id: ind.id,
    title: `Indicateur ${ind.id}`,
    summary: ind.summary,
  };
}

export const QUALIOPI_RNQ_CRITERIA: QualiopiCriterion[] = (
  [1, 2, 3, 4, 5, 6, 7] as const
).map((id) => ({
  id,
  title: QUALIOPI_CRITERION_NAMES[id],
  indicators: QUALIOPI_INDICATORS.filter((i) => i.criterionId === id).map(toLegacy),
}));

export { QUALIOPI_INDICATOR_COUNT, QUALIOPI_INDICATORS, QUALIOPI_CRITERION_NAMES };
