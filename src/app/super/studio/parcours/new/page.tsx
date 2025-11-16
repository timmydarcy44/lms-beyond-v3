import { redirect } from "next/navigation";

import { SuperAdminPathBuilderWorkspace } from "@/components/super-admin/path-builder-workspace-super-admin";
import { getSuperAdminOrganizationsList, getSuperAdminPathBuilderLibrary } from "@/lib/queries/super-admin";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminNewParcoursPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const [library, organizations] = await Promise.all([
    getSuperAdminPathBuilderLibrary(),
    getSuperAdminOrganizationsList(),
  ]);

  return (
    <div className="min-h-screen bg-[#050506]">
      <main className="mx-auto max-w-7xl px-6 py-12 text-white">
        <div className="mb-6">
          <h1
            className="mb-2 text-3xl font-semibold text-white"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Créer un nouveau parcours
          </h1>
          <p
            className="text-sm text-white/70"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Assemblez des formations, tests et ressources puis assignez le parcours à une organisation.
          </p>
        </div>

        <SuperAdminPathBuilderWorkspace
          library={library}
          organizations={organizations}
          initialData={{
            orgId: organizations[0]?.id ?? null,
          }}
        />
      </main>
    </div>
  );
}

