import { resolvedWeights, type MethodPractice } from "@/lib/openbadges/badge-builder";

export type CoverageTone = "covered" | "qcm" | "missing";

export type CriterionCoverage = {
  id: string;
  tone: CoverageTone;
  methodIds: string[];
};

const METHOD_NAMES: Record<string, string> = {
  case_study: "étude de cas",
  video: "vidéo",
  playground: "playground",
  qcm: "questionnaire",
  dictation: "réponse orale",
  pdf_upload: "document",
};

const METHOD_WITH_ARTICLE: Record<string, string> = {
  case_study: "l'étude de cas",
  video: "la vidéo",
  playground: "le playground",
  qcm: "le questionnaire",
  dictation: "la réponse orale",
  pdf_upload: "le document",
};

const METHOD_PHRASE: Record<string, string> = {
  case_study: "une étude de cas corrigée",
  video: "une vidéo corrigée",
  playground: "un playground corrigé",
  dictation: "une réponse orale corrigée",
  pdf_upload: "un document corrigé",
};

export function methodDisplayName(id: string): string {
  if (id.startsWith("playground:situation:")) return "Playground · Mise en situation";
  if (id.startsWith("playground:module:")) return "Playground · Module interactif";
  if (id.startsWith("playground:sandbox:") || id === "playground") return "Playground · Bac à sable IA";
  return METHOD_WITH_ARTICLE[id] ?? METHOD_NAMES[id] ?? id;
}

export function criterionCoverage(
  criteria: Array<{ id: string }>,
  methods: Array<{ id: string; criterionIds: string[] }>,
): CriterionCoverage[] {
  return criteria.map((criterion) => {
    const methodIds = methods
      .filter((method) => method.criterionIds.includes(criterion.id))
      .map((method) => method.id);
    const practical = methodIds.filter((id) => id !== "qcm");
    const tone: CoverageTone = practical.length > 0 ? "covered" : methodIds.includes("qcm") ? "qcm" : "missing";
    return { id: criterion.id, tone, methodIds };
  });
}

export function prunePractices(
  practices: Record<string, MethodPractice>,
  remainingIds: string[],
  methodName: (id: string) => string = methodDisplayName,
): { practices: Record<string, MethodPractice>; warnings: string[] } {
  const allowed = new Set(remainingIds);
  const warnings: string[] = [];
  const next: Record<string, MethodPractice> = {};
  for (const [methodId, practice] of Object.entries(practices)) {
    const kept = practice.criteria.filter((link) => allowed.has(link.criterionId));
    if (kept.length === practice.criteria.length) {
      next[methodId] = practice;
      continue;
    }
    const weights = resolvedWeights(
      kept.map((link) => link.criterionId),
      Object.fromEntries(kept.map((link) => [link.criterionId, link.weight])),
    );
    next[methodId] = {
      ...practice,
      criteria: kept.map((link) => ({ ...link, weight: weights[link.criterionId] ?? 0 })),
    };
    warnings.push(`Les poids de ${methodName(methodId)} ont été recalculés`);
  }
  return { practices: next, warnings };
}

export function qcmOnlyBlocksAward(requirePractice: boolean, rows: Array<{ tone: CoverageTone }>): boolean {
  return requirePractice && rows.some((row) => row.tone === "qcm");
}

export function buildCriteriaNarrative(input: {
  criteria: Array<{ label: string; expectedOutcome?: string | null }>;
  methods: Array<{ id: string; criterionLabels: string[]; detail: string }>;
  passRule?: string;
}): string {
  const lines = input.criteria
    .filter((item) => item.label.trim())
    .map((item) => {
      const expected = (item.expectedOutcome ?? "").trim();
      return expected ? `${item.label.trim()} — ${expected}` : item.label.trim();
    });
  const exams = input.methods
    .filter((method) => method.criterionLabels.length > 0)
    .map((method) => {
      const name = methodDisplayName(method.id);
      const count = method.criterionLabels.length;
      if (method.id === "qcm") return `un questionnaire (${method.detail || "seuil indiqué"})`;
      const phrase = METHOD_PHRASE[method.id] ?? name;
      return `${phrase} par un expert Byound sur ${count} critère${count > 1 ? "s" : ""} (${method.criterionLabels.join(", ")})`;
    });
  const sentence = exams.length
    ? `Le titulaire a réussi ${exams.join(" et ")}.`
    : "";
  const rule = (input.passRule ?? "").trim();
  return [sentence, rule, ...lines].filter(Boolean).join("\n");
}
