"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type UpdateOrganizationInput = {
  organizationId: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string; // base64 string or empty string to remove
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

  // Utiliser le service role client si disponible, sinon utiliser le client normal
  let serviceClient;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      serviceClient = getServiceRoleClient();
    } else {
      console.warn("[super-admin] SUPABASE_SERVICE_ROLE_KEY not configured, using regular client");
      serviceClient = supabase;
    }
  } catch (e) {
    console.warn("[super-admin] Service role client not available, using regular client:", e);
    serviceClient = supabase;
  }

  if (!serviceClient) {
    return { success: false, error: "Service role client non disponible" };
  }
  
  const client = serviceClient!;

  try {
    // Générer le slug si non fourni mais que le nom a changé
    let finalSlug = input.slug;
    if (!finalSlug && input.name) {
      finalSlug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Vérifier que le slug n'existe pas déjà (sauf pour cette organisation)
    if (finalSlug) {
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", finalSlug)
        .neq("id", input.organizationId)
        .single();

      if (existingOrg) {
        // Ajouter un suffixe si le slug existe déjà
        let counter = 1;
        let uniqueSlug = `${finalSlug}-${counter}`;
        while (true) {
          const { data: check } = await supabase
            .from("organizations")
            .select("id")
            .eq("slug", uniqueSlug)
            .neq("id", input.organizationId)
            .single();
          if (!check) break;
          counter++;
          uniqueSlug = `${finalSlug}-${counter}`;
        }
        finalSlug = uniqueSlug;
      }
    }

    // Préparer les données à mettre à jour
    const updateData: {
      name?: string;
      slug?: string | null;
      description?: string | null;
      logo?: string | null;
    } = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.slug !== undefined) {
      updateData.slug = finalSlug || null;
    }
    if (input.description !== undefined) {
      updateData.description = input.description || null;
    }
    if (input.logo !== undefined) {
      if (input.logo === "") {
        // Supprimer le logo
        updateData.logo = null;
      } else if (input.logo) {
        // Mettre à jour le logo
        updateData.logo = input.logo;
      }
    }

    // Mettre à jour l'organisation
    const { error: orgError } = await client
      .from("organizations")
      .update(updateData)
      .eq("id", input.organizationId);

    if (orgError) {
      console.error("[super-admin] Error updating organization:", orgError);
      return { success: false, error: orgError.message || "Erreur lors de la mise à jour de l'organisation" };
    }

    // Si un logo a été fourni, le mettre à jour aussi dans le profil de l'admin principal
    if (input.logo && input.logo !== "") {
      const { data: adminMemberships } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", input.organizationId)
        .eq("role", "admin")
        .limit(1);

      if (adminMemberships && adminMemberships.length > 0) {
        await client
          .from("profiles")
          .update({ organization_logo: input.logo })
          .eq("id", adminMemberships[0].user_id);
      }
    } else if (input.logo === "") {
      // Supprimer le logo du profil admin aussi
      const { data: adminMemberships } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", input.organizationId)
        .eq("role", "admin")
        .limit(1);

      if (adminMemberships && adminMemberships.length > 0) {
        await client
          .from("profiles")
          .update({ organization_logo: null })
          .eq("id", adminMemberships[0].user_id);
      }
    }

    revalidatePath(`/super/organisations/${input.organizationId}`);
    revalidatePath(`/super/organisations/${input.organizationId}/edit`);
    revalidatePath("/super/organisations");

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

type RemoveMemberInput = {
  organizationId: string;
  userId: string;
};

export async function removeMemberAction(input: RemoveMemberInput): Promise<{
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

  // Utiliser le service role client si disponible, sinon utiliser le client normal
  let serviceClient;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      serviceClient = getServiceRoleClient();
    } else {
      console.warn("[super-admin] SUPABASE_SERVICE_ROLE_KEY not configured, using regular client");
      serviceClient = supabase;
    }
  } catch (e) {
    console.warn("[super-admin] Service role client not available, using regular client:", e);
    serviceClient = supabase;
  }

  if (!serviceClient) {
    return { success: false, error: "Service role client non disponible" };
  }
  
  const client = serviceClient!;

  try {
    // Retirer le membre de l'organisation
    const { error } = await client
      .from("org_memberships")
      .delete()
      .eq("org_id", input.organizationId)
      .eq("user_id", input.userId);

    if (error) {
      console.error("[super-admin] Error removing member:", error);
      return { success: false, error: error.message || "Erreur lors du retrait du membre" };
    }

    revalidatePath(`/super/organisations/${input.organizationId}`);
    revalidatePath(`/super/organisations/${input.organizationId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

