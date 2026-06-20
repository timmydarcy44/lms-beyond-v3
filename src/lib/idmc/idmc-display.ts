export type AxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";

export const AXES_LABELS: Record<AxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l'information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

export const IDMC_AXIS_KEYS: AxisKey[] = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];

export function normalizeIdmcAxisScore(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>;
    for (const key of ["value", "score", "percent", "percentage"] as const) {
      const nested = candidate[key];
      if (typeof nested === "number" && Number.isFinite(nested)) return Math.round(nested);
    }
  }
  return 0;
}

export function resolveIdmcAxisMasteryLevel(score: number): string {
  if (score < 40) return "Maîtrise à construire";
  if (score < 60) return "Maîtrise en développement";
  if (score < 80) return "Maîtrise opérationnelle";
  return "Maîtrise experte";
}

export function normalizeIdmcAxesRecord(raw: unknown): Record<AxisKey, number> | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;

  if (candidate.axes && typeof candidate.axes === "object") {
    const axes = candidate.axes as Record<string, unknown>;
    const normalized = {} as Record<AxisKey, number>;
    for (const key of IDMC_AXIS_KEYS) {
      normalized[key] = normalizeIdmcAxisScore(axes[key]);
    }
    return normalized;
  }

  if (candidate.points && typeof candidate.points === "object") {
    const points = candidate.points as Record<string, unknown>;
    const normalized = {} as Record<AxisKey, number>;
    for (const key of IDMC_AXIS_KEYS) {
      const pt = normalizeIdmcAxisScore(points[key]);
      normalized[key] = Math.round((pt / 15) * 100);
    }
    return normalized;
  }

  const hasAllAxes = IDMC_AXIS_KEYS.every((key) => key in candidate);
  if (hasAllAxes) {
    const normalized = {} as Record<AxisKey, number>;
    for (const key of IDMC_AXIS_KEYS) {
      normalized[key] = normalizeIdmcAxisScore(candidate[key]);
    }
    return normalized;
  }

  return null;
}

export const resolveIdmcAxes = (scores: unknown): Record<AxisKey, number> | null => {
  return normalizeIdmcAxesRecord(scores);
};

export function formatIdmcAxisScoreLine(axisKey: AxisKey, score: number): string {
  return `${score}/100 — ${AXES_LABELS[axisKey]} — ${resolveIdmcAxisMasteryLevel(score)}`;
}

export function listIdmcAxisScoreLines(
  axes: Record<AxisKey, number>,
): Array<{ key: AxisKey; score: number; line: string }> {
  return IDMC_AXIS_KEYS.map((key) => {
    const score = normalizeIdmcAxisScore(axes[key]);
    return { key, score, line: formatIdmcAxisScoreLine(key, score) };
  });
}

export function resolveIdmcGlobalMasteryLevel(axes: Record<AxisKey, number>): string {
  const values = IDMC_AXIS_KEYS.map((key) => normalizeIdmcAxisScore(axes[key]));
  const average = values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
  return resolveIdmcAxisMasteryLevel(average);
}
