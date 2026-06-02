import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError, OnboardingStepError } from "@/lib/onboarding/onboarding-errors";

/**
 * Vérifie que la migration 20260602120000_client_onboarding_workflow est appliquée.
 */
export async function verifyOnboardingSchema(service: SupabaseClient): Promise<void> {
  const orgProbe = await service.from("organizations").select("onboarding_step").limit(0);
  if (orgProbe.error && isMissingColumnError(orgProbe.error.message)) {
    throw new OnboardingStepError({
      step: "verify_schema_organizations",
      error: "Colonne organizations.onboarding_step absente",
      detail: orgProbe.error.message,
      status: 500,
    });
  }
  if (orgProbe.error) {
    throw new OnboardingStepError({
      step: "verify_schema_organizations",
      error: "Impossible de lire la table organizations",
      detail: orgProbe.error.message,
      status: 500,
    });
  }

  const dealProbe = await service
    .from("crm_pipeline_deals")
    .select("organization_id")
    .limit(0);
  if (dealProbe.error && isMissingColumnError(dealProbe.error.message)) {
    throw new OnboardingStepError({
      step: "verify_schema_crm_deals",
      error: "Colonne crm_pipeline_deals.organization_id absente",
      detail: dealProbe.error.message,
      status: 500,
    });
  }
  if (dealProbe.error) {
    throw new OnboardingStepError({
      step: "verify_schema_crm_deals",
      error: "Impossible de lire la table crm_pipeline_deals",
      detail: dealProbe.error.message,
      status: 500,
    });
  }
}
