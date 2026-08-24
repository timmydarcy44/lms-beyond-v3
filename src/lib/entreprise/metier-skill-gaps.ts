/** Écarts soft skills entre fiche métier (cible) et résultats collaborateur. */

export type MetierSoftSkillTarget = {
  label: string;
  target: number;
};

export type SoftSkillGap = {
  skill: string;
  target: number;
  actual: number | null;
  gap: number | null;
  status: "ok" | "attention" | "critical" | "missing";
};

export function parseMetierSoftSkillTargets(values: string[] | null | undefined): MetierSoftSkillTarget[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((raw) => {
      const value = String(raw ?? "").trim();
      if (!value) return null;
      const [labelPart, scoreRaw] = value.split("::");
      const label = (labelPart || value).trim();
      if (!label) return null;
      const parsed = Number(scoreRaw);
      return {
        label,
        target: Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 75,
      };
    })
    .filter((item): item is MetierSoftSkillTarget => Boolean(item));
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findSoftSkillScore(
  softSkills: Array<{ skill: string; score: number }> | null | undefined,
  label: string,
): number | null {
  if (!Array.isArray(softSkills) || softSkills.length === 0) return null;
  const needle = normalizeLabel(label);
  const exact = softSkills.find((item) => normalizeLabel(item.skill) === needle);
  if (exact) return Math.max(0, Math.min(100, Number(exact.score) || 0));
  const partial = softSkills.find(
    (item) =>
      normalizeLabel(item.skill).includes(needle) || needle.includes(normalizeLabel(item.skill)),
  );
  if (partial) return Math.max(0, Math.min(100, Number(partial.score) || 0));
  return null;
}

export function computeSoftSkillGaps(
  targets: MetierSoftSkillTarget[],
  softSkills: Array<{ skill: string; score: number }> | null | undefined,
): SoftSkillGap[] {
  return targets.map((target) => {
    const actual = findSoftSkillScore(softSkills, target.label);
    if (actual == null) {
      return {
        skill: target.label,
        target: target.target,
        actual: null,
        gap: null,
        status: "missing" as const,
      };
    }
    const gap = actual - target.target;
    const status =
      gap >= -5 ? ("ok" as const) : gap >= -15 ? ("attention" as const) : ("critical" as const);
    return {
      skill: target.label,
      target: target.target,
      actual,
      gap,
      status,
    };
  });
}

export function gapStatusLabel(status: SoftSkillGap["status"]) {
  if (status === "ok") return "Aligné";
  if (status === "attention") return "Écart moyen";
  if (status === "critical") return "Écart fort";
  return "Non mesuré";
}
