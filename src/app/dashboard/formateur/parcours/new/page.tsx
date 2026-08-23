import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FormateurNewParcoursPage({
  searchParams,
}: {
  searchParams?: Promise<{ lockedOrgId?: string; returnTo?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const lockedOrgId = typeof sp.lockedOrgId === "string" ? sp.lockedOrgId.trim() : null;

  const [library, organizations] = await Promise.all([
    getFormateurContentLibrary().catch(() => ({
      courses: [],
      tests: [],
      resources: [],
    })),
    getFormateurOrganizations().catch(() => []),
  ]);

  let orgs = organizations;
  if (lockedOrgId && !orgs.some((o) => o.id === lockedOrgId)) {
    let orgName = "Mon organisation";
    try {
      const db = await getServiceRoleClientOrFallback();
      if (db) {
        const { data } = await db.from("organizations").select("name").eq("id", lockedOrgId).maybeSingle();
        orgName = String((data as { name?: string } | null)?.name ?? "").trim() || orgName;
      }
    } catch {
      /* ignore */
    }
    orgs = [...orgs, { id: lockedOrgId, name: orgName }];
  }

  return (
    <FormateurPathBuilderWorkspace
      library={library}
      organizations={orgs}
      lockedOrgId={lockedOrgId}
    />
  );
}
