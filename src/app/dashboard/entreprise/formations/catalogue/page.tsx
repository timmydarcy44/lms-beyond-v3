import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgCatalogueEdgeView } from "@/components/org/org-catalogue-edge-view";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { listEdgeCatalogueForOrgHub } from "@/lib/org/org-formations";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsCataloguePage() {
  await requireEntrepriseOrgId("/dashboard/entreprise/formations/catalogue");
  const courses = await listEdgeCatalogueForOrgHub();

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Formations EDGE"
          lead="Parcourez les formations EDGE Online. Vos formations internes restent privées à l’entreprise."
          variant="dark"
          hideTabs
        >
          <OrgCatalogueEdgeView courses={courses} variant="dark" />
        </OrgFormationsShell>
      </main>
    </div>
  );
}
