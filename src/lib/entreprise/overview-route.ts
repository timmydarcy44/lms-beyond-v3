import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

const MANAGER_ROLES = new Set(["entreprise", "admin_hr", "rh", "manager"]);

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

export async function resolveEntrepriseOverviewAccess(): Promise<EntrepriseOverviewAccess> {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id || !profile) {
    return { ok: false, error: "Non authentifié", status: 401 };
  }

  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  if (
    role !== "super_admin" &&
    roleType !== "super_admin" &&
    !MANAGER_ROLES.has(role) &&
    !MANAGER_ROLES.has(roleType) &&
    roleType !== "entreprise"
  ) {
    return { ok: false, error: "Accès réservé aux responsables RH entreprise", status: 403 };
  }

  const viewer = {
    email: user.email ?? profile.email ?? null,
    prenom:
      (profile as { prenom?: string | null; first_name?: string | null }).prenom ??
      (profile as { first_name?: string | null }).first_name ??
      null,
    nom:
      (profile as { nom?: string | null; last_name?: string | null }).nom ??
      (profile as { last_name?: string | null }).last_name ??
      null,
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
