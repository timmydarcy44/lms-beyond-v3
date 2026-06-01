import { WON_DEAL_STAGES } from "@/lib/onboarding/constants";

export function canCreateOrganisation(stageSlug: string, organizationId: string | null | undefined) {
  return WON_DEAL_STAGES.has(stageSlug) && !organizationId;
}

export function hasOrganisationLink(organizationId: string | null | undefined) {
  return Boolean(organizationId);
}
