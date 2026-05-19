import type { TestAnswerValue, TestQuestion } from "@/hooks/use-test-sessions";
import { answerMatchesCorrect } from "@/hooks/use-test-sessions";

export type QuizReviewItem = {
  index: number;
  questionId: string;
  title: string;
  category?: string;
  correct: boolean;
  userAnswerDisplay: string;
  expectedDisplay: string;
  explanation?: string;
  feedback?: string;
};

function optionLabel(question: TestQuestion, value: string): string {
  const v = String(value);
  const opt = question.options?.find((o) => String(o.value) === v);
  return opt?.label ?? v;
}

export function getUserAnswerDisplay(question: TestQuestion, value: TestAnswerValue | undefined): string {
  if (value === undefined || value === null) return "—";
  if (question.type === "multiple" && Array.isArray(value)) {
    if (!value.length) return "—";
    return value.map((x) => optionLabel(question, String(x))).join(", ");
  }
  if (question.type === "single") {
    return optionLabel(question, String(value));
  }
  if (question.type === "scale") {
    return String(value);
  }
  if (question.type === "text") {
    return String(value).trim() || "—";
  }
  return String(value);
}

export function getExpectedAnswerDisplay(question: TestQuestion): string {
  const c = question.correct_answer;
  if (c === undefined || c === null) return "—";
  if (question.type === "multiple") {
    const arr = Array.isArray(c) ? c : [c];
    return arr.map((x) => optionLabel(question, String(x))).join(", ");
  }
  if (question.type === "single" || question.type === "scale") {
    return question.type === "single" ? optionLabel(question, String(c)) : String(c);
  }
  return String(c);
}

export function buildQuizReviewItems(
  questions: TestQuestion[],
  answers: Record<string, TestAnswerValue>,
): QuizReviewItem[] {
  return questions.map((q, index) => {
    const raw = answers[q.id];
    const correct = answerMatchesCorrect(q, raw);
    return {
      index: index + 1,
      questionId: q.id,
      title: q.title,
      category: q.category,
      correct,
      userAnswerDisplay: getUserAnswerDisplay(q, raw),
      expectedDisplay: getExpectedAnswerDisplay(q),
      explanation: !correct ? q.explanation_wrong : undefined,
      feedback: q.feedback,
    };
  });
}

/** Résumé envoyé à l’IA pour une synthèse contextualisée (erreurs / thèmes réussis). */
export type QuizReviewBriefForAi = {
  wrong: Array<{
    index: number;
    theme: string;
    question: string;
    userAnswer: string;
    expected: string;
    explanation?: string;
  }>;
  correctThemes: Array<{ theme: string; count: number }>;
  totals: { answered: number; wrong: number; correct: number };
};

function clampReviewText(s: string, max: number): string {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function buildQuizReviewBriefForAi(items: QuizReviewItem[]): QuizReviewBriefForAi {
  const wrong = items
    .filter((r) => !r.correct)
    .slice(0, 22)
    .map((r) => ({
      index: r.index,
      theme: (r.category ?? "Général").trim() || "Général",
      question: clampReviewText(r.title, 520),
      userAnswer: clampReviewText(r.userAnswerDisplay, 300),
      expected: clampReviewText(r.expectedDisplay, 300),
      explanation: r.explanation ? clampReviewText(r.explanation, 520) : undefined,
    }));

  const themeCorrect = new Map<string, number>();
  for (const r of items) {
    if (!r.correct) continue;
    const t = (r.category ?? "Général").trim() || "Général";
    themeCorrect.set(t, (themeCorrect.get(t) ?? 0) + 1);
  }
  const correctThemes = [...themeCorrect.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);

  const wrongN = items.filter((r) => !r.correct).length;
  return {
    wrong,
    correctThemes,
    totals: {
      answered: items.length,
      wrong: wrongN,
      correct: items.length - wrongN,
    },
  };
}

export type CategoryRadarRow = {
  category: string;
  correct: number;
  total: number;
  percent: number;
};

export function buildCategoryRadar(questions: TestQuestion[], answers: Record<string, TestAnswerValue>): CategoryRadarRow[] {
  const map = new Map<string, { ok: number; n: number }>();
  for (const q of questions) {
    const cat = (q.category ?? "Général").trim() || "Général";
    const prev = map.get(cat) ?? { ok: 0, n: 0 };
    prev.n += 1;
    if (answerMatchesCorrect(q, answers[q.id])) prev.ok += 1;
    map.set(cat, prev);
  }
  return Array.from(map.entries()).map(([category, { ok, n }]) => ({
    category,
    correct: ok,
    total: n,
    percent: n > 0 ? Math.round((ok / n) * 100) : 0,
  }));
}
