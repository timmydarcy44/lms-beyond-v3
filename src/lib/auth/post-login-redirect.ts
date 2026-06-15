/**
 * Redirection post-login à partir de `profiles.role` (string simple).
 * Prioritaire sur les heuristiques multi-espaces pour les rôles métier connus.
 */

import { resolveJessicaPostLoginDestination } from "@/lib/jessica-contentin/studio-config";

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

/** Rôle normalisé → chemin de destination */
export const PROFILE_ROLE_DESTINATIONS: Record<string, string> = {
  super_admin: "/super",
  admin_hr: "/dashboard/entreprise",
  manager: "/dashboard/entreprise",
  rh: "/dashboard/entreprise",
  entreprise: "/dashboard/entreprise",
  client: "/dashboard/entreprise",
  apprenant: "/dashboard/apprenant",
  student: "/dashboard/apprenant",
  learner: "/dashboard/apprenant",
  particulier: "/dashboard/apprenant",
  formateur: "/dashboard/formateur",
  instructor: "/dashboard/formateur",
  mentor: "/dashboard/formateur",
  expert: "/dashboard/expert",
  praticien_bct: "/dashboard/praticien",
  praticien: "/dashboard/praticien",
  club: "/dashboard/club",
  partenaire: "/dashboard/partenaire",
};

/**
 * Retourne la destination pour un rôle profil, ou `null` si non reconnu.
 */
export function resolveDestinationFromProfileRole(
  role: string | null | undefined,
): string | null {
  const key = normalize(role);
  if (!key) return null;
  return PROFILE_ROLE_DESTINATIONS[key] ?? null;
}

/**
 * Lit `profiles.role` puis `profiles.role_type` (secours).
 */
export function resolveDestinationFromProfile(
  profile: {
    role?: string | null;
    role_type?: string | null;
    email?: string | null;
  } | null,
): string | null {
  if (!profile) return null;
  const jessicaDest = resolveJessicaPostLoginDestination(profile.email);
  if (jessicaDest) return jessicaDest;
  return (
    resolveDestinationFromProfileRole(profile.role) ??
    resolveDestinationFromProfileRole(profile.role_type)
  );
}

export function isKnownProfileRole(role: string | null | undefined): boolean {
  return resolveDestinationFromProfileRole(role) !== null;
}
