"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type CreateUserInput = {
  email: string;
  fullName: string;
  role: "instructor" | "learner" | "tutor";
  organizationIds?: string[];
};

export async function createUserAction(input: CreateUserInput): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  // Vérifier les permissions
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { success: false, error: "Erreur de connexion à la base de données" };
  }

  // Utiliser le service role client pour créer des utilisateurs
  const serviceClient = getServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Service role client non disponible" };
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      // Mettre à jour le rôle si nécessaire
      await serviceClient
        .from("profiles")
        .update({ role: input.role, full_name: input.fullName })
        .eq("id", userId);
    } else {
      // Créer l'utilisateur via Supabase Auth
      const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        email: input.email,
        email_confirm: false, // Nécessitera confirmation email
        user_metadata: {
          full_name: input.fullName,
          role: input.role,
        },
      });

      if (authError || !authUser?.user) {
        console.error("[super-admin] Error creating user:", authError);
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
        console.error("[super-admin] Error creating profile:", profileError);
        return {
          success: false,
          error: profileError.message || "Erreur lors de la création du profil",
        };
      }
    }

    // Assigner aux organisations si fournies
    if (input.organizationIds && input.organizationIds.length > 0) {
      for (const orgId of input.organizationIds) {
        const { error: membershipError } = await serviceClient.from("org_memberships").upsert({
          org_id: orgId,
          user_id: userId,
          role: input.role,
        });

        if (membershipError) {
          console.error(`[super-admin] Error adding user to org ${orgId}:`, membershipError);
          // Continue avec les autres organisations
        }
      }
    }

    revalidatePath("/super/utilisateurs");
    revalidatePath("/super");

    return { success: true, userId };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}


