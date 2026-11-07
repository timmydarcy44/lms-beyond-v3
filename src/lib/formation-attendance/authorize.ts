import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

/** Super-admin ou formateur assigné sur un dossier de la session du créneau. */
export async function canManageSlotAttendance(slotId: string): Promise<{
  ok: boolean;
  userId: string | null;
}> {
  if (await isSuperAdmin()) {
    let userId: string | null = null;
    try {
      const userClient = await getServerClient();
      const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
      userId = auth.user?.id ?? null;
    } catch {
      /* ignore */
    }
    return { ok: true, userId };
  }

  const service = getServiceRoleClient();
  const userClient = await getServerClient();
  if (!service || !userClient) return { ok: false, userId: null };

  const { data: auth } = await userClient.auth.getUser();
  const userId = auth.user?.id ?? null;
  if (!userId) return { ok: false, userId: null };

  const { data: slot } = await service
    .from("formation_slots")
    .select("session_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot?.session_id) return { ok: false, userId };

  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("session_id", slot.session_id)
    .eq("trainer_user_id", userId)
    .limit(1);

  return { ok: Boolean(dossiers?.length), userId };
}
