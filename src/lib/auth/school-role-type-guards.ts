/** Pure helpers (Edge-safe) for école `role` + `role_type` commercialisation / accès module Handicap. */

export function normalizeAccentedLower(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const HANDICAP_PORTFOLIO_ONLY_ROLE_TYPES = new Set([
  "referente_handicap",
  "referent_handicap",
  "referente_handicape",
  "referent_handicape",
  "rh_handicap",
  "charge_handicap",
  "chargee_handicap",
  "chargé_handicap",
  "chargée_handicap",
  "ref_handicap",
  "accompagnant_handicap",
  "accompagnante_handicap",
]);

/**
 * Profils « offre Handicap / Beyond Connect Handicap uniquement » : pas d’accès au reste du dashboard école
 * (apprenants, classes, offres, etc.) — uniquement `/dashboard/ecole/handicap/...`.
 */
export function isHandicapPortfolioOnlyRoleType(roleType: unknown): boolean {
  const n = normalizeAccentedLower(roleType).replace(/é/g, "e");
  if (!n) return false;
  return HANDICAP_PORTFOLIO_ONLY_ROLE_TYPES.has(n);
}

export function isEcoleHandicapSectionPath(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return p === "/dashboard/ecole/handicap" || p.startsWith("/dashboard/ecole/handicap/");
}

/**
 * Restreindre au module Handicap si le métier est « référent handicap » et le compte est rattaché à l’espace école.
 */
export function shouldRestrictSchoolDashboardToHandicapOnly(input: {
  profileRole: string | null | undefined;
  profileRoleType: string | null | undefined;
}): boolean {
  if (!isHandicapPortfolioOnlyRoleType(input.profileRoleType)) return false;
  const r = normalizeAccentedLower(input.profileRole).replace(/é/g, "e");
  if (r === "ecole") return true;
  if (
    r === "cfa" ||
    r === "school" ||
    r === "etablissement" ||
    r === "establishment" ||
    r === "admin_ecole" ||
    r === "gestionnaire_ecole" ||
    r === "coordonnateur_pedagogique" ||
    r === "organisme_de_formation"
  ) {
    return true;
  }
  return false;
}
