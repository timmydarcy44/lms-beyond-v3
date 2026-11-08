import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OrgFormationCards } from "@/components/org/org-formation-cards";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_ORG_COURSES, JADE_ORG_LEARNERS } from "@/lib/demo/jade-dashboard-mocks";
import { listOrgLearners, listOrgLmsParcours } from "@/lib/org/org-formations";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsParcoursPage() {
  const session = await getSession();
  const jade = isJadeDemoEmail(session?.email);
  const { orgId } = jade
    ? { orgId: "jade-org" }
    : await requireEntrepriseOrgId("/dashboard/entreprise/formations/parcours");
  const [courses, learners] = jade
    ? [JADE_ORG_COURSES.map((c) => ({ ...c, source: "lms_grant" as const })), JADE_ORG_LEARNERS]
    : await Promise.all([listOrgLmsParcours(orgId), listOrgLearners(orgId)]);

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Parcours LMS"
          lead="Formations mises à disposition par Byound pour votre organisation. Assignez-les à vos collaborateurs."
          variant="dark"
          hideTabs
        >
          <OrgFormationCards
            courses={courses}
            learners={learners}
            orgId={orgId}
            emptyTitle="Aucun parcours LMS"
            emptyDescription="Lorsqu’un conseiller Byound met une formation à disposition de votre compte, elle apparaît ici."
            badgeFor={() => "Byound LMS"}
          />
        </OrgFormationsShell>
      </main>
    </div>
  );
}
