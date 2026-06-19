import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyCrossProfileCompletion } from "@/lib/learner/cross-profile-completion";

export type IdmcResultatsPayload = {
  profile_id: string;
  responses: unknown;
  scores: Record<string, unknown>;
  global_score?: number;
  level?: string;
  updated_at?: string;
};

export async function saveIdmcResultats(
  supabase: SupabaseClient,
  payload: IdmcResultatsPayload,
) {
  const { error } = await supabase.from("idmc_resultats").upsert(payload, {
    onConflict: "profile_id",
  });

  if (!error) {
    await notifyCrossProfileCompletion(payload.profile_id);
  }

  return { error };
}
