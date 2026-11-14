import { redirect } from "next/navigation";
import { handicapCasePath } from "@/lib/handicap/paths";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { getServiceRoleClient } from "@/lib/supabase/server";

export default async function LegacyHandicapFicheRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = getServiceRoleClient();
  if (service) {
    const caseId = await resolveDisabilityCaseId(service, id);
    if (caseId) redirect(handicapCasePath(caseId));
  }
  redirect("/handicap");
}
