import { WON_DEAL_STAGES } from "@/lib/onboarding/constants";

/** Compte client créable dès qu’un deal n’a pas encore d’organisation liée. */
export function canCreateOrganisation(
  _stageSlug: string | null | undefined,
  organizationId: string | null | undefined,
) {
  return !organizationId;
}

export function hasOrganisationLink(organizationId: string | null | undefined) {
  return Boolean(organizationId);
}

export function isWonDealStage(stageSlug: string | null | undefined) {
  return WON_DEAL_STAGES.has(String(stageSlug ?? ""));
}
