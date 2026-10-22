import { MembershipsAdmin } from "@/components/expert/memberships-admin";
import { getAdminExperts } from "@/lib/queries/admin-experts";

export const dynamic = "force-dynamic";

export default async function SuperMembershipsPage() {
  const experts = await getAdminExperts(null);
  return (
    <MembershipsAdmin
      superAdmin
      experts={experts.map((expert) => ({
        id: expert.id,
        name: [expert.first_name, expert.last_name].filter(Boolean).join(" ") || expert.email || expert.id,
      }))}
    />
  );
}
