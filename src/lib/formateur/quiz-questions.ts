const QUIZ_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function quizDatabaseId(block: { quiz_id?: string | null; content?: string | null }): string {
  const fromId = String(block.quiz_id ?? "").match(QUIZ_UUID)?.[0];
  if (fromId) return fromId;
  return String(block.content ?? "").match(QUIZ_UUID)?.[0] ?? "";
}

export type EditableQuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  explication?: string;
  concept_ref?: { label?: string };
  points?: number;
  type?: string;
  image_keyword?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function optionLabel(option: unknown, index: number): string {
  if (typeof option === "string") return option;
  const row = asRecord(option);
  const label = row.label ?? row.text ?? row.value;
  return typeof label === "string" && label.trim() ? label : `Option ${index + 1}`;
}

export function toEditableQuizQuestions(raw: unknown): EditableQuizQuestion[] {
  let source = raw;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source.map((item, index) => {
    const row = asRecord(item);
    const options = Array.isArray(row.options) ? row.options.map(optionLabel) : ["Option 1", "Option 2"];
    const correctRaw = row.correct ?? row.correct_answer ?? row.correctAnswer ?? 0;
    let correct = typeof correctRaw === "number" ? correctRaw : Number(correctRaw);
    if (!Number.isFinite(correct)) {
      const match = options.findIndex((option) => option === String(correctRaw));
      correct = match >= 0 ? match : 0;
    }
    const concept = asRecord(row.concept_ref);
    const conceptLabel = String(concept.label ?? row.concept ?? "").trim();
    const explanation = String(row.explication ?? row.explanation ?? row.explanation_wrong ?? "").trim();
    const keyword = String(row.image_keyword ?? "").trim();
    return {
      question: String(row.question ?? row.title ?? `Question ${index + 1}`),
      options: options.length >= 2 ? options : ["Option 1", "Option 2"],
      correct: Math.min(Math.max(0, Math.round(correct)), Math.max(0, options.length - 1)),
      explication: explanation,
      concept_ref: conceptLabel ? { label: conceptLabel } : undefined,
      points: typeof row.points === "number" ? row.points : undefined,
      type: typeof row.type === "string" ? row.type : "qcm",
      image_keyword: keyword || undefined,
    };
  });
}

export function sanitizeEditableQuizQuestions(raw: unknown): EditableQuizQuestion[] | null {
  const questions = toEditableQuizQuestions(raw).filter((question) => question.question.trim() && question.options.length >= 2);
  return questions.length ? questions : null;
}
