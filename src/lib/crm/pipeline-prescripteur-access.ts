import { PIPELINE_BTOB_OWNER_EMAILS, type PipelineBtobOwnerEmail } from "@/lib/crm/pipeline-btob-owners";

export function isPipelinePrescripteurUser(
  email: string | null | undefined,
): email is PipelineBtobOwnerEmail {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return PIPELINE_BTOB_OWNER_EMAILS.includes(normalized as PipelineBtobOwnerEmail);
}
