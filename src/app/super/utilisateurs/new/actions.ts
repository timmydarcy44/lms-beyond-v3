"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CRM_PROFILE_ROLES, type CrmProfileRole } from "@/lib/crm/crm-shared";
import { revalidatePath } from "next/cache";

type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: CrmProfileRole;
  organizationIds?: string[];
};

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

function isAllowedRole(role: string): role is CrmProfileRole {
  return (CRM_PROFILE_ROLES as readonly string[]).includes(role);
}

export async function createUserAction(input: CreateUserInput): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = buildFullName(firstName, lastName);
  const phone = input.phone?.trim() || null;

  if (!email || !firstName || !lastName) {
    return { success: false, error: "Email, prénom et nom sont obligatoires." };
  }
  if (!isAllowedRole(input.role)) {
    return { success: false, error: "Rôle invalide." };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { success: false, error: "Erreur de connexion à la base de données" };
  }

  const serviceClient = getServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Service role client non disponible" };
  }
  const client = serviceClient;

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const profilePayload = {
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone,
      role: input.role,
    };

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      await client.from("profiles").update(profilePayload).eq("id", userId);
    } else {
      const { data: authUser, error: authError } = await client.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone,
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

      const { error: profileError } = await client.from("profiles").insert({
        id: userId,
        ...profilePayload,
      });

      if (profileError) {
        console.error("[super-admin] Error creating profile:", profileError);
        return {
          success: false,
          error: profileError.message || "Erreur lors de la création du profil",
        };
      }
    }

    if (input.organizationIds && input.organizationIds.length > 0) {
      for (const orgId of input.organizationIds) {
        const { error: membershipError } = await client.from("org_memberships").upsert({
          org_id: orgId,
          user_id: userId,
          role: input.role,
        });

        if (membershipError) {
          console.error(`[super-admin] Error adding user to org ${orgId}:`, membershipError);
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
