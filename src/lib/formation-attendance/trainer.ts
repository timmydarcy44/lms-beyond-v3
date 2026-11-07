import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveTrainerNameForSession(
  service: SupabaseClient,
  sessionId: string,
): Promise<string | null> {
  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("trainer_user_id")
    .eq("session_id", sessionId)
    .not("trainer_user_id", "is", null)
    .limit(5);

  const trainerId = (dossiers ?? []).map((d) => d.trainer_user_id).find(Boolean);
  if (!trainerId) return null;

  const { data: profile } = await service
    .from("profiles")
    .select("full_name, first_name, last_name, email")
    .eq("id", trainerId)
    .maybeSingle();

  if (!profile) return null;
  return (
    String(profile.full_name ?? "").trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    String(profile.email ?? "").trim() ||
    null
  );
}
