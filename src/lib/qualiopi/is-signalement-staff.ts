import type { SupabaseClient } from "@supabase/supabase-js";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Aligné sur SQL public.is_signalement_staff :
 * super_admin actif OU référent signalement OF.
 */
export async function isSignalementStaff(
  service: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;
  if (await isSuperAdmin()) return true;

  const { data } = await service
    .from("of_settings")
    .select("referent_signalement_user_id")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();

  return Boolean(data?.referent_signalement_user_id && data.referent_signalement_user_id === userId);
}

/** Pour les routes signalements : refuse si ni super ni référent. */
export async function assertSignalementStaffAccess(
  service: SupabaseClient,
  userId: string | null,
): Promise<{ ok: true } | { ok: false; status: 403; error: string }> {
  if (!userId) return { ok: false, status: 403, error: "Non authentifié" };
  const allowed = await isSignalementStaff(service, userId);
  if (!allowed) {
    return { ok: false, status: 403, error: "Accès réservé au référent signalements" };
  }
  return { ok: true };
}
