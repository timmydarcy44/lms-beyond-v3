"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

type UpdateUserDetailsParams = {
  userId: string;
  email?: string;
  fullName?: string | null;
  phone?: string | null;
  password?: string;
};

export async function updateUserDetails(params: UpdateUserDetailsParams) {
  try {
    // Vérifier que l'utilisateur est Super Admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return { success: false, error: "Service role client non disponible" };
    }

    const { userId, email, fullName, phone, password } = params;

    console.log("[super-admin] Updating user:", userId);

    // Mettre à jour le profil
    const profileUpdates: any = {};
    if (email !== undefined) profileUpdates.email = email;
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (phone !== undefined) profileUpdates.phone = phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        console.error("[super-admin] Error updating profile:", profileError);
        return { success: false, error: `Erreur lors de la mise à jour du profil: ${profileError.message}` };
      }
    }

    // Mettre à jour le mot de passe si fourni
    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
      });

      if (passwordError) {
        console.error("[super-admin] Error updating password:", passwordError);
        return { success: false, error: `Erreur lors de la mise à jour du mot de passe: ${passwordError.message}` };
      }

      console.log("[super-admin] Password updated successfully for user:", userId);
    }

    // Mettre à jour l'email dans auth.users si fourni
    if (email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
        email: email,
        email_confirm: true, // Confirmer l'email automatiquement
      });

      if (emailError) {
        console.error("[super-admin] Error updating email in auth:", emailError);
        // Ne pas échouer si l'email dans auth.users ne peut pas être mis à jour
        // car l'email dans profiles a déjà été mis à jour
      }
    }

    console.log("[super-admin] User updated successfully:", userId);

    return { success: true };
  } catch (error) {
    console.error("[super-admin] Unexpected error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    };
  }
}



