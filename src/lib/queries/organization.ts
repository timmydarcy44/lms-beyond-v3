import { getServerClient } from "@/lib/supabase/server";
import { getOrganizationLogo } from "./super-admin";

/**
 * Récupère le logo de l'organisation de l'utilisateur actuel
 * Retourne null si l'utilisateur n'a pas d'organisation ou si l'organisation n'a pas de logo
 */
export async function getUserOrganizationLogo(): Promise<string | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.org_id) return null;

    return await getOrganizationLogo(membership.org_id);
  } catch (error) {
    console.error("[organization] Error fetching user organization logo:", error);
    return null;
  }
}







