/** Scores soft skills archivés dans profiles.cross_profile_completion (badge croisé). */

export function parseSoftScoresFromCrossProfileCompletion(
  raw: unknown,
): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const sig = (raw as Record<string, unknown>).tests_signature;
  if (typeof sig !== "string" || !sig.trim()) return null;

  try {
    const parsed = JSON.parse(sig) as { soft?: unknown };
    const soft = parsed.soft;
    if (!Array.isArray(soft)) return null;

    const out: Record<string, number> = {};
    for (const item of soft) {
      if (Array.isArray(item) && item.length >= 2) {
        const label = String(item[0] ?? "").trim();
        const score = Number(item[1]);
        if (label && Number.isFinite(score) && score > 0) out[label] = score;
        continue;
      }
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const row = item as Record<string, unknown>;
        const label = String(row.skill ?? row.label ?? row.name ?? "").trim();
        const score = Number(row.score ?? row.value);
        if (label && Number.isFinite(score) && score > 0) out[label] = score;
      }
    }

    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** Normalise un score archivé (0–100) ou natif (/15) vers une échelle /15 pour l’UI. */
export function normalizeArchivedSoftSkillScore(score: number): number {
  if (score > 15) return Math.round((score / 100) * 15);
  return Math.round(score);
}
