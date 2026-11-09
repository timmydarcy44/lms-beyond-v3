import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

/** Score 0–100 à partir des réponses (échelle + single mappés ; texte ignoré). */
export function scoreAssessmentAnswers(
  questions: AssessmentQuestion[],
  answers: Record<string, unknown>,
): number | null {
  let earned = 0;
  let max = 0;

  for (const q of questions) {
    const raw = answers[q.id];
    if (raw == null || raw === "") continue;

    if (q.type === "scale" || q.type === "nps") {
      const min = q.min ?? (q.type === "nps" ? 0 : 1);
      const high = q.max ?? (q.type === "nps" ? 10 : 5);
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      max += high - min;
      earned += Math.max(0, Math.min(high, value) - min);
    } else if (q.type === "single" && q.options?.length) {
      max += q.options.length - 1;
      const idx = q.options.indexOf(String(raw));
      if (idx >= 0) earned += idx;
    } else if (q.type === "multi" && q.options?.length && Array.isArray(raw)) {
      max += q.options.length;
      earned += raw.filter((v) => q.options!.includes(String(v))).length;
    } else if (q.type === "section") {
      continue;
    }
  }

  if (max <= 0) return null;
  return Math.round((earned / max) * 1000) / 10;
}
