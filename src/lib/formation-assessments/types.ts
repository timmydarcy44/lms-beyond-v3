export const ASSESSMENT_KINDS = [
  "positionnement",
  "eval_chaud",
  "eval_froid",
  "questionnaire_entreprise",
] as const;

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  /** section = écran d'intro ; nps = 0–10 ; multi = choix multiples */
  type: "scale" | "single" | "text" | "section" | "nps" | "multi";
  min?: number;
  max?: number;
  labels?: [string, string];
  options?: string[];
  sectionLabel?: string;
};

export const ASSESSMENT_LABELS: Record<AssessmentKind, string> = {
  positionnement: "Positionnement",
  eval_chaud: "Éval. à chaud",
  eval_froid: "Éval. à froid",
  questionnaire_entreprise: "Questionnaire entreprise",
};

export function isAssessmentKind(value: string): value is AssessmentKind {
  return (ASSESSMENT_KINDS as readonly string[]).includes(value);
}
