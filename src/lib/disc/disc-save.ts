import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DISC_QUESTION_COUNT,
  type DiscIpsativeResponse,
  type DiscLabel,
} from "@/lib/disc/disc-questions";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import { computeDiscResult, type DiscRawScores } from "@/lib/disc/disc-scoring";
import { notifyCrossProfileCompletion } from "@/lib/learner/cross-profile-notify";

export function buildDiscResultsPayload(
  profileId: string,
  responses: DiscIpsativeResponse[],
  rawScores: DiscRawScores,
) {
  const result = computeDiscResult(rawScores, DISC_QUESTION_COUNT);

  const scores = {
    D: result.normalized.D,
    I: result.normalized.I,
    S: result.normalized.S,
    C: result.normalized.C,
    raw_scores: result.raw,
    normalized_scores: result.normalized,
    is_mixed_profile: result.isMixed,
    secondary_profile: result.secondary ? DISC_PROFILE_LABELS[result.secondary] : null,
    dominant_profile: DISC_PROFILE_LABELS[result.dominant],
  };

  return {
    profile_id: profileId,
    responses,
    scores,
    raw_scores: result.raw,
    normalized_scores: result.normalized,
    dominant_dimension: result.dominant,
    final_profile: result.profileLabel,
    is_mixed_profile: result.isMixed,
    secondary_profile: result.secondary ? DISC_PROFILE_LABELS[result.secondary] : null,
    dominant_profile: DISC_PROFILE_LABELS[result.dominant],
    updated_at: new Date().toISOString(),
  };
}

export async function saveDiscResultats(
  supabase: SupabaseClient,
  profileId: string,
  responses: DiscIpsativeResponse[],
  rawScores: DiscRawScores,
) {
  const payload = buildDiscResultsPayload(profileId, responses, rawScores);
  const { error } = await supabase.from("disc_resultats").upsert(
    {
      profile_id: payload.profile_id,
      responses: payload.responses,
      scores: payload.scores,
      final_profile: payload.final_profile,
      updated_at: payload.updated_at,
    },
    { onConflict: "profile_id" },
  );
  if (!error) {
    notifyCrossProfileCompletion(profileId);
  }
  return { error, payload };
}

export async function syncDiscProfilesLegacy(
  supabase: SupabaseClient,
  profileId: string,
  payload: ReturnType<typeof buildDiscResultsPayload>,
) {
  const dominant = payload.dominant_dimension;
  const scoreD = payload.raw_scores.D;
  const scoreI = payload.raw_scores.I;
  const scoreS = payload.raw_scores.S;
  const scoreC = payload.raw_scores.C;

  return supabase
    .from("profiles")
    .update({
      disc_profile: payload.final_profile,
      disc_score: dominant ? payload.normalized_scores[dominant] : null,
      disc_scores: payload.normalized_scores,
      disc_status: "completed",
      score_d: scoreD,
      score_i: scoreI,
      score_s: scoreS,
      score_c: scoreC,
    })
    .eq("id", profileId);
}
