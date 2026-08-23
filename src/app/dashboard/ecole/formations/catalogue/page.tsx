import { OrgCatalogueEdgeView } from "@/components/org/org-catalogue-edge-view";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { listEdgeCatalogueForOrgHub } from "@/lib/org/org-formations";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsCataloguePage() {
  await requireEcoleOrgId("/dashboard/ecole/formations/catalogue");
  const courses = await listEdgeCatalogueForOrgHub();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <OrgFormationsShell
        basePath="/dashboard/ecole/formations"
        title="Catalogue EDGE"
        lead="Parcourez les formations EDGE Online. Vos formations organisationnelles restent privées."
        variant="light"
      >
        <OrgCatalogueEdgeView courses={courses} variant="light" />
      </OrgFormationsShell>
    </div>
  );
}
