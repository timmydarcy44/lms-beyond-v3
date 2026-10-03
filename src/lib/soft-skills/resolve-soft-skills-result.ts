import type { SupabaseClient } from "@supabase/supabase-js";

import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export const SOFT_SKILLS_META_KEYS = new Set(["variant"]);

export type SoftSkillsResultSource = "apprenant" | "salarie";

export const SOFT_SKILLS_TABLE_BY_SOURCE: Record<SoftSkillsResultSource, string> = {
  apprenant: "soft_skills_resultats",
  salarie: "soft_skills_resultats_salarie",
};

export type SoftSkillsResultRow = {
  scores: unknown;
  taken_at: string | null;
};

export type SoftSkillsResultRecord = SoftSkillsResultRow & {
  learner_id?: string;
  total_score?: number | null;
  answers?: unknown;
  ai_analysis?: string | null;
};

export type ResolvedSoftSkillsResult<T extends SoftSkillsResultRow = SoftSkillsResultRecord> = {
  source: SoftSkillsResultSource;
  row: T;
};

/** Garde le résultat le plus récent entre apprenant et salarié (pas de fusion des scores). */
export function pickLatestSoftSkillsRow<T extends SoftSkillsResultRow>(
  apprenant: T | null | undefined,
  salarie: T | null | undefined,
): T | null {
  return resolveSoftSkillsResultSource(apprenant, salarie)?.row ?? null;
}

/** Indique la table d'origine du résultat le plus récent (même règle que pickLatestSoftSkillsRow). */
export function resolveSoftSkillsResultSource<T extends SoftSkillsResultRow>(
  apprenant: T | null | undefined,
  salarie: T | null | undefined,
): ResolvedSoftSkillsResult<T> | null {
  if (!apprenant && !salarie) return null;
  if (!apprenant) return { source: "salarie", row: salarie! };
  if (!salarie) return { source: "apprenant", row: apprenant };

  const apprenantTime = Date.parse(apprenant.taken_at ?? "") || 0;
  const salarieTime = Date.parse(salarie.taken_at ?? "") || 0;
  if (salarieTime > apprenantTime) return { source: "salarie", row: salarie };
  return { source: "apprenant", row: apprenant };
}

/** Score max par compétence (3 questions × 5). */
export const SOFT_SKILL_SCORE_PER_COMPETENCE = 15;

export function sortSoftSkillsDescending(
  entries: Array<{ skill: string; score: number }>,
): Array<{ skill: string; score: number }> {
  return [...entries].sort((a, b) => b.score - a.score);
}

export function softSkillMasteryPercent(
  score: number,
  max: number = SOFT_SKILL_SCORE_PER_COMPETENCE,
): number {
  if (!Number.isFinite(score) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
}

/** Nombre de compétences attendu après un test soft skills terminé. */
export const EXPECTED_SOFT_SKILLS_COMPETENCE_COUNT = SOFT_SKILLS.length;

export function countSoftSkillsScoreEntries(raw: unknown): number {
  return parseSoftSkillsScoreEntries(raw).length;
}

/** Vrai test enregistré (20 compétences), pas l’empreinte badge (top 2). */
export function isCompleteSoftSkillsScores(raw: unknown): boolean {
  return countSoftSkillsScoreEntries(raw) >= EXPECTED_SOFT_SKILLS_COMPETENCE_COUNT;
}

export function parseSoftSkillsScoreEntries(
  raw: unknown,
): Array<{ skill: string; score: number }> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return sortSoftSkillsDescending(
    Object.entries(raw as Record<string, unknown>)
      .filter(([skill]) => skill && !SOFT_SKILLS_META_KEYS.has(skill))
      .map(([skill, score]) => ({ skill, score: Number(score ?? 0) }))
      .filter((e) => !Number.isNaN(e.score) && e.score > 0),
  );
}

async function fetchBothSoftSkillsRows(
  supabase: SupabaseClient,
  learnerId: string,
  select: string,
): Promise<[SoftSkillsResultRecord | null, SoftSkillsResultRecord | null]> {
  const [{ data: apprenant }, { data: salarie }] = await Promise.all([
    supabase
      .from("soft_skills_resultats")
      .select(select)
      .eq("learner_id", learnerId)
      .maybeSingle(),
    supabase
      .from("soft_skills_resultats_salarie")
      .select(select)
      .eq("learner_id", learnerId)
      .maybeSingle(),
  ]);

  return [
    (apprenant as SoftSkillsResultRecord | null) ?? null,
    (salarie as SoftSkillsResultRecord | null) ?? null,
  ];
}

/** Charge le résultat soft skills le plus récent avec sa table d'origine. */
export async function fetchLatestSoftSkillsResultWithSource(
  supabase: SupabaseClient,
  learnerId: string,
  select = "*",
): Promise<ResolvedSoftSkillsResult | null> {
  const [apprenant, salarie] = await fetchBothSoftSkillsRows(supabase, learnerId, select);
  return resolveSoftSkillsResultSource(apprenant, salarie);
}

/** Charge le résultat soft skills le plus récent (apprenant ou salarié) pour un profil. */
export async function fetchLatestSoftSkillsResult(
  supabase: SupabaseClient,
  learnerId: string,
  select = "*",
): Promise<SoftSkillsResultRecord | null> {
  const resolved = await fetchLatestSoftSkillsResultWithSource(supabase, learnerId, select);
  return resolved?.row ?? null;
}
