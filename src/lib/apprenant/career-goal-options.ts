export type CareerGoalValue =
  | "commercial_vente"
  | "rh"
  | "formateur"
  | "marketing_communication"
  | "management"
  | "other"
  | "needs_help";

export const CAREER_GOAL_OPTIONS: Array<{ value: Exclude<CareerGoalValue, "needs_help" | "other">; label: string }> =
  [
    { value: "commercial_vente", label: "Commercial / Vente" },
    { value: "rh", label: "RH" },
    { value: "formateur", label: "Formateur" },
    { value: "marketing_communication", label: "Marketing / Communication" },
    { value: "management", label: "Management" },
  ];

export const CAREER_GOAL_OTHER_VALUE = "other" as const;
export const CAREER_GOAL_NEEDS_HELP_VALUE = "needs_help" as const;

export function careerGoalLabel(value: string | null | undefined, other?: string | null): string | null {
  if (!value) return null;
  if (value === CAREER_GOAL_NEEDS_HELP_VALUE) return "Besoin d'aide pour choisir";
  if (value === CAREER_GOAL_OTHER_VALUE) return other?.trim() || "Autre métier";
  return CAREER_GOAL_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}
