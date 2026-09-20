import Link from "next/link";
import { OrgFormationsManageView } from "@/components/org/org-formations-manage-view";
import { listOrgCourses, listOrgLearners } from "@/lib/org/org-formations";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

/** Catalogue digital EDGE Online (formations e-learning existantes). */
export default async function EcoleFormationsOnlinePage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/online");
  const [courses, learners] = await Promise.all([listOrgCourses(orgId), listOrgLearners(orgId)]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formations</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">EDGE Online</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Contenus numériques (e-learning, vidéos, parcours autonomes). Distincts des cursus présentiels.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/ecole/formations/gerer" className="font-semibold text-[#3D7BFF]">
            Gérer le catalogue
          </Link>
          <Link href="/dashboard/ecole/formations/creer" className="font-semibold text-slate-600">
            Créer une formation online
          </Link>
        </div>
      </header>

      <OrgFormationsManageView
        courses={courses}
        learners={learners}
        orgId={orgId}
        basePath="/dashboard/ecole/formations"
        variant="light"
      />
    </div>
  );
}
