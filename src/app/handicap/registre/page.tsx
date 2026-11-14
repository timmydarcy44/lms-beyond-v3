import { redirect } from "next/navigation";
import { HandicapRegistre } from "@/components/handicap/handicap-registre";
import { loadDisabilityRegistre } from "@/lib/handicap/registre-data";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapRegistrePage() {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return <p className="text-sm text-[#9AA3BD]">Service indisponible.</p>;
  }

  const rows = await loadDisabilityRegistre(service);
  return (
    <HandicapRegistre
      rows={rows.map(({ caseId: _id, ...rest }) => rest)}
    />
  );
}
