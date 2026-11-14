import { redirect } from "next/navigation";
import { HandicapHome } from "@/components/handicap/handicap-home";
import { loadHandicapHomeData } from "@/lib/handicap/home-data";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapHomePage() {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return (
      <p className="text-sm text-[#9AA3BD]">Service indisponible.</p>
    );
  }

  const data = await loadHandicapHomeData(service, gate.firstName || "Référente");
  return <HandicapHome data={data} />;
}
