import { redirect } from "next/navigation";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { getServiceRoleClient } from "@/lib/supabase/server";

export default async function LegacyHandicapGestionRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = getServiceRoleClient();
  if (service) {
    const caseId = await resolveDisabilityCaseId(service, id);
    if (caseId) redirect(`/handicap/personnes/${caseId}`);
  }
  redirect("/handicap");
}
