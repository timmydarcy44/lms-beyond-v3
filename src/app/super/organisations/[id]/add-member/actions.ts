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
  if (!serviceClient) {
    return { success: false, error: "Service role client non disponible" };
  }

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", input.email)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      await serviceClient.from("profiles").update({ full_name: input.fullName, role: input.role }).eq("id", userId);
    } else {
      const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        email: input.email,
        email_confirm: false,
        user_metadata: {
          full_name: input.fullName,
          role: input.role,
        },
      });

      if (authError || !authUser?.user?.id) {
        return { success: false, error: authError?.message || "Erreur lors de la création de l'utilisateur" };
      }
      userId = authUser.user.id;
    }

    const { error: membershipError } = await serviceClient.from("org_memberships").upsert({
      org_id: input.organizationId,
      user_id: userId,
      role: input.role,
    });

    if (membershipError) {
      return { success: false, error: membershipError.message || "Erreur lors de l'ajout du membre" };
    }

    revalidatePath(`/super/organisations/${input.organizationId}/manage`);
    revalidatePath(`/super/organisations/${input.organizationId}/edit`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de l'ajout du membre" };
  }
}

