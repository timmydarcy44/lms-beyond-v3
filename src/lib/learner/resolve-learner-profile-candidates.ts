import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import { resolveIdmcAxes } from "@/components/idmc/IdmcRadarChart";
import {
  fetchLatestSoftSkillsResult,
  parseSoftSkillsScoreEntries,
} from "@/lib/soft-skills/resolve-soft-skills-result";

/** Ids profil à interroger pour retrouver les tests (auth id, legacy email, employé lié). */
export async function collectLearnerProfileCandidates(
  db: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<string[]> {
  const ids = new Set<string>();
  if (userId.trim()) ids.add(userId.trim());

  const normalizedEmail = (email ?? "").trim().toLowerCase();

  const [{ data: profileById }, { data: profileByEmail }, { data: employeeRow }] = await Promise.all([
    db.from("profiles").select("id, email").eq("id", userId).maybeSingle(),
    normalizedEmail
      ? db.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle()
      : Promise.resolve({ data: null }),
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
  if (profileByEmail?.id) ids.add(String(profileByEmail.id));

  const profileEmail = String(profileById?.email ?? normalizedEmail).trim().toLowerCase();
  if (profileEmail) {
    const { data: siblings } = await db.from("profiles").select("id").eq("email", profileEmail);
    for (const row of siblings ?? []) {
      if (row?.id) ids.add(String(row.id));
    }
  }

  if (employeeRow?.profile_id) ids.add(String(employeeRow.profile_id));

  return Array.from(ids);
}

/** DISC le plus récent parmi les profils candidats. */
export async function fetchDiscScoresForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<ReturnType<typeof parseStoredDiscScores>> {
  if (!profileIds.length) return null;
  const { data } = await db
    .from("disc_resultats")
    .select("scores, updated_at")
    .in("profile_id", profileIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return parseStoredDiscScores((data?.scores as Record<string, unknown> | null) ?? null);
}

/** IDMC le plus récent parmi les profils candidats. */
export async function fetchIdmcAxesForCandidates(
  db: SupabaseClient,
  profileIds: string[],
): Promise<ReturnType<typeof resolveIdmcAxes>> {
  if (!profileIds.length) return null;
  const { data } = await db
    .from("idmc_resultats")
    .select("scores, responses, updated_at")
    .in("profile_id", profileIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return resolveIdmcAxes(data?.scores ?? data?.responses);
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
