"use server";

/**
 * Récupère le branding d'un Super Admin
 */
export async function getSuperAdminBranding(userId?: string) {
  // Garde-fou total: la table `super_admin_settings` n'existe pas dans le schéma audité.
  // On retourne un branding statique pour éviter tout crash au chargement du layout.
  void userId;
  return { company_name: "Beyond", primary_color: "#2563eb", logo_url: null };
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

