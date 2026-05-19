"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

export async function restrictOrganizationAction(
  organizationId: string,
  restrict: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const serviceClient = getServiceRoleClient();

  try {
    if (!serviceClient) {
      return { success: false, error: "Service role client non disponible" };
    }
    const { error } = await serviceClient
      .from("organizations")
      .update({
        // is_restricted: restrict
      })
      .eq("id", organizationId);

    if (error) {
      console.error("[super-admin] Error restricting organization:", error);
      return { success: false, error: error.message || "Erreur lors de la restriction" };
    }

    revalidatePath("/super/organisations");
    revalidatePath(`/super/organisations/${organizationId}`);

    return { success: true };
  } catch (error: any) {
    console.error("[super-admin] Error restricting organization:", error);
    return { success: false, error: error.message || "Erreur lors de la restriction" };
  }
}

export async function deleteOrganizationAction(organizationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const serviceClient = getServiceRoleClient();

  try {
    if (!serviceClient) {
      return { success: false, error: "Service role client non disponible" };
    }

    const { error } = await serviceClient.from("organizations").delete().eq("id", organizationId);

    if (error) {
      console.error("[super-admin] Error deleting organization:", error);
      return { success: false, error: error.message || "Erreur lors de la suppression" };
    }

    revalidatePath("/super/organisations");

    return { success: true };
  } catch (error: any) {
    console.error("[super-admin] Error deleting organization:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression" };
  }
}

