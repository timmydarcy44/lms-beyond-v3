"use server";

import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revalidatePath } from "next/cache";

type AdminInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  logo?: string;
};

type CreateOrganizationInput = {
  name: string;
  slug?: string;
  description?: string;
  admin?: AdminInput;
  members?: Array<{
    email: string;
    role: "instructor" | "learner" | "tutor";
    fullName: string;
  }>;
};

export async function createOrganizationWithAdminAction(input: CreateOrganizationInput): Promise<{
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

    // Créer l'administrateur si fourni
    if (input.admin && input.admin.email && input.admin.firstName && input.admin.lastName) {
      const adminFullName = `${input.admin.firstName} ${input.admin.lastName}`.trim();
      
      // Vérifier si l'admin existe déjà
      let adminUserId: string | null = null;
      const { data: existingAdmin } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", input.admin.email)
        .single();

      if (existingAdmin) {
        adminUserId = existingAdmin.id;
        // Mettre à jour le profil
        await serviceClient
          .from("profiles")
          .update({
            full_name: adminFullName,
            role: "admin",
            phone: input.admin.phone || null,
          })
          .eq("id", adminUserId);
      } else {
        // Inviter l'admin via Supabase Auth
        const { data: inviteResponse, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
          input.admin.email,
          {
            data: {
              first_name: input.admin.firstName,
              last_name: input.admin.lastName,
              phone: input.admin.phone,
              role: "admin",
              organization_id: organization.id,
              organization_name: input.name,
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token={token}`,
          }
        );

        if (inviteError || !inviteResponse?.user) {
          console.error(`[super-admin] Error inviting admin ${input.admin.email}:`, inviteError);
          // On continue quand même la création de l'org
        } else {
          adminUserId = inviteResponse.user.id;

          // Créer le profil
          await serviceClient.from("profiles").insert({
            id: adminUserId,
            email: input.admin.email,
            full_name: adminFullName,
            role: "admin",
            phone: input.admin.phone || null,
          });
        }
      }

      // Ajouter l'admin à l'organisation
      if (adminUserId) {
        await serviceClient.from("org_memberships").upsert({
          org_id: organization.id,
          user_id: adminUserId,
          role: "admin",
        });
      }

      // Stocker le logo si fourni (dans une table dédiée ou dans l'organisation)
      // Pour l'instant, on pourrait stocker dans metadata ou créer une table logos
    }

    // Traiter les membres additionnels si fournis
    if (input.members && input.members.length > 0) {
      for (const member of input.members) {
        if (!member.email || !member.fullName) continue;

        let userId: string | null = null;
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", member.email)
          .single();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          try {
            const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
              email: member.email,
              email_confirm: false,
              user_metadata: {
                full_name: member.fullName,
                role: member.role,
              },
            });

            if (authError || !authUser?.user) {
              console.error(`[super-admin] Error creating user ${member.email}:`, authError);
              continue;
            }

            userId = authUser.user.id;

            await serviceClient.from("profiles").insert({
              id: userId,
              email: member.email,
              full_name: member.fullName,
              role: member.role,
            });
          } catch (serviceError) {
            console.error(`[super-admin] Service role error creating user ${member.email}:`, serviceError);
            continue;
          }
        }

        if (userId) {
          await serviceClient.from("org_memberships").insert({
            org_id: organization.id,
            user_id: userId,
            role: member.role,
          });
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
