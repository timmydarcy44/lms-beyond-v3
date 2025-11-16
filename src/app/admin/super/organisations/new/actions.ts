"use server";

import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type CreateOrganizationInput = {
  name: string;
  slug?: string;
  description?: string;
  members?: Array<{
    email: string;
    role: "instructor" | "learner" | "tutor";
    fullName: string;
  }>;
};

export async function createOrganizationAction(input: CreateOrganizationInput): Promise<{
  success: boolean;
  organizationId?: string;
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
  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const serviceClient = getServiceRoleClient();

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    // Générer le slug si non fourni
    let finalSlug = input.slug;
    if (!finalSlug) {
      finalSlug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Vérifier que le slug n'existe pas déjà
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", finalSlug)
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
          .single();
        if (!check) break;
        counter++;
        uniqueSlug = `${finalSlug}-${counter}`;
      }
      finalSlug = uniqueSlug;
    }

    // Créer l'organisation
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: input.name,
        slug: finalSlug,
        description: input.description || null,
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error("[super-admin] Error creating organization:", orgError);
      return { success: false, error: orgError?.message || "Erreur lors de la création de l'organisation" };
    }

    // Traiter les membres si fournis
    if (input.members && input.members.length > 0) {
      for (const member of input.members) {
        if (!member.email || !member.fullName) continue;

        // Vérifier si l'utilisateur existe déjà
        let userId: string | null = null;
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", member.email)
          .single();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Créer l'utilisateur via Supabase Auth (nécessite service role)
          try {
            const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
              email: member.email,
              email_confirm: false, // Nécessitera confirmation email
              user_metadata: {
                full_name: member.fullName,
                role: member.role,
              },
            });

            if (authError || !authUser?.user) {
              console.error(`[super-admin] Error creating user ${member.email}:`, authError);
              continue; // Skip ce membre mais continue avec les autres
            }

            userId = authUser.user.id;

            // Créer le profil avec service client pour bypass RLS
            const { error: profileError } = await serviceClient.from("profiles").insert({
              id: userId,
              email: member.email,
              full_name: member.fullName,
              role: member.role,
            });

            if (profileError) {
              console.error(`[super-admin] Error creating profile for ${member.email}:`, profileError);
              continue;
            }
          } catch (serviceError) {
            console.error(`[super-admin] Service role error creating user ${member.email}:`, serviceError);
            // Fallback: créer juste le profil sans auth (l'utilisateur devra s'inscrire)
            // Dans ce cas, on ne crée pas l'utilisateur maintenant
            continue;
          }
        }

        // Ajouter le membre à l'organisation
        const { error: membershipError } = await supabase.from("org_memberships").insert({
          org_id: organization.id,
          user_id: userId,
          role: member.role,
        });

        if (membershipError) {
          console.error(`[super-admin] Error adding member ${member.email} to org:`, membershipError);
          // Continue avec les autres membres
        }
      }
    }

    revalidatePath("/super/organisations");
    revalidatePath("/super");

    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

