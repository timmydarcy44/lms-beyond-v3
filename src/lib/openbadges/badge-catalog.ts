import { z } from "zod";
import { resolvedWeights, type BadgeDeliverableDraft, type MethodPractice } from "@/lib/openbadges/badge-builder";
import { defaultMethodConfig, type BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { isBadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";

const COMPETENCY_ORIGIN = "https://www.byound.fr";

/** Open Badges 3.0 Alignment.targetType désigne le nœud visé.
 *  Les exemples 1EdTech utilisent CFItem (item CASE). « Competency » est le achievementType du badge. */
export const BYOUND_COMPETENCY_FRAMEWORK = "Référentiel de compétences Byound";
export const BYOUND_ALIGNMENT_TARGET_TYPE = "CFItem";
export const QUIZ_COPY_THRESHOLD = 0.72;

export const DOMAIN_COLORS = ["#6E5BFF", "#3DDCAB", "#F2C15A", "#7AA2FF", "#F07178", "#C084FC", "#34D399", "#FB923C"] as const;

export const DOMAIN_ICONS = ["brain", "users", "briefcase", "heart", "message", "cpu", "trophy", "book", "spark", "target"] as const;

export type CompetencyStatus = "draft" | "validated";

export type ByoundCompetency = {
  id: string;
  slug: string;
  name: string;
  definition: string;
  domainId: string | null;
  status: CompetencyStatus;
  validatedBy: string | null;
  validatedAt: string | null;
  archivedAt: string | null;
};

export type BadgeDomainRecord = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  archivedAt: string | null;
};

export type BadgeSeriesRecord = {
  id: string;
  name: string;
  domainId: string | null;
};

export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(value: string): string {
  const slug = normalizeLabel(value).replace(/ /g, "-").replace(/-+/g, "-");
  return slug || "competence";
}

export function tokensOf(value: string): Set<string> {
  return new Set(normalizeLabel(value).split(" ").filter((token) => token.length > 2));
}

/** Coefficient de Dice sur les mots. 1 = mêmes mots. */
export function tokenSimilarity(left: string, right: string): number {
  const a = tokensOf(left);
  const b = tokensOf(right);
  if (a.size === 0 || b.size === 0) return normalizeLabel(left) === normalizeLabel(right) ? 1 : 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

export function questionTooClose(prompt: string, sources: string[], threshold = QUIZ_COPY_THRESHOLD): boolean {
  const text = prompt.trim();
  if (!text) return false;
  return sources.some((source) => tokenSimilarity(text, source) >= threshold);
}

export function dropCopiedQuestions<T extends { prompt: string }>(questions: T[], sources: string[], threshold = QUIZ_COPY_THRESHOLD): { kept: T[]; rejected: T[] } {
  const kept: T[] = [];
  const rejected: T[] = [];
  for (const question of questions) {
    if (questionTooClose(question.prompt, sources, threshold)) rejected.push(question);
    else kept.push(question);
  }
  return { kept, rejected };
}

function levenshtein(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let col = 0; col <= right.length; col += 1) rows[0][col] = col;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[left.length][right.length];
}

export function suggestDomain<T extends { name: string }>(input: string, domains: T[]): { exact: T | null; near: T | null } {
  const normalized = normalizeLabel(input);
  if (!normalized) return { exact: null, near: null };
  const exact = domains.find((domain) => normalizeLabel(domain.name) === normalized) ?? null;
  if (exact) return { exact, near: null };
  let near: T | null = null;
  let best = 0;
  for (const domain of domains) {
    const other = normalizeLabel(domain.name);
    if (!other) continue;
    const distance = levenshtein(normalized, other);
    const ratio = 1 - distance / Math.max(normalized.length, other.length);
    const included = other.includes(normalized) || normalized.includes(other);
    const score = included ? Math.max(ratio, 0.86) : ratio;
    if (score >= 0.82 && score > best) {
      best = score;
      near = domain;
    }
  }
  return { exact: null, near };
}

export function suggestCompetency<T extends { name: string }>(input: string, competencies: T[]): T | null {
  const normalized = normalizeLabel(input);
  if (!normalized) return null;
  const exact = competencies.find((item) => normalizeLabel(item.name) === normalized);
  if (exact) return exact;
  return competencies.find((item) => tokenSimilarity(item.name, input) >= 0.8) ?? null;
}

export function nextSeriesLevel(levels: number[]): number {
  const usable = levels.filter((level) => Number.isInteger(level) && level >= 1);
  if (usable.length === 0) return 1;
  return Math.max(...usable) + 1;
}

export function seriesPrerequisite<T extends { id: string; name: string; seriesName?: string | null; level?: number | null }>(
  seriesName: string,
  level: number,
  badges: T[],
  selfId?: string | null,
): T | null {
  if (!seriesName.trim() || level <= 1) return null;
  return badges.find((badge) =>
    badge.id !== selfId
    && normalizeLabel(badge.seriesName ?? "") === normalizeLabel(seriesName)
    && badge.level === level - 1,
  ) ?? null;
}

export function draftCompetenciesBlockPublish(competencies: Array<{ status?: string | null }>): boolean {
  return competencies.some((item) => item.status !== "validated");
}

export function formatBadgeLevel(level: number | null | undefined, label?: string | null): string {
  if (level == null || !Number.isFinite(level)) return "";
  const name = label?.trim();
  return name ? `Niveau ${level} · ${name}` : `Niveau ${level}`;
}

export function competencyPageUrl(slug: string): string {
  return `${COMPETENCY_ORIGIN}/competences/${slug}`;
}

export function competencyAlignments(competencies: Array<Pick<ByoundCompetency, "name" | "slug" | "definition">>) {
  return competencies
    .filter((item) => item.name.trim() && item.slug.trim())
    .map((item) => ({
      targetName: item.name.trim(),
      targetUrl: competencyPageUrl(item.slug.trim()),
      targetDescription: item.definition.trim(),
      targetFramework: BYOUND_COMPETENCY_FRAMEWORK,
      targetType: BYOUND_ALIGNMENT_TARGET_TYPE,
    }));
}

export function courseFingerprint(text: string): string {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

const TEXT_KEYS = new Set(["title", "name", "label", "description", "summary", "objective", "objectives", "content", "presentation", "prompt", "context"]);

export function extractCourseBrief(row: Record<string, unknown>): {
  title: string;
  description: string;
  brief: string;
  quizPrompts: string[];
  moduleCount: number;
  published: boolean;
  updatedAt: string | null;
  duration: string | null;
} {
  const title = String(row.title ?? row.name ?? "").trim();
  const description = String(row.description ?? "").trim();
  const status = String(row.status ?? "").toLowerCase();
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : null;
  const durationValue = row.duration_minutes ?? row.duration ?? row.estimated_duration;
  const duration = durationValue == null ? null : String(durationValue);
  const lines: string[] = [];
  const quizPrompts: string[] = [];
  if (title) lines.push(title);
  if (description) lines.push(description);

  const visit = (value: unknown, key: string, inQuiz: boolean) => {
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return;
      if (inQuiz && (key === "question" || key === "prompt" || key === "text" || key === "title")) quizPrompts.push(text);
      else if (TEXT_KEYS.has(key) || key === "question") lines.push(text);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key, inQuiz || /quiz|question/i.test(key)));
      return;
    }
    if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
        visit(child, childKey, inQuiz || /quiz|question/i.test(childKey) || /quiz|question/i.test(key));
      }
    }
  };
  visit(row.objectives, "objectives", false);
  visit(row.builder_snapshot, "snapshot", false);
  visit(row.presentation, "presentation", false);

  const snapshot = row.builder_snapshot && typeof row.builder_snapshot === "object" ? row.builder_snapshot as Record<string, unknown> : {};
  const modules = Array.isArray(snapshot.modules) ? snapshot.modules.length : Array.isArray(snapshot.sections) ? snapshot.sections.length : 0;
  return {
    title,
    description,
    brief: lines.join("\n"),
    quizPrompts,
    moduleCount: modules,
    published: status === "published" || status === "active",
    updatedAt,
    duration,
  };
}

export const generatedBadgeSchema = z.object({
  name: z.string().min(1).max(140),
  description: z.string().max(300),
  domain: z.string().nullable().optional(),
  seriesName: z.string().nullable().optional(),
  level: z.number().int().min(1),
  levelLabel: z.string().nullable().optional(),
  criteria: z.array(z.object({
    label: z.string().min(1),
    description: z.string().optional().default(""),
    expectedOutcome: z.string().min(1),
    sourceModule: z.string().optional(),
    competencyName: z.string().optional(),
  })).min(1),
  competencies: z.array(z.object({
    name: z.string().min(1),
    definition: z.string().min(1),
  })).default([]),
  methods: z.array(z.object({
    id: z.enum(["case_study", "video", "playground", "qcm", "dictation", "pdf_upload"]),
    activityType: z.enum(["sandbox", "situation", "module"]).optional(),
    criterionIndexes: z.array(z.number().int().min(0)).default([]),
    learnerPrompt: z.string().optional().default(""),
    context: z.string().optional(),
    deliverables: z.array(z.object({
      title: z.string(),
      description: z.string().optional().default(""),
      format: z.enum(["text", "file", "video", "link"]).default("text"),
    })).default([]),
  })).default([]),
  durationMin: z.number().int().positive().nullable().optional(),
  questions: z.array(z.object({
    prompt: z.string().min(1),
    choices: z.array(z.object({
      label: z.string().min(1),
      isCorrect: z.boolean(),
    })).min(2),
    criterionIndex: z.number().int().min(0).optional(),
    explanation: z.string().optional(),
  })).default([]),
});

export type GeneratedBadge = z.infer<typeof generatedBadgeSchema>;

export function parseGeneratedBadge(raw: unknown): GeneratedBadge | null {
  const parsed = generatedBadgeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function consigneFor(method: GeneratedBadge["methods"][number], badge: GeneratedBadge): string {
  const labels = method.criterionIndexes.map((index) => badge.criteria[index]?.label).filter(Boolean);
  const outcomes = method.criterionIndexes.map((index) => badge.criteria[index]?.expectedOutcome).filter(Boolean);
  const subject = labels.length ? labels.join(", ") : "le sujet du badge";
  const expected = outcomes.length ? outcomes.join(" ") : "chaque critère est visible dans un exemple concret.";
  return `À partir de la situation qui vous est proposée, montrez que vous savez ${subject}. Votre réponse doit permettre à l'expert de constater ceci : ${expected}`;
}

/** Relie chaque critère à une épreuve, retire les livrables du QCM et complète les consignes trop courtes. */
export function repairGeneratedBadge(badge: GeneratedBadge): GeneratedBadge {
  const methods = badge.methods.map((method) => ({
    ...method,
    criterionIndexes: [...method.criterionIndexes],
    deliverables: method.id === "qcm" ? [] : method.deliverables.filter((item) => item.title.trim()),
  }));
  if (methods.length === 0) {
    methods.push({
      id: "case_study",
      criterionIndexes: [],
      learnerPrompt: "",
      deliverables: [{ title: "Réponse écrite", description: "La réponse du candidat.", format: "text" }],
    });
  }
  const flattened = methods.flatMap((method) => method.criterionIndexes);
  const oneBased = flattened.length > 0
    && flattened.every((index) => index >= 1 && index <= badge.criteria.length)
    && !flattened.includes(0);
  for (const method of methods) {
    method.criterionIndexes = method.criterionIndexes
      .map((index) => (oneBased ? index - 1 : index))
      .filter((index) => index >= 0 && index < badge.criteria.length);
  }
  const covered = new Set(methods.flatMap((method) => method.criterionIndexes));
  const missing = badge.criteria.map((_, index) => index).filter((index) => !covered.has(index));
  const host = methods.find((method) => method.id !== "qcm") ?? methods[0];
  host.criterionIndexes = [...new Set([...host.criterionIndexes, ...missing])];
  const criteria = badge.criteria.map((criterion) => ({
    ...criterion,
    expectedOutcome: criterion.expectedOutcome
      .replace(/\s*\([^)]*\d+\s+mots[^)]*\)/gi, "")
      .replace(/,?\s*(?:en |sur |pour )?(?:au moins|plus de)\s+\d+\s+mots\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/,\s*\./g, ".")
      .replace(/,\s*$/g, ".")
      .trim(),
  }));
  for (const method of methods) {
    const sentences = method.learnerPrompt.split(/[.!?]+/).map((part) => part.trim()).filter((part) => part.length > 12);
    if (method.id === "qcm" && sentences.length < 2) {
      method.learnerPrompt = "Répondez au questionnaire sans document. Chaque question porte sur une notion de la formation, et votre score doit atteindre le seuil indiqué.";
    } else if (method.learnerPrompt.trim().length < 80 || sentences.length < 2) {
      method.learnerPrompt = consigneFor(method, badge);
    }
  }
  const description = badge.description.length >= 280 && !/[.!?]$/.test(badge.description.trim())
    ? (() => {
      const cut = badge.description.slice(0, 300);
      const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
      if (last > 80) return cut.slice(0, last + 1);
      const space = cut.lastIndexOf(" ");
      return space > 80 ? `${cut.slice(0, space).replace(/[,:;]$/, "")}.` : cut;
    })()
    : badge.description;
  return { ...badge, criteria, methods, description };
}

export function materializeGeneratedBadge(badge: GeneratedBadge, library: ByoundCompetency[]) {
  badge = repairGeneratedBadge(badge);
  const competencies = badge.competencies.map((item) => {
    const existing = suggestCompetency(item.name, library);
    if (existing) return existing;
    return {
      id: crypto.randomUUID(),
      slug: slugify(item.name),
      name: item.name,
      definition: item.definition,
      domainId: null,
      status: "draft" as const,
      validatedBy: null,
      validatedAt: null,
      archivedAt: null,
    };
  });
  const criteria = badge.criteria.map((item, index) => {
    const skill = suggestCompetency(item.competencyName ?? "", competencies);
    return {
      id: crypto.randomUUID(),
      label: item.label,
      description: item.sourceModule?.trim()
        ? `Source : ${item.sourceModule.trim()}`
        : (item.description ?? ""),
      expectedOutcome: item.expectedOutcome,
      competencyId: skill?.id ?? null,
      sortOrder: index,
    };
  });
  const practices: Record<string, MethodPractice> = {};
  const configs: BadgeMethodConfig[] = [];
  const methodIds: string[] = [];
  for (const method of badge.methods) {
    if (!isBadgeEvaluationMethodId(method.id) || methodIds.includes(method.id)) continue;
    methodIds.push(method.id);
    const ids = method.criterionIndexes.map((index) => criteria[index]?.id).filter((id): id is string => Boolean(id));
    const weights = resolvedWeights(ids, {});
    const deliverables: BadgeDeliverableDraft[] = method.id === "qcm"
      ? []
      : method.deliverables
        .filter((item) => item.title.trim() && !/quiz de connaissances/i.test(item.title))
        .map((item) => ({ id: crypto.randomUUID(), title: item.title, description: item.description ?? "", format: item.format }));
    practices[method.id] = {
      criteria: ids.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })),
      deliverables,
    };
    const config = defaultMethodConfig(method.id);
    config.evaluationPrompt = method.learnerPrompt;
    if (method.id === "case_study" && config.caseStudy) {
      config.caseStudy.context = method.context ?? "";
      config.caseStudy.learnerPrompt = method.learnerPrompt;
    }
    if (method.id === "playground" && config.playground) config.playground.learnerPrompt = method.learnerPrompt;
    if (method.id !== "qcm" && method.id !== "case_study" && method.id !== "playground") config.learnerInstruction = method.learnerPrompt;
    if (method.id === "qcm" && config.quiz) {
      const questions = badge.questions.map((question) => {
        const correct = question.choices.filter((choice) => choice.isCorrect).length;
        return {
          id: crypto.randomUUID(),
          prompt: question.prompt,
          explanation: question.explanation ?? "",
          questionType: (correct > 1 ? "multiple" : "single") as "multiple" | "single",
          reviewStatus: "to_review" as const,
          criterionId: criteria[question.criterionIndex ?? 0]?.id,
          choices: question.choices.map((choice) => ({ id: crypto.randomUUID(), label: choice.label, isCorrect: choice.isCorrect })),
        };
      });
      const asked = Math.min(5, Math.max(4, Math.floor(questions.length / 3) || questions.length));
      config.quiz = {
        ...config.quiz,
        generationMode: "scratch",
        passingScorePercent: 80,
        randomDraw: true,
        questionCount: Math.min(asked, Math.max(1, questions.length)),
        questions,
      };
    }
    configs.push(config);
  }
  const reviewCount = criteria.length + badge.questions.length;
  return { criteria, competencies, practices, configs, methodIds, reviewCount };
}

export const GENERATION_JSON_SHAPE = `{
  "name": "titre court",
  "description": "une ou deux phrases, 300 caractères maximum, pour un recruteur",
  "domain": "nom de domaine ou null",
  "seriesName": "nom de série, par exemple AI Prompting",
  "level": 1,
  "levelLabel": "Initié ou null",
  "criteria": [{"label": "titre", "description": "précision", "expectedOutcome": "ce que l'expert doit constater"}],
  "competencies": [{"name": "compétence", "definition": "deux ou trois phrases"}],
  "methods": [{"id": "case_study|video|playground|qcm|dictation|pdf_upload", "criterionIndexes": [0], "learnerPrompt": "consigne complète de deux phrases minimum, jamais seulement le titre", "deliverables": [{"title": "livrable", "description": "", "format": "text|file|video|link"}]}],
  "durationMin": 45,
  "questions": [{"prompt": "question nouvelle", "choices": [{"label": "réponse", "isCorrect": true}], "criterionIndex": 0}]
}`;
