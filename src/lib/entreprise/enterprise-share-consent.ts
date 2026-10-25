import type { SupabaseClient } from "@supabase/supabase-js";

export type EnterpriseTestKind = "disc" | "idmc" | "soft_skills";

export type EnterpriseShareConsentRow = {
  consentement_donne: boolean;
  disc_shared: boolean;
  idmc_shared: boolean;
  soft_skills_shared: boolean;
};

const TEST_COLUMN: Record<EnterpriseTestKind, keyof EnterpriseShareConsentRow> = {
  disc: "disc_shared",
  idmc: "idmc_shared",
  soft_skills: "soft_skills_shared",
};

export async function getEnterpriseShareConsent(
  service: SupabaseClient,
  profileId: string,
  organisationId: string,
): Promise<EnterpriseShareConsentRow | null> {
  const { data } = await service
    .from("collaborateur_entreprise_consentements")
    .select("consentement_donne, disc_shared, idmc_shared, soft_skills_shared")
    .eq("collaborateur_id", profileId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  return (data as EnterpriseShareConsentRow | null) ?? null;
}

export function isTestSharedWithEnterprise(
  consent: EnterpriseShareConsentRow | null,
  test: EnterpriseTestKind,
): boolean {
  if (!consent?.consentement_donne) return false;
  return Boolean(consent[TEST_COLUMN[test]]);
}

export function hasAnyEnterpriseShareConsent(consent: EnterpriseShareConsentRow | null): boolean {
  if (!consent?.consentement_donne) return false;
  return consent.disc_shared || consent.idmc_shared || consent.soft_skills_shared;
}

/** Masque les résultats non partagés pour la vue entreprise (RGPD). */
export function maskTestResultsForEnterprise<T extends {
  disc: unknown;
  idmc_score: number | null;
  idmc_axes: Record<string, number> | null;
  soft_skills: Array<{ skill: string; score: number }>;
  disc_at?: string | null;
  idmc_at?: string | null;
  soft_skills_at?: string | null;
}>(
  results: T,
  consent: EnterpriseShareConsentRow | null,
): T {
  if (!consent?.consentement_donne) {
    return {
      ...results,
      disc: null,
      idmc_score: null,
      idmc_axes: null,
      soft_skills: [],
      disc_at: null,
      idmc_at: null,
      soft_skills_at: null,
    };
  }
  return {
    ...results,
    disc: consent.disc_shared ? results.disc : null,
    disc_at: consent.disc_shared ? results.disc_at ?? null : null,
    idmc_score: consent.idmc_shared ? results.idmc_score : null,
    idmc_axes: consent.idmc_shared ? results.idmc_axes : null,
    idmc_at: consent.idmc_shared ? results.idmc_at ?? null : null,
    soft_skills: consent.soft_skills_shared ? results.soft_skills : [],
    soft_skills_at: consent.soft_skills_shared ? results.soft_skills_at ?? null : null,
  };
}

export type EnterpriseConsentSurface = "apprenant" | "salarie";

export function buildPostTestRedirectUrl(
  test: EnterpriseTestKind,
  defaultNext: string,
  hasOrganisation: boolean,
  surface: EnterpriseConsentSurface = "apprenant",
): string {
  if (!hasOrganisation) return defaultNext;
  const params = new URLSearchParams({
    test,
    next: defaultNext,
  });
  const base =
    surface === "salarie"
      ? "/dashboard/salarie/partage-entreprise"
      : "/dashboard/apprenant/partage-entreprise";
  return `${base}?${params.toString()}`;
}
