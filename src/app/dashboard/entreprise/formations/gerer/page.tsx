import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgFormationsManageView } from "@/components/org/org-formations-manage-view";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_ORG_COURSES, JADE_ORG_LEARNERS } from "@/lib/demo/jade-dashboard-mocks";
import { listOrgCourses, listOrgLearners } from "@/lib/org/org-formations";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsGererPage() {
  const session = await getSession();
  const jade = isJadeDemoEmail(session?.email);
  const { orgId } = jade
    ? { orgId: "jade-org" }
    : await requireEntrepriseOrgId("/dashboard/entreprise/formations/gerer");
  const [courses, learners] = jade
    ? [JADE_ORG_COURSES, JADE_ORG_LEARNERS]
    : await Promise.all([listOrgCourses(orgId), listOrgLearners(orgId)]);

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[104px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Gérer mes formations"
          lead="Formations internes. Assignez-les aux collaborateurs de votre organisation."
          variant="dark"
          hideTabs
        >
          <OrgFormationsManageView
            courses={courses}
            learners={learners}
            orgId={orgId}
            basePath="/dashboard/entreprise/formations"
            variant="dark"
            assigneeLabel="collaborateur"
          />
        </OrgFormationsShell>
      </main>
    </div>
  );
}
