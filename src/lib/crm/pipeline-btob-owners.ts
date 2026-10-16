export const PIPELINE_BTOB_CONTACT_OWNERS = [
  {
    email: "jerome.picot@edgebs.fr",
    label: "Jérôme Picot",
    catalogueFromEmail: "contact@byound.fr",
    catalogueFromName: "Jérôme Picot",
  },
  {
    email: "timmydarcy44@gmail.com",
    label: "Timmy Darcy",
    catalogueFromEmail: "contact@byound.fr",
    catalogueFromName: "Timmy Darcy",
  },
] as const;

export type PipelineBtobOwnerEmail = (typeof PIPELINE_BTOB_CONTACT_OWNERS)[number]["email"];

export const PIPELINE_BTOB_OWNER_EMAILS = PIPELINE_BTOB_CONTACT_OWNERS.map((o) => o.email);

export const DEFAULT_PIPELINE_BTOB_OWNER_EMAIL: PipelineBtobOwnerEmail = "timmydarcy44@gmail.com";

export function pipelineOwnerLabel(email: string | null | undefined): string {
  const found = PIPELINE_BTOB_CONTACT_OWNERS.find((o) => o.email === email);
  return found?.label ?? email ?? "—";
}

export function isValidPipelineOwnerEmail(email: string | null | undefined): email is PipelineBtobOwnerEmail {
  if (!email) return false;
  return PIPELINE_BTOB_OWNER_EMAILS.includes(email as PipelineBtobOwnerEmail);
}

export function resolveCatalogueFromEmail(ownerEmail: string | null | undefined): string {
  const found = PIPELINE_BTOB_CONTACT_OWNERS.find((o) => o.email === ownerEmail);
  return found?.catalogueFromEmail ?? "contact@byound.fr";
}

export function resolveCatalogueFromName(ownerEmail: string | null | undefined): string {
  const found = PIPELINE_BTOB_CONTACT_OWNERS.find((o) => o.email === ownerEmail);
  return found?.catalogueFromName ?? "Byound";
}

export const CONTACT_CIVILITY_OPTIONS = ["Monsieur", "Madame"] as const;
export type ContactCivility = (typeof CONTACT_CIVILITY_OPTIONS)[number];

const JEROME_EMAIL = "jerome.picot@edgebs.fr";
const TIMMY_EMAIL = "timmydarcy44@gmail.com";

export function resolveCatalogueFromForCurrentUser(
  currentUserEmail: string | null | undefined,
): { email: string; name: string } {
  const norm = currentUserEmail?.trim().toLowerCase() ?? "";
  if (norm === JEROME_EMAIL) {
    return { email: "contact@byound.fr", name: "Jérôme Picot" };
  }
  if (norm === TIMMY_EMAIL) {
    return { email: "contact@byound.fr", name: "Timmy Darcy" };
  }
  return { email: "contact@byound.fr", name: "Byound" };
}
