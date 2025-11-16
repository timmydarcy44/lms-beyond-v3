"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type AddMemberInput = {
  organizationId: string;
  email: string;
  fullName: string;
  role: "admin" | "instructor" | "learner" | "tutor";
};

export async function addMemberToOrganizationAction(input: AddMemberInput): Promise<{
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

  const serviceClient = getServiceRoleClient();

  try {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", input.email)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      // Mettre à jour le profil si nécessaire
      await serviceClient
        .from("profiles")
        .update({ full_name: input.fullName, role: input.role })
        .eq("id", userId);
    } else {
      // Créer l'utilisateur via Supabase Auth
      const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        email: input.email,
        email_confirm: false,
        user_metadata: {
          full_name: input.fullName,
          role: input.role,
        },
      });

      if (authError || !authUser?.user) {
        console.error(`[super-admin] Error creating user ${input.email}:`, authError);
        return {
          success: false,
          error: authError?.message || "Erreur lors de la création de l'utilisateur",
        };
      }

      userId = authUser.user.id;

      // Créer le profil
      const { error: profileError } = await serviceClient.from("profiles").insert({
        id: userId,
        email: input.email,
        full_name: input.fullName,
        role: input.role,
      });

      if (profileError) {
        console.error(`[super-admin] Error creating profile for ${input.email}:`, profileError);
        return {
          success: false,
          error: profileError.message || "Erreur lors de la création du profil",
        };
      }
    }

    // Vérifier si le membre est déjà dans l'organisation
    const { data: existingMembership } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", input.organizationId)
      .eq("user_id", userId)
      .single();

    if (existingMembership) {
      // Mettre à jour le rôle si nécessaire
      await serviceClient
        .from("org_memberships")
        .update({ role: input.role })
        .eq("org_id", input.organizationId)
        .eq("user_id", userId);
    } else {
      // Ajouter le membre à l'organisation
      const { error: membershipError } = await serviceClient.from("org_memberships").insert({
        org_id: input.organizationId,
        user_id: userId,
        role: input.role,
      });

      if (membershipError) {
        console.error(`[super-admin] Error adding member ${input.email} to org:`, membershipError);
        return {
          success: false,
          error: membershipError.message || "Erreur lors de l'ajout du membre à l'organisation",
        };
      }
    }

    revalidatePath(`/super/organisations/${input.organizationId}`);
    revalidatePath(`/super/organisations/${input.organizationId}/edit`);
    revalidatePath(`/super/organisations/${input.organizationId}/add-member`);

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}




