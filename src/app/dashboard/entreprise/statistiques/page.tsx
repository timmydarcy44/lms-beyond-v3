import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgStatsDashboardView } from "@/components/org/org-stats-dashboard-view";
import { JADE_ORG_STATS } from "@/lib/demo/jade-dashboard-mocks";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { loadOrgFormationStats } from "@/lib/org/org-formations";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EntrepriseStatistiquesPage() {
  const session = await getSession();
  const jade = isJadeDemoEmail(session?.email);
  const { orgId } = jade
    ? { orgId: "jade-org" }
    : await requireEntrepriseOrgId("/dashboard/entreprise/statistiques");
  const stats = jade
    ? JADE_ORG_STATS
    : await loadOrgFormationStats(orgId, { viewerEmail: session?.email ?? null });

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[104px]">
        <OrgStatsDashboardView stats={stats} variant="dark" />
      </main>
    </div>
  );
}
