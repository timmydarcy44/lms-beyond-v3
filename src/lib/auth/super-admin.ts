"use server";

import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/**
 * Vérifie si l'utilisateur actuellement authentifié est un super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await getServerClient();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[super-admin] Supabase client not available");
    }
    return false;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[super-admin] No authenticated user:", authError);
      }
      return false;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[super-admin] Checking super admin for user:", authData.user.id);
    }

    // Essayer avec la fonction PostgreSQL si elle existe, sinon query directe
    // La fonction is_super_admin() utilise SECURITY DEFINER donc bypass RLS
    const { data: functionResult, error: functionError } = await supabase.rpc(
      'is_super_admin',
      { p_user_id: authData.user.id }
    );

    if (!functionError && functionResult === true) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[super-admin] User IS a super admin (via function)!");
      }
      return true;
    }

    const serviceClient = await getServiceRoleClientOrFallback();
    if (!serviceClient) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[super-admin] Service client not available");
      }
      return false;
    }

    const { data, error, status } = await serviceClient
      .from("super_admins")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter erreur si pas trouvé

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[super-admin] Error querying super_admins:", error.message, error.code, status);
      }
      return false;
    }

    if (!data) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[super-admin] User is NOT in super_admins table");
      }
      return false;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[super-admin] User IS a super admin!");
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[super-admin] Unexpected error checking super admin status:", error);
    }
    return false;
  }
}

/**
 * Vérifie si un utilisateur spécifique est super admin
 */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const serviceClient = await getServiceRoleClientOrFallback();
  if (!serviceClient) return false;

  try {
    const { data, error, status } = await serviceClient
      .from("super_admins")
      .select("user_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      if (process.env.NODE_ENV !== "production" && error) {
        console.error("[super-admin] Error checking super admin status for user:", error.message, error.code, status);
      }
      return false;
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[super-admin] Error checking super admin status for user:", error);
    }
    return false;
  }
}

