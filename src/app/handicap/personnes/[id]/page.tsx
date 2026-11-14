import { notFound, redirect } from "next/navigation";
import { HandicapCaseDossier } from "@/components/handicap/handicap-case-dossier";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { loadDisabilityCaseDetail } from "@/lib/handicap/case-data";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapPersonnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return <p className="text-sm text-[#9AA3BD]">Service indisponible.</p>;
  }

  const { id: rawId } = await params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) notFound();

  if (caseId !== rawId) {
    redirect(`/handicap/personnes/${caseId}`);
  }

  await writeDisabilityAccessLog(service, {
    caseId,
    actorId: gate.userId,
    action: "view_case",
  });

  const detail = await loadDisabilityCaseDetail(service, caseId);
  if (!detail) notFound();

  return (
    <HandicapCaseDossier
      initial={{ case: detail, isSuperAdmin: await isSuperAdmin() }}
    />
  );
}
