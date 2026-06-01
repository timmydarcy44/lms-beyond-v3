import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const BRIEFING_ROLES = new Set(["admin_hr", "manager", "entreprise", "admin", "rh"]);

export type BriefingAccess =
  | { ok: true; scope: "global"; organizationId: null; userId: string }
  | { ok: true; scope: "organization"; organizationId: string; userId: string }
  | { ok: false; error: string; status: 401 | 403 };

export async function resolveBriefingAccess(): Promise<BriefingAccess> {
  if (await isSuperAdmin()) {
    const { user } = await getCurrentProfileWithAccess();
    if (!user?.id) return { ok: false, error: "Non authentifié", status: 401 };
    return { ok: true, scope: "global", organizationId: null, userId: user.id };
  }

  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id || !profile) {
    return { ok: false, error: "Non authentifié", status: 401 };
  }

  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  const allowed =
    BRIEFING_ROLES.has(role) ||
    BRIEFING_ROLES.has(roleType) ||
    roleType === "entreprise";

  if (!allowed) {
    return { ok: false, error: "Accès refusé", status: 403 };
  }

  const organizationId = profile.company_id?.trim() || null;
  if (!organizationId) {
    return { ok: false, error: "Organisation non configurée", status: 403 };
  }

  return { ok: true, scope: "organization", organizationId, userId: user.id };
}
