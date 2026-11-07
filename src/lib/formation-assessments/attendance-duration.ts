import type { SupabaseClient } from "@supabase/supabase-js";

/** Demi-journées planifiées vs suivies (signatures ok) pour un profil sur une session. */
export async function countAttendedHalfDays(
  service: SupabaseClient,
  params: { sessionId: string | null; profileId: string },
): Promise<{ planned: number; attended: number }> {
  if (!params.sessionId) return { planned: 0, attended: 0 };

  const { data: slots } = await service
    .from("formation_slots")
    .select("id")
    .eq("session_id", params.sessionId);
  const planned = slots?.length ?? 0;
  if (!planned) return { planned: 0, attended: 0 };

  const ids = slots!.map((s) => String(s.id));
  const { data: sigs } = await service
    .from("attendance_signatures")
    .select("slot_id, status")
    .eq("profile_id", params.profileId)
    .in("slot_id", ids)
    .in("status", ["ok", "a_verifier"]);

  const unique = new Set((sigs ?? []).map((s) => String(s.slot_id)));
  return { planned, attended: unique.size };
}
