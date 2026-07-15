import { PIPELINE_BTOB_OWNER_EMAILS, type PipelineBtobOwnerEmail } from "@/lib/crm/pipeline-btob-owners";
import { getServerClient } from "@/lib/supabase/server";

export function isPipelinePrescripteurUser(
  email: string | null | undefined,
): email is PipelineBtobOwnerEmail {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return PIPELINE_BTOB_OWNER_EMAILS.includes(normalized as PipelineBtobOwnerEmail);
}

export async function requirePipelinePrescripteurAccess(): Promise<{ email: PipelineBtobOwnerEmail } | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase() ?? null;
  if (!isPipelinePrescripteurUser(email)) return null;

  return { email };
}
