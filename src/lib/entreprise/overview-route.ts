import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

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
      configurationRequired: true;
      userId: string;
      viewer: {
        email: string | null;
        prenom: string | null;
        nom: string | null;
      };
    }
  | { ok: false; error: string; status: 401 | 403 };

function canAccessEntrepriseDashboard(profile: {
  role?: string | null;
  role_type?: string | null;
  company_id?: string | null;
}) {
  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  if (role === "super_admin" || roleType === "super_admin") return true;
  if (MANAGER_ROLES.has(role) || MANAGER_ROLES.has(roleType)) return true;
  if (roleType === "entreprise") return true;
  if (Boolean(profile.company_id?.trim())) return true;
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

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("prenom, nom, first_name, last_name, email, company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as {
    prenom?: string | null;
    nom?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    company_id?: string | null;
    role?: string | null;
    role_type?: string | null;
  } | null;

  if (!profile) {
    return { ok: false, error: "Profil introuvable", status: 401 };
  }

  if (!canAccessEntrepriseDashboard(profile)) {
    return { ok: false, error: "Accès réservé aux responsables RH entreprise", status: 403 };
  }

  const viewer = {
    email: user.email ?? profile.email ?? null,
    prenom: profile.prenom ?? profile.first_name ?? null,
    nom: profile.nom ?? profile.last_name ?? null,
  };

  const organizationId = profile.company_id?.trim() || null;
  if (!organizationId) {
    return { ok: true, configurationRequired: true, userId: user.id, viewer };
  }

  return { ok: true, userId: user.id, organizationId, viewer };
}

export function getEntrepriseOverviewServiceClient() {
  return getServiceRoleClient();
}
