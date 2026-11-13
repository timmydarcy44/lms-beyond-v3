import { isHandicapPortfolioOnlyRoleType } from "@/lib/auth/school-role-type-guards";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

/** Accès espace Handicap Super : référente OF ou role_type référent handicap. */
export async function canAccessHandicapSpace(userId?: string | null): Promise<boolean> {
  const service = getServiceRoleClient();
  if (!service) return false;

  let uid = userId?.trim() || null;
  if (!uid) {
    const client = await getServerClient();
    const { data } = client ? await client.auth.getUser() : { data: { user: null } };
    uid = data.user?.id ?? null;
  }
  if (!uid) return false;

  const { data: settings } = await service
    .from("of_settings")
    .select("referent_handicap_user_id")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();
  if (settings?.referent_handicap_user_id && settings.referent_handicap_user_id === uid) {
    return true;
  }

  const { data: profile } = await service
    .from("profiles")
    .select("role_type")
    .eq("id", uid)
    .maybeSingle();
  return isHandicapPortfolioOnlyRoleType(profile?.role_type);
}

export async function requireHandicapReferentAccess(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const client = await getServerClient();
  const { data } = client ? await client.auth.getUser() : { data: { user: null } };
  const userId = data.user?.id ?? null;
  if (!userId) return { ok: false, status: 401, error: "Non authentifié" };

  if (!(await canAccessHandicapSpace(userId))) {
    return { ok: false, status: 403, error: "Réservé à la référente handicap" };
  }
  return { ok: true, userId };
}
