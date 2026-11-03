import type { TestQuestion } from "@/hooks/use-test-sessions";

export type ConceptRef = {
  label: string;
  subchapterId?: string;
  anchor?: string;
  passage?: string;
};

export type GameCharacter = {
  name?: string;
  role?: string;
  intro_line?: string;
  avatar?: string;
};

export type GameMeta = {
  title?: string;
  hook?: string;
  duration_min?: number | null;
  steps_count?: number | null;
  skills?: string[];
  character?: GameCharacter | null;
  cover_url?: string | null;
  max_attempts?: number | null;
  opening?: string | null;
};

/** Seuils du message de résultat, en part de bonnes réponses. */
export const RESULT_THRESHOLDS = {
  great: 0.8,
  good: 0.6,
};

const CORRECT_TITLES = ["Bien vu !", "Exactement.", "C’est ça.", "Oui, c’est bien ça."];

export function resultHeadline(correct: number, total: number): string {
  if (total <= 0) return "Quiz terminé";
  const ratio = correct / total;
  if (ratio + 1e-9 >= RESULT_THRESHOLDS.great) return "Très bonne maîtrise !";
  if (ratio + 1e-9 >= RESULT_THRESHOLDS.good) return "Bien joué";
  return "On consolide ?";
}

export function feedbackTitle(questionIndex: number, correct: boolean): string {
  if (!correct) return "Pas tout à fait.";
  return CORRECT_TITLES[Math.abs(questionIndex) % CORRECT_TITLES.length] ?? "Bien vu !";
}

export function parseDurationMin(raw?: string | null): number | null {
  if (!raw) return null;
  const match = String(raw).match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function cleanGameTitle(title?: string | null, fallback?: string | null): string {
  const primary = (title ?? "").trim();
  if (primary && !/^jeu interactif$/i.test(primary)) return primary;
  const next = (fallback ?? "").trim();
  if (next && !/^jeu interactif$/i.test(next)) return next;
  return "Mise en pratique";
}

export function explicitQuestionImage(url?: string | null): string | undefined {
  const value = (url ?? "").trim();
  if (!value) return undefined;
  if (/source\.unsplash\.com|unsplash\.com\/source/i.test(value)) return undefined;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return undefined;
}

export function questionExplanation(question: TestQuestion): string | undefined {
  const text = (question.explanation || question.explanation_wrong || "").trim();
  return text || undefined;
}

export function questionConcept(question: TestQuestion): ConceptRef | undefined {
  if (question.concept_ref?.label?.trim()) return question.concept_ref;
  const category = question.category?.trim();
  return category ? { label: category } : undefined;
}

export function goalCount(minScorePercent: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = Math.min(100, Math.max(0, minScorePercent)) / 100;
  return Math.max(1, Math.round(ratio * total));
}

export function synthesisLine(
  rows: Array<{ label: string; correct: number; total: number }>,
): string {
  const mastered = rows.filter((row) => row.total > 0 && row.correct / row.total >= 0.5).map((row) => row.label);
  const weak = rows
    .filter((row) => row.total > 0 && row.correct < row.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
  if (mastered.length && weak) {
    const names = mastered.slice(0, 2).join(" et ");
    return `Tu distingues bien ${names}. ${weak.label} mérite un petit retour.`;
  }
  if (mastered.length && !weak) {
    return `Tu maîtrises ${mastered.slice(0, 3).join(", ")}.`;
  }
  if (weak) return `${weak.label} mérite un petit retour.`;
  return "Chaque réponse est enregistrée. Tu peux relire le détail ci-contre.";
}
