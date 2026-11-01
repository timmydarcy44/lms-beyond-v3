export const BADGE_DOMAINS = [
  "Intelligence artificielle",
  "Management",
  "Commercial",
  "Sport",
  "Care",
  "Communication",
  "Industrie",
] as const;

export const ACHIEVEMENT_TYPES = [
  {
    id: "Competency",
    label: "Compétence",
    hint: "Une compétence démontrée par une épreuve.",
  },
  {
    id: "Certification",
    label: "Certification",
    hint: "Un parcours complet validé par un expert.",
  },
  {
    id: "Achievement",
    label: "Participation",
    hint: "Présence à une formation ou un événement.",
  },
] as const;

export type AchievementTypeId = (typeof ACHIEVEMENT_TYPES)[number]["id"];
export type ValidityMode = "permanent" | "12" | "24" | "custom";

export type AccessMode = "all" | "org" | "invite";
export type DeliverableFormat = "text" | "file" | "video" | "link";

export type BadgeDeliverableDraft = {
  id: string;
  title: string;
  description: string;
  format: DeliverableFormat;
};

export type MethodCriterionLink = {
  criterionId: string;
  weight: number;
};

export type MethodPractice = {
  criteria: MethodCriterionLink[];
  deliverables: BadgeDeliverableDraft[];
};

export type BadgeExamState = {
  accessMode: AccessMode;
  prerequisiteBadgeIds: string[];
  prerequisiteCourseIds: string[];
  /** Ancien champ, conservé à la lecture. Les poids vivent dans practices. */
  weights: Record<string, number>;
  /** Ancien champ, conservé à la lecture. Les livrables vivent dans practices. */
  deliverables: BadgeDeliverableDraft[];
  practices: Record<string, MethodPractice>;
  requirePractice: boolean;
  passMode: "all" | "threshold";
  passCount: number;
  attempts: number;
  retryDelayDays: number;
  durationMin: number | null;
  reviewSlaDays: number;
  accommodations: boolean;
  aiPrecheck: boolean;
  integrityCheck: boolean;
  /** Tolérance d'une sortie, en secondes (0 à 5). */
  integrityToleranceSec: number;
  /** Nombre de sorties courtes tolérées : 0 ou 1. */
  integrityToleratedLeaves: 0 | 1;
  /** attempt = l'épreuve s'arrête ; note = signalement seul. */
  integrityConsequence: "attempt" | "note";
  deliverablesVisible: boolean;
  promptCustom: Record<string, boolean>;
};

export function emptyExamState(): BadgeExamState {
  return {
    accessMode: "all",
    prerequisiteBadgeIds: [],
    prerequisiteCourseIds: [],
    weights: {},
    deliverables: [],
    practices: {},
    requirePractice: false,
    passMode: "all",
    passCount: 1,
    attempts: 3,
    retryDelayDays: 7,
    durationMin: null,
    reviewSlaDays: 5,
    accommodations: true,
    aiPrecheck: true,
    integrityCheck: true,
    integrityToleranceSec: 2,
    integrityToleratedLeaves: 1,
    integrityConsequence: "attempt",
    deliverablesVisible: true,
    promptCustom: {},
  };
}

export type ByoundCompetencyDraft = {
  id: string;
  slug: string;
  name: string;
  definition: string;
  domainId: string | null;
  status: "draft" | "validated";
  validatedBy: string | null;
  validatedAt: string | null;
  archivedAt: string | null;
};

export type BadgeBuilderState = {
  version: number;
  parentBadgeId: string | null;
  domain: string | null;
  domainId: string | null;
  domainColor: string | null;
  domainIcon: string | null;
  seriesId: string | null;
  seriesName: string | null;
  levelLabel: string | null;
  achievementType: AchievementTypeId;
  validityMode: ValidityMode;
  validityMonths: number | null;
  associatedCourseId: string | null;
  linkedCourseId: string | null;
  courseRequiredBeforeExam: boolean;
  fallbackCourseId: string | null;
  linkedCourseUpdatedAt: string | null;
  linkedCourseFingerprint: string | null;
  lockedPrerequisiteBadgeIds: string[];
  generated: boolean;
  reviewedCriterionIds: string[];
  reviewedCompetencyIds: string[];
  skills: string[];
  competencies: ByoundCompetencyDraft[];
  catalog: unknown;
  exam: BadgeExamState;
};

export const emptyBuilderState = (): BadgeBuilderState => ({
  version: 1,
  parentBadgeId: null,
  domain: null,
  domainId: null,
  domainColor: null,
  domainIcon: null,
  seriesId: null,
  seriesName: null,
  levelLabel: null,
  achievementType: "Competency",
  validityMode: "permanent",
  validityMonths: null,
  associatedCourseId: null,
  linkedCourseId: null,
  courseRequiredBeforeExam: false,
  fallbackCourseId: null,
  linkedCourseUpdatedAt: null,
  linkedCourseFingerprint: null,
  lockedPrerequisiteBadgeIds: [],
  generated: false,
  reviewedCriterionIds: [],
  reviewedCompetencyIds: [],
  skills: [],
  competencies: [],
  catalog: null,
  exam: emptyExamState(),
});

export function isAchievementTypeId(value: string): value is AchievementTypeId {
  return ACHIEVEMENT_TYPES.some((item) => item.id === value);
}

export function achievementLabel(id: string | null | undefined): string {
  return ACHIEVEMENT_TYPES.find((item) => item.id === id)?.label ?? "Compétence";
}

export function expiresAfterDays(mode: ValidityMode, customMonths: number | null): number | null {
  if (mode === "12") return 365;
  if (mode === "24") return 730;
  if (mode === "custom" && customMonths && customMonths > 0) {
    return Math.round(customMonths * 30.4375);
  }
  return null;
}

export function validityFromDays(days: unknown): { mode: ValidityMode; months: number | null } {
  const value = typeof days === "number" ? days : null;
  if (value == null) return { mode: "permanent", months: null };
  if (value === 365) return { mode: "12", months: 12 };
  if (value === 730) return { mode: "24", months: 24 };
  return { mode: "custom", months: Math.max(1, Math.round(value / 30.4375)) };
}

export function validityLabel(mode: ValidityMode, months: number | null): string {
  if (mode === "12") return "12 mois";
  if (mode === "24") return "24 mois";
  if (mode === "custom" && months) return `${months} mois`;
  return "Permanent";
}

export function readBuilderState(raw: unknown, expiresDays?: unknown): BadgeBuilderState {
  const base = emptyBuilderState();
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const achievement = String(source.achievementType ?? "");
  const mode = String(source.validityMode ?? "");
  const fromDays = validityFromDays(expiresDays);
  return {
    version: typeof source.version === "number" && source.version > 0 ? source.version : 1,
    parentBadgeId: typeof source.parentBadgeId === "string" ? source.parentBadgeId : null,
    domain: typeof source.domain === "string" && source.domain.trim() ? source.domain : null,
    domainId: typeof source.domainId === "string" ? source.domainId : null,
    domainColor: typeof source.domainColor === "string" ? source.domainColor : null,
    domainIcon: typeof source.domainIcon === "string" ? source.domainIcon : null,
    seriesId: typeof source.seriesId === "string" ? source.seriesId : null,
    seriesName: typeof source.seriesName === "string" && source.seriesName.trim() ? source.seriesName.trim() : null,
    levelLabel: typeof source.levelLabel === "string" && source.levelLabel.trim() ? source.levelLabel.trim() : null,
    achievementType: isAchievementTypeId(achievement) ? achievement : "Competency",
    validityMode: mode === "12" || mode === "24" || mode === "custom" || mode === "permanent" ? mode : fromDays.mode,
    validityMonths:
      typeof source.validityMonths === "number"
        ? source.validityMonths
        : fromDays.months,
    associatedCourseId:
      typeof source.linkedCourseId === "string" && source.linkedCourseId.trim()
        ? source.linkedCourseId
        : typeof source.associatedCourseId === "string" && source.associatedCourseId.trim()
          ? source.associatedCourseId
          : null,
    linkedCourseId:
      typeof source.linkedCourseId === "string" && source.linkedCourseId.trim()
        ? source.linkedCourseId
        : typeof source.associatedCourseId === "string" && source.associatedCourseId.trim()
          ? source.associatedCourseId
          : null,
    courseRequiredBeforeExam: source.courseRequiredBeforeExam === true,
    fallbackCourseId: typeof source.fallbackCourseId === "string" && source.fallbackCourseId.trim() ? source.fallbackCourseId : null,
    linkedCourseUpdatedAt: typeof source.linkedCourseUpdatedAt === "string" ? source.linkedCourseUpdatedAt : null,
    linkedCourseFingerprint: typeof source.linkedCourseFingerprint === "string" ? source.linkedCourseFingerprint : null,
    lockedPrerequisiteBadgeIds: Array.isArray(source.lockedPrerequisiteBadgeIds) ? source.lockedPrerequisiteBadgeIds.map(String) : [],
    generated: source.generated === true,
    reviewedCriterionIds: Array.isArray(source.reviewedCriterionIds) ? source.reviewedCriterionIds.map(String) : [],
    reviewedCompetencyIds: Array.isArray(source.reviewedCompetencyIds) ? source.reviewedCompetencyIds.map(String) : [],
    skills: Array.isArray(source.skills) ? source.skills.map((item) => String(item)).filter(Boolean) : [],
    competencies: readCompetencies(source),
    catalog: source.catalog && typeof source.catalog === "object" ? source.catalog : null,
    exam: readExam(source.exam),
  };
}

export function resolvedWeights(ids: string[], stored: Record<string, number> | undefined): Record<string, number> {
  if (ids.length === 0) return {};
  const sum = ids.reduce((total, id) => total + (stored?.[id] ?? 0), 0);
  const complete = ids.every((id) => typeof stored?.[id] === "number") && sum === 100;
  if (complete && stored) return Object.fromEntries(ids.map((id) => [id, stored[id]]));
  const base = Math.floor(100 / ids.length);
  const extra = 100 - base * ids.length;
  return Object.fromEntries(ids.map((id, index) => [id, base + (index < extra ? 1 : 0)]));
}

export function setCriterionWeight(
  ids: string[],
  stored: Record<string, number>,
  id: string,
  value: number,
): Record<string, number> {
  const current = resolvedWeights(ids, stored);
  if (ids.length <= 1) return { [id]: 100 };
  const nextValue = Math.min(100, Math.max(0, Math.round(value)));
  const others = ids.filter((item) => item !== id);
  const rest = 100 - nextValue;
  const othersTotal = others.reduce((total, item) => total + current[item], 0) || others.length;
  const next: Record<string, number> = { ...current, [id]: nextValue };
  let used = nextValue;
  others.forEach((item, index) => {
    if (index === others.length - 1) {
      next[item] = Math.max(0, 100 - used);
      return;
    }
    const share = Math.max(0, Math.round((rest * current[item]) / othersTotal));
    next[item] = share;
    used += share;
  });
  return next;
}

export type PublishCheck = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  step: number;
};

export function publishChecklist(input: {
  name: string;
  level: string;
  description: string;
  criteria: Array<{ label: string; expectedOutcome?: string | null }>;
  competencies: Array<{ name: string; status?: string | null }>;
  methods: string[];
  instructionsComplete: boolean;
  questionsReviewed: boolean;
  deliverableCount: number;
  uncoveredCount: number;
  qcmOnlyCount: number;
  hasExpert: boolean;
  hasDelay: boolean;
  hasImage: boolean;
}): PublishCheck[] {
  const titled = input.criteria.filter((item) => item.label.trim());
  return [
    { id: "identity", label: "Nom et niveau", ok: Boolean(input.name.trim() && input.level), required: true, step: 1 },
    { id: "description", label: "Description", ok: Boolean(input.description.trim()), required: true, step: 1 },
    {
      id: "criteria",
      label: "Critères, chacun avec un attendu",
      ok: titled.length > 0 && titled.every((item) => (item.expectedOutcome ?? "").trim()),
      required: true,
      step: 2,
    },
    {
      id: "skills",
      label: "Compétences visées",
      ok: input.competencies.some((item) => item.name.trim()),
      required: true,
      step: 2,
    },
    {
      id: "competency-validation",
      label: "Une compétence est encore en brouillon",
      ok: input.competencies.filter((item) => item.name.trim()).every((item) => item.status === "validated"),
      required: true,
      step: 2,
    },
    {
      id: "exam",
      label: "Épreuve : consignes complètes et questions relues",
      ok: input.methods.length > 0 && input.instructionsComplete && input.questionsReviewed,
      required: true,
      step: 2,
    },
    {
      id: "coverage",
      label: input.uncoveredCount > 0 ? `${input.uncoveredCount} critère${input.uncoveredCount > 1 ? "s" : ""} non couvert${input.uncoveredCount > 1 ? "s" : ""}` : "Tous les critères sont couverts",
      ok: input.uncoveredCount === 0 && input.criteria.some((item) => item.label.trim()),
      required: true,
      step: 2,
    },
    ...(input.qcmOnlyCount > 0
      ? [{
          id: "qcm-only",
          label: `${input.qcmOnlyCount} critère${input.qcmOnlyCount > 1 ? "s" : ""} seulement couvert${input.qcmOnlyCount > 1 ? "s" : ""} par le questionnaire · à renforcer`,
          ok: false,
          required: false,
          step: 2,
        }]
      : []),
    { id: "deliverables", label: "Livrables", ok: input.deliverableCount > 0, required: false, step: 2 },
    { id: "expert", label: "Expert et délai de correction", ok: input.hasExpert && input.hasDelay, required: true, step: 2 },
    { id: "image", label: "Visuel personnalisé", ok: Boolean(input.hasImage), required: false, step: 1 },
  ];
}

function readDeliverables(raw: unknown): BadgeDeliverableDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const format: DeliverableFormat =
      row.format === "file" || row.format === "video" || row.format === "link" ? row.format : "text";
    return [{
      id: typeof row.id === "string" && row.id ? row.id : crypto.randomUUID(),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      format,
    }];
  });
}

function readPractices(raw: unknown): Record<string, MethodPractice> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).flatMap(([methodId, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const row = value as { criteria?: unknown; deliverables?: unknown };
      const criteria = Array.isArray(row.criteria)
        ? row.criteria.flatMap((item) => {
            if (!item || typeof item !== "object") return [];
            const link = item as { criterionId?: string; weight?: number };
            if (!link.criterionId) return [];
            return [{ criterionId: link.criterionId, weight: Number(link.weight) || 0 }];
          })
        : [];
      return [[methodId, { criteria, deliverables: readDeliverables(row.deliverables) }]];
    }),
  );
}

function readExam(raw: unknown): BadgeExamState {
  const base = emptyExamState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const source = raw as Record<string, unknown>;
  const access = String(source.accessMode ?? "");
  const weights = source.weights && typeof source.weights === "object" && !Array.isArray(source.weights)
    ? Object.fromEntries(
        Object.entries(source.weights as Record<string, unknown>)
          .map(([key, value]) => [key, Number(value)])
          .filter((entry) => Number.isFinite(entry[1])),
      )
    : {};
  const deliverables = readDeliverables(source.deliverables);
  return {
    ...base,
    accessMode: access === "org" || access === "invite" || access === "all" ? access : "all",
    prerequisiteBadgeIds: Array.isArray(source.prerequisiteBadgeIds) ? source.prerequisiteBadgeIds.map(String) : [],
    prerequisiteCourseIds: Array.isArray(source.prerequisiteCourseIds) ? source.prerequisiteCourseIds.map(String) : [],
    weights,
    deliverables,
    practices: readPractices(source.practices),
    requirePractice: source.requirePractice === true,
    passMode: source.passMode === "threshold" ? "threshold" : "all",
    passCount: typeof source.passCount === "number" ? source.passCount : 1,
    attempts: typeof source.attempts === "number" ? source.attempts : 1,
    retryDelayDays: typeof source.retryDelayDays === "number" ? source.retryDelayDays : 0,
    durationMin: typeof source.durationMin === "number" ? source.durationMin : null,
    reviewSlaDays: typeof source.reviewSlaDays === "number" ? source.reviewSlaDays : 5,
    accommodations: source.accommodations === true,
    aiPrecheck: source.aiPrecheck === true,
    integrityCheck: source.integrityCheck !== false,
    integrityToleranceSec: Math.min(5, Math.max(0, Number(source.integrityToleranceSec ?? 2) || 0)),
    integrityToleratedLeaves: source.integrityToleratedLeaves === 0 ? 0 : 1,
    integrityConsequence: source.integrityConsequence === "note" ? "note" : "attempt",
    deliverablesVisible: source.deliverablesVisible !== false,
    promptCustom: source.promptCustom && typeof source.promptCustom === "object"
      ? Object.fromEntries(Object.entries(source.promptCustom as Record<string, unknown>).map(([key, value]) => [key, value === true]))
      : {},
  };
}

function competencySlug(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "competence";
}

export function readCompetencies(source: { competencies?: unknown; skills?: unknown }): ByoundCompetencyDraft[] {
  if (Array.isArray(source.competencies) && source.competencies.length > 0) {
    return source.competencies.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      if (!name) return [];
      const status = row.status === "draft" ? "draft" : "validated";
      return [{
        id: typeof row.id === "string" && row.id ? row.id : crypto.randomUUID(),
        slug: typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : competencySlug(name),
        name,
        definition: String(row.definition ?? "").trim(),
        domainId: typeof row.domainId === "string" ? row.domainId : null,
        status,
        validatedBy: typeof row.validatedBy === "string" ? row.validatedBy : null,
        validatedAt: typeof row.validatedAt === "string" ? row.validatedAt : null,
        archivedAt: typeof row.archivedAt === "string" ? row.archivedAt : null,
      }];
    });
  }
  if (!Array.isArray(source.skills)) return [];
  return source.skills.flatMap((item) => {
    const name = String(item ?? "").trim();
    if (!name) return [];
    return [{
      id: crypto.randomUUID(),
      slug: competencySlug(name),
      name,
      definition: "",
      domainId: null,
      status: "validated" as const,
      validatedBy: null,
      validatedAt: null,
      archivedAt: null,
    }];
  });
}

export async function cropSquareBadgeImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  if (side < 600) {
    bitmap.close();
    throw new Error("Image trop petite. Il faut au moins 600 px de côté.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Recadrage impossible.");
  }
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, side, side);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Recadrage impossible.");
  return new File([blob], "badge.png", { type: "image/png" });
}
