/** Rôles avec accès dashboard/entreprise (RH / admin client). */
const MANAGER_ROLES = new Set([
  "admin",
  "owner",
  "admin_hr",
  "rh",
  "entreprise",
  "manager",
]);

export function isEntrepriseManagerRole(
  role?: string | null,
  roleType?: string | null,
): boolean {
  const r = String(role ?? "").trim().toLowerCase();
  const rt = String(roleType ?? "").trim().toLowerCase();
  return MANAGER_ROLES.has(r) || MANAGER_ROLES.has(rt);
}
