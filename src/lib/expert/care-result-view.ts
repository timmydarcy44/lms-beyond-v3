import { getCareQuestionnaire, getCareTest } from "@/lib/expert/care-tests";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

const SCALE = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];

export function formatCareAnswer(value: unknown, type?: string) {
  if (value == null || value === "") return "—";
  const raw = String(value);
  if (type === "boolean") return raw === "1" || raw === "true" ? "Oui" : "Non";
  if (type === "scale" && /^\d+$/.test(raw) && SCALE[Number(raw)]) return SCALE[Number(raw)];
  return raw;
}

export function describeCareAnswers(testSlug: string, answers: Record<string, unknown> | null | undefined) {
  const payload = answers && typeof answers === "object" ? answers : {};
  if (testSlug === "soft-skills") {
    return SOFT_SKILLS_QUESTIONS.flatMap((question) => {
      const value = payload[question.id];
      if (value == null || value === "") return [];
      const index = Number(value);
      return [
        {
          question: question.text,
          answer: Number.isFinite(index) && SCALE[index] ? SCALE[index] : String(value),
        },
      ];
    });
  }
  const questionnaire = getCareQuestionnaire(testSlug);
  return (questionnaire?.questions ?? []).flatMap((question) => {
    const value = payload[question.id];
    if (value == null || value === "") return [];
    return [{ question: question.label, answer: formatCareAnswer(value, question.type) }];
  });
}

export function careTestTitle(slug: string) {
  return getCareTest(slug)?.title ?? slug;
}
