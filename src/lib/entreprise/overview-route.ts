import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";

const MANAGER_ROLES = new Set(["entreprise", "admin_hr", "rh", "manager", "admin"]);

export type EntrepriseOverviewAccess =
  | {
      ok: true;
      userId: string;
      organizationId: string;
      viewer: {
        email: string | null;
        prenom: string | null;
        nom: string | null;
      };
    }
  | {
      ok: true;
      superAdminPreview: true;
      userId: string;
      viewer: {
        email: string | null;
        prenom: string | null;
        nom: string | null;
      };
    }
  | {
      ok: true;
      configurationRequired: true;
      userId: string;
      viewer: {
        email: string | null;
        prenom: string | null;
        nom: string | null;
      };
    }
  | { ok: false; error: string; status: 401 | 403 };

function isSuperAdminProfile(profile: { role?: string | null; role_type?: string | null }) {
  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  return isUniversalAdminRole(role) || role === "super_admin" || roleType === "super_admin";
}

function canAccessEntrepriseDashboard(profile: {
  role?: string | null;
  role_type?: string | null;
  company_id?: string | null;
}) {
  if (isSuperAdminProfile(profile)) return true;
  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  if (MANAGER_ROLES.has(role) || MANAGER_ROLES.has(roleType)) return true;
  if (roleType === "entreprise") return true;
  return false;
}

export async function resolveEntrepriseOverviewAccess(): Promise<EntrepriseOverviewAccess> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { ok: false, error: "Configuration Supabase manquante", status: 401 };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false, error: "Non authentifié", status: 401 };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, full_name, email, company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[entreprise/overview] profile", profileError);
    return { ok: false, error: "Impossible de lire le profil", status: 401 };
  }

  const profile = profileRow as {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string | null;
    company_id?: string | null;
    role?: string | null;
    role_type?: string | null;
  } | null;

  if (!profile) {
    return { ok: false, error: "Profil introuvable", status: 401 };
  }

  if (!canAccessEntrepriseDashboard(profile)) {
    const service = getServiceRoleClient();
    if (service) {
      const { data: membership } = await service
        .from("org_memberships")
        .select("org_id, role")
        .eq("user_id", user.id)
        .in("role", ["admin", "manager"])
        .limit(1)
        .maybeSingle();
      if (!membership?.org_id) {
        return { ok: false, error: "Accès réservé aux responsables RH entreprise", status: 403 };
      }
      const viewer = {
        email: user.email ?? profile.email ?? null,
        prenom: profile.first_name ?? null,
        nom: profile.last_name ?? null,
      };
      return { ok: true, userId: user.id, organizationId: String(membership.org_id), viewer };
    }
    return { ok: false, error: "Accès réservé aux responsables RH entreprise", status: 403 };
  }

  const viewer = {
    email: user.email ?? profile.email ?? null,
    prenom: profile.first_name ?? null,
    nom: profile.last_name ?? null,
  };

  const organizationId = profile.company_id?.trim() || null;
  if (!organizationId) {
    if (isSuperAdminProfile(profile)) {
      return { ok: true, superAdminPreview: true, userId: user.id, viewer };
    }
    return { ok: true, configurationRequired: true, userId: user.id, viewer };
  }

  return { ok: true, userId: user.id, organizationId, viewer };
}

export function getEntrepriseOverviewServiceClient() {
  return getServiceRoleClient();
}
