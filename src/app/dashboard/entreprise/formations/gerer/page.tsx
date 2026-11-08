import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgFormationCards } from "@/components/org/org-formation-cards";
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
  const [allCourses, learners] = jade
    ? [JADE_ORG_COURSES, JADE_ORG_LEARNERS]
    : await Promise.all([listOrgCourses(orgId), listOrgLearners(orgId)]);
  const courses = allCourses.filter((c) => c.source !== "lms_grant");

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Gérer mes formations"
          lead="Formations créées par votre organisation. Assignez-les aux collaborateurs."
          variant="dark"
          hideTabs
        >
          <OrgFormationCards
            courses={courses}
            learners={learners}
            orgId={orgId}
            emptyTitle="Aucune formation organisationnelle"
            emptyDescription="Créez une formation pour la rendre accessible uniquement aux membres de votre organisation."
            badgeFor={() => "Interne"}
          />
        </OrgFormationsShell>
      </main>
    </div>
  );
}
