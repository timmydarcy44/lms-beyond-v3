/**
 * Contacts publics Qualiopi (indicateur 1) — constantes uniques,
 * surchargeables par fiche via `contact_referent` / `handicap_referent`.
 */

export const DEFAULT_CONTACT_REFERENT =
  "Jessica Contentin — jessica.contentin@byound.fr";

export const DEFAULT_CONTACT_REFERENT_EMAIL = "jessica.contentin@byound.fr";

export const DEFAULT_HANDICAP_REFERENT =
  "referent-handicap@byound.fr — Jessica Contentin, étude personnalisée de chaque situation.";

export const DEFAULT_HANDICAP_REFERENT_EMAIL = "referent-handicap@byound.fr";

export function resolveContactReferent(override?: string | null): string {
  const value = String(override ?? "").trim();
  return value || DEFAULT_CONTACT_REFERENT;
}

export function resolveHandicapReferent(override?: string | null): string {
  const value = String(override ?? "").trim();
  return value || DEFAULT_HANDICAP_REFERENT;
}
