import type { SupabaseClient } from "@supabase/supabase-js";

/** Compte limité : identité + demandes formation, sans SaaS (tests, skills, recrutement…). */
export async function getOrganizationFormationOnly(
  db: SupabaseClient,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("organizations")
    .select("formation_only")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) {
    // Colonne absente tant que la migration n'est pas appliquée
    if (/formation_only/i.test(error.message)) return false;
    return false;
  }
  return Boolean((data as { formation_only?: boolean } | null)?.formation_only);
}

export const FORMATION_ONLY_HOME = "/dashboard/entreprise/formations/demander";

/** Routes autorisées pour un compte formation_only. */
export function isFormationOnlyAllowedPath(pathname: string): boolean {
  // Accueil SaaS → redirigé vers demander (voir FormationOnlyGate)
  if (pathname === "/dashboard/entreprise") return false;
  const allowed = [
    "/dashboard/entreprise/formations/demander",
    "/dashboard/entreprise/compte",
    "/dashboard/entreprise/parametres",
    "/dashboard/entreprise/salaries",
    "/dashboard/entreprise/aide",
    "/dashboard/entreprise/reclamation",
    "/dashboard/entreprise/messages",
  ];
  return allowed.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
