import { getServerClient } from "@/lib/supabase/server";
import type { PipelineBtobOwnerEmail } from "@/lib/crm/pipeline-btob-owners";
import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";

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
