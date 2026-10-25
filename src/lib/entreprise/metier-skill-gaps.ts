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
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

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

const LABEL_STOPWORDS = new Set(["de", "des", "du", "et", "la", "le", "les", "en", "au", "aux", "un", "une"]);

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function skillTokens(value: string) {
  return normalizeLabel(value)
    .split(" ")
    .filter((token) => token.length > 2 && !LABEL_STOPWORDS.has(token));
}

const SOFT_SKILL_CATALOG = SOFT_SKILLS.map((skill) => ({
  id: skill.id,
  key: normalizeLabel(skill.titre),
  tokens: skillTokens(skill.titre),
}));

/** Identifiant du référentiel testé, via le titre ou un alias (« de » / « des », libellé court unique). */
export function resolveSoftSkillCatalogId(label: string): number | null {
  const key = normalizeLabel(label);
  const exact = SOFT_SKILL_CATALOG.find((skill) => skill.key === key);
  if (exact) return exact.id;
  const tokens = skillTokens(label);
  if (tokens.length === 0) return null;
  const tokenKey = tokens.join(" ");
  const sameTokens = SOFT_SKILL_CATALOG.filter((skill) => skill.tokens.join(" ") === tokenKey);
  if (sameTokens.length === 1) return sameTokens[0]!.id;
  const subset = SOFT_SKILL_CATALOG.filter((skill) => tokens.every((token) => skill.tokens.includes(token)));
  if (subset.length === 1) return subset[0]!.id;
  return null;
}

export function findSoftSkillScore(
  softSkills: Array<{ skill: string; score: number }> | null | undefined,
  label: string,
): number | null {
  if (!Array.isArray(softSkills) || softSkills.length === 0) return null;
  const catalogId = resolveSoftSkillCatalogId(label);
  if (catalogId == null) return null;
  const match = softSkills.find((item) => resolveSoftSkillCatalogId(item.skill) === catalogId);
  if (!match || !Number.isFinite(Number(match.score))) return null;
  return normalizeObservedToScale15(Number(match.score));
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

export type FicheGapBand = "work" | "close" | "reached" | "missing";

/** Même découpage que la liste des écarts : ≤ −2 à travailler, −1 proche, ≥ 0 atteint. */
export function ficheGapBand(gap: Pick<SoftSkillGap, "actual" | "gap">): FicheGapBand {
  if (gap.actual == null || gap.gap == null) return "missing";
  if (gap.gap <= -2) return "work";
  if (gap.gap < 0) return "close";
  return "reached";
}

export function summarizeFicheGaps(gaps: SoftSkillGap[]) {
  const measured = gaps.filter((gap) => gap.actual != null);
  return {
    measured,
    work: measured.filter((gap) => ficheGapBand(gap) === "work").sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0)),
    close: measured.filter((gap) => ficheGapBand(gap) === "close").sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0)),
    reached: measured.filter((gap) => ficheGapBand(gap) === "reached"),
    missing: gaps.filter((gap) => ficheGapBand(gap) === "missing"),
  };
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
