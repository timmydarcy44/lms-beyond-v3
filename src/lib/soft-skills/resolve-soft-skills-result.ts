import type { SupabaseClient } from "@supabase/supabase-js";

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

export function parseSoftSkillsScoreEntries(
  raw: unknown,
): Array<{ skill: string; score: number }> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([skill]) => skill && !SOFT_SKILLS_META_KEYS.has(skill))
    .map(([skill, score]) => ({ skill, score: Number(score ?? 0) }))
    .filter((e) => !Number.isNaN(e.score) && e.score > 0)
    .sort((a, b) => b.score - a.score);
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
