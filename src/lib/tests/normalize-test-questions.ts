import type { TestQuestion } from "@/hooks/use-test-sessions";

/** Forme canonique côté client après lecture API / tests en base. */
export type NormalizedTestQuestion = TestQuestion & {
  correct_answer?: string | number | string[] | null;
};

function coerceOptions(raw: unknown): { value: string; label: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((opt: unknown, optIndex: number) => {
    if (opt && typeof opt === "object" && "label" in opt) {
      const o = opt as { label?: unknown; value?: unknown; id?: unknown };
      const rawVal = o.value !== undefined && o.value !== null ? o.value : o.id;
      return {
        value: String(rawVal ?? optIndex),
        label: String(o.label ?? rawVal ?? `Option ${optIndex + 1}`),
      };
    }
    const s = String(opt ?? "").trim();
    return { value: String(optIndex), label: s || `Option ${optIndex + 1}` };
  });
}

function pickCorrectAnswer(q: Record<string, unknown>): string | number | string[] | null | undefined {
  let v =
    q.correct_answer ??
    q.correctAnswer ??
    q.correct_option ??
    q.correctOption ??
    q.correct ??
    q.answer;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const idOrVal = o.id ?? o.value ?? o.correct;
    v = idOrVal !== undefined ? idOrVal : v;
  }
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(String);
  return String(v);
}

/**
 * Garantit un tableau de questions avec title, options { value, label }, correct_answer si présent.
 * Accepte snake_case / camelCase et options string[] ou objets.
 */
export function normalizeTestQuestions(raw: unknown): NormalizedTestQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown, index: number) => {
    const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const title = String(q.title ?? q.question ?? q.text ?? `Question ${index + 1}`);
    let formattedOptions = coerceOptions(q.options);

    const rawType = String(q.type ?? "").toLowerCase();
    let type: TestQuestion["type"] = "multiple";
    if (rawType === "single" || rawType === "qcm" || rawType === "vrai_faux") type = "single";
    else if (rawType === "multiple") type = "multiple";
    else if (rawType === "scale") type = "scale";
    else if (rawType === "text") type = "text";
    else if (formattedOptions.length <= 1) type = "text";
    else if (formattedOptions.length === 2) type = "single";

    const correct = pickCorrectAnswer(q);
    if (
      correct !== undefined &&
      correct !== null &&
      typeof correct === "number" &&
      formattedOptions.length > correct
    ) {
      formattedOptions = formattedOptions.map((o, i) => ({
        value: String(i),
        label: o.label,
      }));
    }

    const catRaw = q.category ?? q.skill_category ?? q.domain ?? q.axis;
    const category =
      typeof catRaw === "string" && catRaw.trim() ? catRaw.trim() : undefined;
    const expl =
      q.explanation_wrong ??
      q.explanationWrong ??
      q.wrong_explanation ??
      q.feedback_wrong ??
      q.pourquoi;
    const explanation_wrong =
      typeof expl === "string" && expl.trim() ? expl.trim() : undefined;
    const fb = q.feedback ?? q.note;
    const feedback = typeof fb === "string" && fb.trim() ? fb.trim() : undefined;

    return {
      id: String(q.id ?? `q-${index}`),
      title,
      type,
      options: formattedOptions.length ? formattedOptions : undefined,
      helper: (q.helper ?? q.help) as string | undefined,
      imageUrl: (q.imageUrl ?? q.image_url) as string | undefined,
      image_keyword: (q.image_keyword ?? q.imageKeyword) as string | undefined,
      placeholder: q.placeholder as string | undefined,
      scale: q.scale as TestQuestion["scale"],
      correct_answer: correct === undefined ? undefined : correct,
      category,
      explanation_wrong,
      feedback,
    };
  });
}
