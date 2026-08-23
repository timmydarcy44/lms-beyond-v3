import { OrgFormationsManageView } from "@/components/org/org-formations-manage-view";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { listOrgCourses, listOrgLearners } from "@/lib/org/org-formations";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsGererPage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/gerer");
  const [courses, learners] = await Promise.all([listOrgCourses(orgId), listOrgLearners(orgId)]);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <OrgFormationsShell
        basePath="/dashboard/ecole/formations"
        title="Gérer mes formations"
        lead="Formations créées pour votre organisation. Assignation limitée à vos apprenants."
        variant="light"
      >
        <OrgFormationsManageView
          courses={courses}
          learners={learners}
          orgId={orgId}
          basePath="/dashboard/ecole/formations"
          variant="light"
        />
      </OrgFormationsShell>
    </div>
  );
}
