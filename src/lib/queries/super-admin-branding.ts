"use server";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/**
 * Récupère le branding d'un Super Admin
 */
export async function getSuperAdminBranding(userId?: string) {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    console.error("[super-admin-branding] Supabase client unavailable");
    return null;
  }

  try {
    // Si userId n'est pas fourni, récupérer l'utilisateur actuel
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        console.error("[super-admin-branding] No authenticated user");
        return null;
      }
      userId = authData.user.id;
    }

    // Utiliser la fonction RPC si disponible
    const { data: brandingData, error: rpcError } = await supabase.rpc(
      'get_super_admin_branding',
      { p_user_id: userId }
    );

    if (!rpcError && brandingData && brandingData.length > 0) {
      return brandingData[0];
    }

    // Fallback: query directe
    const { data, error } = await supabase
      .from("super_admin_branding")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[super-admin-branding] Error fetching branding:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[super-admin-branding] Unexpected error:", error);
    return null;
  }
}

/**
 * Met à jour le branding d'un Super Admin
 */
export async function updateSuperAdminBranding(
  branding: Partial<{
    platform_name: string;
    platform_logo_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    surface_color: string;
    text_primary_color: string;
    text_secondary_color: string;
    font_family: string;
    border_radius: string;
  }>
) {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return { error: "Supabase client unavailable" };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { error: "No authenticated user" };
    }

    const { data, error } = await supabase
      .from("super_admin_branding")
      .upsert({
        user_id: authData.user.id,
        ...branding,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[super-admin-branding] Error updating branding:", error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error("[super-admin-branding] Unexpected error:", error);
    return { error: "Unexpected error" };
  }
}

/**
 * Récupère les valeurs par défaut de branding
 */
export async function getDefaultBranding() {
  return {
    platform_name: "Beyond",
    platform_logo_url: null,
    primary_color: "#0066FF",
    secondary_color: "#6366F1",
    accent_color: "#8B5CF6",
    background_color: "#FFFFFF",
    surface_color: "#F9FAFB",
    text_primary_color: "#1F2937",
    text_secondary_color: "#6B7280",
    font_family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    border_radius: "8px",
  };
}

