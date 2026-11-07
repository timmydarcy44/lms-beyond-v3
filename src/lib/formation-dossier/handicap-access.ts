import type { SupabaseClient } from "@supabase/supabase-js";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

/** Détail besoins spécifiques : owner du dossier ou référent handicap OF. */
export async function canViewHandicapDetails(
  service: SupabaseClient,
  params: { userId: string; dossierOwnerUserId?: string | null },
): Promise<boolean> {
  if (params.dossierOwnerUserId && params.dossierOwnerUserId === params.userId) {
    return true;
  }
  const { data } = await service
    .from("of_settings")
    .select("referent_handicap_user_id")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();
  return Boolean(
    data?.referent_handicap_user_id && data.referent_handicap_user_id === params.userId,
  );
}
