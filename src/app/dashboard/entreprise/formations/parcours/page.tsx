import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsParcoursPage() {
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/parcours");
  const [library, organizations] = await Promise.all([
    getFormateurContentLibrary().catch(() => null),
    getFormateurOrganizations().catch(() => []),
  ]);

  let orgName = "Mon organisation";
  try {
    const db = await getServiceRoleClientOrFallback();
    if (db) {
      const { data } = await db.from("organizations").select("name").eq("id", orgId).maybeSingle();
      orgName = String((data as { name?: string } | null)?.name ?? "").trim() || orgName;
    }
  } catch {
    /* ignore */
  }

  const orgs =
    organizations.some((o) => o.id === orgId)
      ? organizations
      : [...organizations, { id: orgId, name: orgName }];

  const lib =
    library ??
    ({
      courses: [],
      tests: [],
      resources: [],
      modules: [],
    } as never);

  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Créer un parcours"
          lead="Même workflow que le studio formateur, verrouillé sur votre organisation."
          variant="dark"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-950">
            <FormateurPathBuilderWorkspace library={lib} organizations={orgs} lockedOrgId={orgId} />
          </div>
        </OrgFormationsShell>
      </main>
    </div>
  );
}
