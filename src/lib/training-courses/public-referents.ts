/**
 * Contacts publics Qualiopi (indicateur 1) — constantes uniques,
 * surchargeables par fiche via `contact_referent` / `handicap_referent`.
 */
import {
  QUALIOPI_HANDICAP_REFERENT_LINE,
  QUALIOPI_PUBLIC_CONTACT_EMAIL,
  QUALIOPI_PUBLIC_CONTACT_LINE,
} from "@/lib/qualiopi/public-copy";

export const DEFAULT_CONTACT_REFERENT = QUALIOPI_PUBLIC_CONTACT_LINE;

export const DEFAULT_CONTACT_REFERENT_EMAIL = QUALIOPI_PUBLIC_CONTACT_EMAIL;

export const DEFAULT_HANDICAP_REFERENT = QUALIOPI_HANDICAP_REFERENT_LINE;

/** Alias historique — même adresse que le contact unique Qualiopi. */
export const DEFAULT_HANDICAP_REFERENT_EMAIL = QUALIOPI_PUBLIC_CONTACT_EMAIL;

export function resolveContactReferent(override?: string | null): string {
  const value = String(override ?? "").trim();
  return value || DEFAULT_CONTACT_REFERENT;
}

export function resolveHandicapReferent(override?: string | null): string {
  const value = String(override ?? "").trim();
  return value || DEFAULT_HANDICAP_REFERENT;
}
