import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgFormationsManageView } from "@/components/org/org-formations-manage-view";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { listOrgCourses, listOrgLearners } from "@/lib/org/org-formations";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsGererPage() {
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/gerer");
  const [courses, learners] = await Promise.all([listOrgCourses(orgId), listOrgLearners(orgId)]);

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Gérer mes formations"
          lead="Formations internes. Assignation limitée aux salariés de votre organisation."
          variant="dark"
        >
          <OrgFormationsManageView
            courses={courses}
            learners={learners}
            orgId={orgId}
            basePath="/dashboard/entreprise/formations"
            variant="dark"
          />
        </OrgFormationsShell>
      </main>
    </div>
  );
}
