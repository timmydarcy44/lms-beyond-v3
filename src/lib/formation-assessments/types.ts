export const ASSESSMENT_KINDS = [
  "positionnement",
  "eval_chaud",
  "eval_froid",
  "questionnaire_entreprise",
  "eval_formateur",
] as const;

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  /** section = écran d'intro ; nps = 1–5 (ou bornes explicites) ; multi = choix multiples */
  type: "scale" | "single" | "text" | "section" | "nps" | "multi";
  min?: number;
  max?: number;
  labels?: [string, string];
  options?: string[];
  sectionLabel?: string;
  /** Afficher seulement si la réponse à une autre question est dans `values`. */
  showWhen?: { questionId: string; values: string[] };
  /** Texte obligatoire lorsqu'il est affiché. */
  required?: boolean;
};

export const ASSESSMENT_LABELS: Record<AssessmentKind, string> = {
  positionnement: "Positionnement",
  eval_chaud: "Éval. à chaud",
  eval_froid: "Éval. à froid",
  questionnaire_entreprise: "Questionnaire entreprise",
  eval_formateur: "Satisfaction formateur",
};

export function isQuestionVisible(
  question: AssessmentQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.showWhen) return true;
  const raw = answers[question.showWhen.questionId];
  return question.showWhen.values.includes(String(raw ?? ""));
}

export function isAssessmentKind(value: string): value is AssessmentKind {
  return (ASSESSMENT_KINDS as readonly string[]).includes(value);
}
