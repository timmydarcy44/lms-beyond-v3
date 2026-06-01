import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

const MANAGER_ROLES = new Set(["entreprise", "admin_hr", "admin", "rh", "manager"]);

export type EntrepriseAssistantAccess =
  | { ok: true; userId: string; organizationId: string }
  | { ok: false; error: string; status: 401 | 403 };

/** profiles.company_id = organizations.id (organization_id métier). */
export async function resolveEntrepriseAssistantAccess(): Promise<EntrepriseAssistantAccess> {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id || !profile) {
    return { ok: false, error: "Non authentifié", status: 401 };
  }

  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  if (!MANAGER_ROLES.has(role) && !MANAGER_ROLES.has(roleType) && roleType !== "entreprise") {
    return { ok: false, error: "Accès réservé aux managers RH", status: 403 };
  }

  const organizationId = profile.company_id?.trim() || null;
  if (!organizationId) {
    return { ok: false, error: "Organisation non configurée", status: 403 };
  }

  return { ok: true, userId: user.id, organizationId };
}

/** Refuse les tentatives explicites d'accès à une autre organisation. */
export function rejectsCrossOrganizationRequest(message: string, ownOrgId: string): boolean {
  const lower = message.toLowerCase();
  if (/org\s*b\b|organisation\s*b\b|orga\s*b\b/.test(lower)) return true;

  const uuidRe =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  for (const match of message.matchAll(uuidRe)) {
    if (match[0].toLowerCase() !== ownOrgId.toLowerCase()) return true;
  }
  return false;
}
