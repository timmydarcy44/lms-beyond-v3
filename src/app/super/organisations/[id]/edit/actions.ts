"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type UpdateOrganizationInput = {
  organizationId: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  wantsInternalBadges?: boolean;
};

export async function updateOrganizationAction(input: UpdateOrganizationInput): Promise<{
  success: boolean;
  error?: string;
}> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { success: false, error: "Erreur de connexion à la base de données" };
  }

  let serviceClient;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      serviceClient = getServiceRoleClient();
    } else {
      serviceClient = supabase;
    }
  } catch (e) {
    serviceClient = supabase;
  }

  try {
    const payload: Record<string, any> = {};
    if (typeof input.name === "string") payload.name = input.name;
    if (typeof input.slug === "string") payload.slug = input.slug;
    if (typeof input.wantsInternalBadges === "boolean") {
      payload.wants_internal_badges = input.wantsInternalBadges;
    }

    const { error } = await serviceClient.from("organizations").update(payload).eq("id", input.organizationId);
    if (error) {
      return { success: false, error: error.message || "Erreur lors de la mise à jour" };
    }

    revalidatePath("/super/organisations");
    revalidatePath(`/super/organisations/${input.organizationId}`);
    revalidatePath(`/super/organisations/${input.organizationId}/edit`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de la mise à jour" };
  }
}

