import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsParcoursPage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/parcours");
  const [library, organizations] = await Promise.all([
    getFormateurContentLibrary().catch(() => ({
      courses: [],
      tests: [],
      resources: [],
    })),
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

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <OrgFormationsShell
        basePath="/dashboard/ecole/formations"
        title="Créer un parcours"
        lead="Même workflow que le studio formateur, verrouillé sur votre organisation."
        variant="light"
      >
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <FormateurPathBuilderWorkspace library={library} organizations={orgs} lockedOrgId={orgId} />
        </div>
      </OrgFormationsShell>
    </div>
  );
}
