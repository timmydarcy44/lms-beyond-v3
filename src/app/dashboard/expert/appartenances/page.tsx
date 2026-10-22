import { redirect } from "next/navigation";

import { MembershipsAdmin } from "@/components/expert/memberships-admin";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { getAdminExperts } from "@/lib/queries/admin-experts";

export const dynamic = "force-dynamic";

export default async function ExpertMembershipsPage() {
  const [state, superAdmin] = await Promise.all([loadExpertPoleState(), isSuperAdmin()]);
  if (!superAdmin && state.managerPoles.length === 0) redirect("/dashboard/expert");
  const experts = await getAdminExperts(null);
  const fixedPole = !superAdmin && state.managerPoles.length === 1 ? state.managerPoles[0] : undefined;
  return (
    <MembershipsAdmin
      superAdmin={superAdmin}
      fixedPole={fixedPole}
      experts={experts.map((expert) => ({
        id: expert.id,
        name: [expert.first_name, expert.last_name].filter(Boolean).join(" ") || expert.email || expert.id,
      }))}
    />
  );
}
