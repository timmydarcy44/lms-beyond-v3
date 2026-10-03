import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import { normalizeIdmcAxesRecord } from "@/lib/idmc/idmc-display";
import { parseSoftScoresFromCrossProfileCompletion } from "@/lib/learner/cross-profile-soft-scores";
import {
  fetchLatestSoftSkillsResult,
  isCompleteSoftSkillsScores,
  parseSoftSkillsScoreEntries,
  type SoftSkillsResultRecord,
} from "@/lib/soft-skills/resolve-soft-skills-result";

/** Au moins une compétence scorée (y compris empreinte badge — à ne pas afficher comme test complet). */
export function hasStoredSoftSkillsScores(scores: unknown): boolean {
  return parseSoftSkillsScoreEntries(scores).length > 0;
}

export function hasCompleteSoftSkillsTest(scores: unknown): boolean {
  return isCompleteSoftSkillsScores(scores);
}

/** Scores soft archivés dans profiles.cross_profile_completion (badge croisé). */
export async function fetchCrossProfileSoftScoresForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<Record<string, number> | null> {
  for (const profileId of profileIds) {
    const { data: profile, error } = await db
      .from("profiles")
      .select("cross_profile_completion")
      .eq("id", profileId)
      .maybeSingle();
    if (error) {
      console.warn("[fetchCrossProfileSoftScoresForCandidates]", profileId, error.message);
      continue;
    }
    const parsed = parseSoftScoresFromCrossProfileCompletion(profile?.cross_profile_completion);
    if (parsed && isCompleteSoftSkillsScores(parsed)) return parsed;
  }
  return null;
}

/** Ids profil à interroger pour retrouver les tests (auth id, legacy email, employé lié). */
export async function collectLearnerProfileCandidates(
  db: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<string[]> {
  const ids = new Set<string>();
  if (userId.trim()) ids.add(userId.trim());

  const normalizedEmail = (email ?? "").trim().toLowerCase();

  const [{ data: profileById }, { data: profilesByEmail }, { data: employeeRow }] = await Promise.all([
    db.from("profiles").select("id, email").eq("id", userId).maybeSingle(),
    normalizedEmail
      ? db.from("profiles").select("id").ilike("email", normalizedEmail)
      : Promise.resolve({ data: [] as Array<{ id: string }> }),
    normalizedEmail
      ? db
          .from("employees")
          .select("profile_id")
          .or(`profile_id.eq.${userId},email.eq.${normalizedEmail}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : db
          .from("employees")
          .select("profile_id")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
  ]);

  if (profileById?.id) ids.add(String(profileById.id));
  for (const row of profilesByEmail ?? []) {
    if (row?.id) ids.add(String(row.id));
  }

  const profileEmail = String(profileById?.email ?? normalizedEmail).trim().toLowerCase();
  if (profileEmail) {
    const { data: siblings } = await db.from("profiles").select("id").ilike("email", profileEmail);
    for (const row of siblings ?? []) {
      if (row?.id) ids.add(String(row.id));
    }
  }

  if (employeeRow?.profile_id) ids.add(String(employeeRow.profile_id));

  return Array.from(ids);
}

/** DISC le plus récent parmi les profils candidats (boucle par profil, comme le dashboard Profil). */
export async function fetchDiscScoresForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<ReturnType<typeof parseStoredDiscScores>> {
  if (!profileIds.length) return null;

  let bestScores: unknown = null;
  let bestTime = 0;

  for (const profileId of profileIds) {
    const { data, error } = await db
      .from("disc_resultats")
      .select("scores, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) {
      console.warn("[fetchDiscScoresForCandidates]", profileId, error.message);
      continue;
    }
    if (!data?.scores) continue;
    const updatedAt = Date.parse(String(data.updated_at ?? "")) || 0;
    if (!bestScores || updatedAt >= bestTime) {
      bestScores = data.scores;
      bestTime = updatedAt;
    }
  }

  // Fallback legacy : colonnes profiles.disc_* / score_d..c (anciens parcours)
  if (!bestScores) {
    for (const profileId of profileIds) {
      const { data, error } = await db
        .from("profiles")
        .select("disc_scores, score_d, score_i, score_s, score_c, updated_at")
        .eq("id", profileId)
        .maybeSingle();
      if (error || !data) continue;
      const fromJson = data.disc_scores;
      const fromCols =
        data.score_d != null || data.score_i != null || data.score_s != null || data.score_c != null
          ? {
              D: Number(data.score_d ?? 0),
              I: Number(data.score_i ?? 0),
              S: Number(data.score_s ?? 0),
              C: Number(data.score_c ?? 0),
            }
          : null;
      const candidate = fromJson ?? fromCols;
      if (!candidate) continue;
      const updatedAt = Date.parse(String(data.updated_at ?? "")) || 0;
      if (!bestScores || updatedAt >= bestTime) {
        bestScores = candidate;
        bestTime = updatedAt;
      }
    }
  }

  return parseStoredDiscScores((bestScores as Record<string, unknown> | null) ?? null);
}

/** IDMC le plus récent parmi les profils candidats (boucle par profil). */
export async function fetchIdmcAxesForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<ReturnType<typeof normalizeIdmcAxesRecord>> {
  if (!profileIds.length) return null;

  let bestRow: { scores: unknown; responses: unknown; updated_at: string | null } | null = null;
  let bestTime = 0;

  for (const profileId of profileIds) {
    const { data, error } = await db
      .from("idmc_resultats")
      .select("scores, responses, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) {
      console.warn("[fetchIdmcAxesForCandidates]", profileId, error.message);
      continue;
    }
    if (!data) continue;
    const updatedAt = Date.parse(String(data.updated_at ?? "")) || 0;
    if (!bestRow || updatedAt >= bestTime) {
      bestRow = data;
      bestTime = updatedAt;
    }
  }

  if (!bestRow) return null;
  return normalizeIdmcAxesRecord(bestRow.scores ?? bestRow.responses);
}

/** Soft skills le plus récent parmi les profils candidats (apprenant + salarié). */
export async function fetchSoftSkillsRadarForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<Array<{ skill: string; score: number }>> {
  let best: { scores: unknown; taken_at: string | null } | null = null;
  let bestTime = 0;

  for (const profileId of profileIds) {
    const row = await fetchLatestSoftSkillsResult(db, profileId, "scores, taken_at");
    if (!row?.scores) continue;
    const takenAt = Date.parse(row.taken_at ?? "") || 0;
    if (!best || takenAt >= bestTime) {
      best = row;
      bestTime = takenAt;
    }
  }

  return parseSoftSkillsScoreEntries(best?.scores);
}

/** Dernière ligne soft skills (scores + synthèse IA) parmi les profils liés au compte. */
export async function fetchLatestSoftSkillsResultForCandidates(
  db: SupabaseClient,
  profileIds: string[],
  select = "*",
): Promise<SoftSkillsResultRecord | null> {
  let best: SoftSkillsResultRecord | null = null;
  let bestTime = 0;

  for (const profileId of profileIds) {
    const row = await fetchLatestSoftSkillsResult(db, profileId, select);
    if (!row?.scores) continue;
    const takenAt = Date.parse(row.taken_at ?? "") || 0;
    if (!best || takenAt >= bestTime) {
      best = row;
      bestTime = takenAt;
    }
  }

  return best;
}
