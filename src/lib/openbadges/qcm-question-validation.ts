import type { EvaluationQuestionType, QcmQuestion } from "@/lib/openbadges/badge-method-config";

function resolveType(q: QcmQuestion): EvaluationQuestionType {
  return q.questionType ?? "single";
}

export function validateQcmQuestions(questions: QcmQuestion[]): string | null {
  if (questions.length === 0) {
    return "Générez ou saisissez au moins une question avant d'enregistrer.";
  }
  for (const q of questions) {
    if (!q.prompt.trim()) return "Chaque question doit avoir un énoncé.";
    const type = resolveType(q);
    if (type === "text") continue;
    const choices = q.choices ?? [];
    if (choices.length < 2) return "Chaque question à choix doit avoir au moins 2 propositions.";
    if (type === "single" && !choices.some((c) => c.isCorrect)) {
      return "Indiquez la bonne réponse pour chaque question à choix unique.";
    }
    if (type === "multiple" && !choices.some((c) => c.isCorrect)) {
      return "Indiquez au moins une bonne réponse pour les questions à choix multiples.";
    }
    if (choices.some((c) => !c.label.trim())) return "Remplissez toutes les propositions.";
  }
  return null;
}
