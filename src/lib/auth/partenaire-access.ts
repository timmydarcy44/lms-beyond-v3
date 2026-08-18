import { collectProfileRoleKeys } from "@/lib/auth/dashboard-routing";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { isSuperAdminEmailAllowlisted } from "@/lib/auth/super-admin-email-allowlist";

type PartenaireProfileInput = {
  role?: string | null;
  role_type?: string | null;
  email?: string | null;
  roles?: string[] | null;
};

export function canAccessPartenaireDashboard(
  role: string | null | undefined,
  roleType: string | null | undefined,
  email: string | null | undefined,
  roleKeys?: string[],
): boolean {
  if (isSuperAdminEmailAllowlisted(email)) return true;

  const r = String(role ?? "").trim().toLowerCase();
  const rt = String(roleType ?? "").trim().toLowerCase();
  if (r === "partenaire" || r === "demo" || rt === "partenaire" || rt === "demo") return true;
  if (isUniversalAdminRole(r) || isUniversalAdminRole(rt)) return true;

  const keys = roleKeys ?? [];
  return keys.some((key) => key === "partenaire" || key === "demo");
}

export function canAccessPartenaireDashboardFromProfile(
  profile: PartenaireProfileInput | null,
  email?: string | null,
): boolean {
  if (!profile) return false;
  const roleKeys = collectProfileRoleKeys(profile);
  return canAccessPartenaireDashboard(
    profile.role,
    profile.role_type,
    email ?? profile.email,
    roleKeys,
  );
}

/** Compte verrouillé sur /dashboard/partenaire. */
export function isPartenaireOnlyAccount(
  role: string | null | undefined,
  roleType: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (isSuperAdminEmailAllowlisted(email)) return false;
  const roleCo = String(role ?? "").trim().toLowerCase();
  const roleTypeCo = String(roleType ?? "").trim().toLowerCase();
  if (isUniversalAdminRole(roleCo) || isUniversalAdminRole(roleTypeCo)) return false;
  return roleCo === "partenaire" || roleTypeCo === "partenaire";
}
