import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

/**
 * Vérifie si une organisation a accès à une fonctionnalité spécifique
 */
export async function hasOrganizationFeature(
  orgId: string,
  featureKey: string
): Promise<boolean> {
  const supabase = await getServerClient();
  if (!supabase) {
    console.warn("[organization-features] Supabase client not available");
    return false;
  }

  try {
    const { data, error } = await supabase.rpc("has_feature", {
      p_org_id: orgId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error("[organization-features] Error checking feature:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("[organization-features] Unexpected error:", error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur actuel a accès à une fonctionnalité via son organisation
 */
export async function hasUserFeature(featureKey: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.id) {
    return false;
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return false;
  }

  try {
    // Récupérer TOUTES les organisations de l'utilisateur (pas seulement la première)
    const { data: memberships, error: membershipError } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id);

    if (membershipError || !memberships || memberships.length === 0) {
      console.log("[organization-features] User not part of an organization");
      return false;
    }

    // Vérifier si AU MOINS UNE organisation a la fonctionnalité activée
    for (const membership of memberships) {
      const hasAccess = await hasOrganizationFeature(membership.org_id, featureKey);
      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[organization-features] Unexpected error:", error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur actuel est admin dans au moins une organisation avec la fonctionnalité
 */
export async function isUserAdminWithFeature(featureKey: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.id) {
    return false;
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return false;
  }

  try {
    // Récupérer toutes les organisations de l'utilisateur avec leur rôle
    const { data: memberships, error: membershipError } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", session.id);

    if (membershipError || !memberships || memberships.length === 0) {
      console.log("[organization-features] User not part of an organization");
      return false;
    }

    // Récupérer les organisations avec la fonctionnalité activée
    const orgIds = memberships.map(m => m.org_id);
    const { data: features } = await supabase
      .from("organization_features")
      .select("org_id")
      .in("org_id", orgIds)
      .eq("feature_key", featureKey)
      .eq("is_enabled", true);

    const orgsWithFeature = features?.map(f => f.org_id) || [];

    // Vérifier si l'utilisateur est admin dans au moins une organisation avec la fonctionnalité
    const isAdmin = memberships.some(
      m => m.role === "admin" && orgsWithFeature.includes(m.org_id)
    );

    return isAdmin;
  } catch (error) {
    console.error("[organization-features] Unexpected error:", error);
    return false;
  }
}

/**
 * Récupère toutes les fonctionnalités activées pour une organisation
 */
export async function getOrganizationFeatures(orgId: string) {
  const supabase = await getServerClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc("get_organization_features", {
      p_org_id: orgId,
    });

    if (error) {
      console.error("[organization-features] Error fetching features:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[organization-features] Unexpected error:", error);
    return [];
  }
}

/**
 * Active une fonctionnalité pour une organisation (super admin uniquement)
 */
export async function enableOrganizationFeature(
  orgId: string,
  featureKey: string,
  metadata?: Record<string, any>
) {
  const supabase = await getServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const session = await getSession();
  if (!session?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const { data, error } = await supabase
      .from("organization_features")
      .upsert(
        {
          org_id: orgId,
          feature_key: featureKey,
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          enabled_by: session.id,
          metadata: metadata || null,
        },
        {
          onConflict: "org_id,feature_key",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[organization-features] Error enabling feature:", error);
    throw error;
  }
}

/**
 * Désactive une fonctionnalité pour une organisation (super admin uniquement)
 */
export async function disableOrganizationFeature(
  orgId: string,
  featureKey: string
) {
  const supabase = await getServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    const { data, error } = await supabase
      .from("organization_features")
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("feature_key", featureKey)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[organization-features] Error disabling feature:", error);
    throw error;
  }
}

