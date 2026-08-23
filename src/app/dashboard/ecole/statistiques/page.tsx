import { OrgStatsDashboardView } from "@/components/org/org-stats-dashboard-view";
import { loadOrgFormationStats } from "@/lib/org/org-formations";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleStatistiquesPage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/statistiques");
  const stats = await loadOrgFormationStats(orgId);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <OrgStatsDashboardView stats={stats} variant="light" />
    </div>
  );
}
