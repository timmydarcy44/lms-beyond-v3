export type PassageMeta = {
  level: number;
  competencies: string[];
  criteria: Array<{ label: string; outcome: string }>;
  attempts: number;
  retryDelayDays: number;
  reviewSlaDays: number;
  accommodations: boolean;
  integrityCheck: boolean;
  integrityToleranceSec: number;
  integrityToleratedLeaves: 0 | 1;
  integrityConsequence: "attempt" | "note";
};

export function passageMetaFromBadge(badge: {
  level?: number | null;
  criteria?: unknown;
  builder?: unknown;
}): PassageMeta {
  const builder =
    badge.builder && typeof badge.builder === "object"
      ? (badge.builder as Record<string, unknown>)
      : {};
  const exam =
    builder.exam && typeof builder.exam === "object"
      ? (builder.exam as Record<string, unknown>)
      : {};
  const competencies = Array.isArray(builder.competencies)
    ? builder.competencies
        .map((item) => (item && typeof item === "object" ? String((item as { name?: string }).name ?? "") : ""))
        .filter(Boolean)
    : [];
  const criteria = Array.isArray(badge.criteria)
    ? badge.criteria
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as { label?: string; expectedOutcome?: string; description?: string };
          const label = String(row.label ?? "").trim();
          if (!label) return null;
          return { label, outcome: String(row.expectedOutcome ?? row.description ?? "").trim() };
        })
        .filter((item): item is { label: string; outcome: string } => Boolean(item))
    : [];

  return {
    level: badge.level && badge.level > 0 ? badge.level : 1,
    competencies,
    criteria,
    attempts: Number(exam.attempts ?? 3) || 3,
    retryDelayDays: Number(exam.retryDelayDays ?? 7) || 7,
    reviewSlaDays: Number(exam.reviewSlaDays ?? 5) || 5,
    accommodations: exam.accommodations !== false,
    integrityCheck: exam.integrityCheck !== false,
    integrityToleranceSec: Math.min(5, Math.max(0, Number(exam.integrityToleranceSec ?? 2) || 0)),
    integrityToleratedLeaves: exam.integrityToleratedLeaves === 0 ? 0 : 1,
    integrityConsequence: exam.integrityConsequence === "note" ? "note" : "attempt",
  };
}

export function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let left = Math.max(0, days);
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

export function formatFrenchDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
