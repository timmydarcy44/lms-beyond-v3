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
    // Mettre à jour le statut de restriction
    // Note: Il faudrait ajouter une colonne `is_restricted` ou `status` dans la table organizations
    // Pour l'instant, on utilise un champ metadata ou on crée la colonne
    const { error } = await serviceClient
      .from("organizations")
      .update({ 
        // Si la colonne existe, sinon on peut utiliser metadata JSON
        // is_restricted: restrict 
      })
      .eq("id", organizationId);

    if (error) {
      console.error("[super-admin] Error restricting organization:", error);
      return { success: false, error: error.message || "Erreur lors de la restriction" };
    }

    revalidatePath(`/super/organisations/${organizationId}`);
    revalidatePath("/super/organisations");

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

export async function deleteOrganizationAction(
  organizationId: string
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
    // Supprimer les membres de l'organisation
    await serviceClient
      .from("org_memberships")
      .delete()
      .eq("org_id", organizationId);

    // Supprimer l'organisation
    const { error } = await serviceClient
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (error) {
      console.error("[super-admin] Error deleting organization:", error);
      return { success: false, error: error.message || "Erreur lors de la suppression" };
    }

    revalidatePath("/super/organisations");
    revalidatePath("/super");

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}



