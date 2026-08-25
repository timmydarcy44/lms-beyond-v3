/**
 * Soft Skill gaps métier ↔ collaborateur — échelle unifiée /15.
 * Réutilise le format métier `Label::score` (score désormais /15 ; legacy /100 converti).
 */

import {
  classifyGapSeverity,
  gapSeverityLabel,
  normalizeObservedToScale15,
  normalizeTargetToScale15,
  SKILLS_GAP_DEFAULT_TARGET,
  SKILLS_GAP_SCORE_MAX,
  type GapSeverity,
} from "@/lib/entreprise/skills-gap-config";

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
  severity: GapSeverity | "missing";
  /** Source conceptuelle pour évolution (soft_skill_test, etc.). */
  observedSource: "soft_skill_test" | null;
  targetSource: "metier_soft_skills";
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
        target: Number.isFinite(parsed)
          ? normalizeTargetToScale15(parsed)
          : SKILLS_GAP_DEFAULT_TARGET,
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
  if (exact) return normalizeObservedToScale15(Number(exact.score) || 0);
  const partial = softSkills.find(
    (item) =>
      normalizeLabel(item.skill).includes(needle) || needle.includes(normalizeLabel(item.skill)),
  );
  if (partial) return normalizeObservedToScale15(Number(partial.score) || 0);
  return null;
}

function severityToLegacyStatus(severity: GapSeverity): SoftSkillGap["status"] {
  if (severity === "conforme" || severity === "leger") return "ok";
  if (severity === "modere") return "attention";
  return "critical";
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
        severity: "missing" as const,
        observedSource: null,
        targetSource: "metier_soft_skills" as const,
      };
    }
    const gap = actual - target.target;
    const severity = classifyGapSeverity(gap);
    return {
      skill: target.label,
      target: target.target,
      actual,
      gap,
      status: severityToLegacyStatus(severity),
      severity,
      observedSource: "soft_skill_test",
      targetSource: "metier_soft_skills",
    };
  });
}

export function gapStatusLabel(status: SoftSkillGap["status"]) {
  if (status === "ok") return "Aligné";
  if (status === "attention") return "Écart moyen";
  if (status === "critical") return "Écart fort";
  return "Non mesuré";
}

export function formatScoreOn15(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return `—/${SKILLS_GAP_SCORE_MAX}`;
  return `${Math.round(value * 10) / 10}/${SKILLS_GAP_SCORE_MAX}`;
}

export function formatGap(gap: number | null | undefined): string {
  if (gap == null || !Number.isFinite(gap)) return "—";
  const rounded = Math.round(gap * 10) / 10;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

export { gapSeverityLabel };
