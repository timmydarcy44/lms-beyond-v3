/** Label interne — filtré de la liste des aménagements. */
export const ACCOMPANIMENT_PLAN_LABEL = "__plan_html__";

export function isAccompanimentPlanLabel(label: string | null | undefined) {
  return String(label ?? "") === ACCOMPANIMENT_PLAN_LABEL;
}
