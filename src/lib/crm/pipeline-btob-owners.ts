export const PIPELINE_BTOB_CONTACT_OWNERS = [
  {
    email: "jerome.picot@edgebs.fr",
    label: "Jérôme Picot",
  },
  {
    email: "timmydarcy44@gmail.com",
    label: "Timmy Darcy",
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
