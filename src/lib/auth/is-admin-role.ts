/** Profils avec accès « universel » (école + parcours apprenant). */
export function isUniversalAdminRole(role: string | null | undefined): boolean {
  const r = String(role ?? "").trim().toLowerCase();
  return r === "admin" || r === "super_admin";
}
