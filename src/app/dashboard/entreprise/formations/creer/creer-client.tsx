"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";

function CreerInner({ orgId }: { orgId: string }) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || undefined;
  return (
    <FormateurFormationBuilderWhite
      initialCourseId={courseId}
      lockedOrgId={orgId}
      returnTo="/dashboard/entreprise/formations/gerer"
      embed
    />
  );
}

export function EntrepriseFormationsCreerClient({ orgId }: { orgId: string }) {
  return (
    <div className="flex min-h-screen bg-[#0b0a12] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <OrgFormationsShell
          basePath="/dashboard/entreprise/formations"
          title="Créer une formation"
          lead="Même workflow que le studio formateur. Accès limité aux salariés de votre organisation."
          variant="dark"
        >
          <div className="overflow-hidden rounded-2xl bg-white text-slate-950">
            <Suspense fallback={<p className="p-6 text-sm text-slate-500">Chargement du builder…</p>}>
              <CreerInner orgId={orgId} />
            </Suspense>
          </div>
        </OrgFormationsShell>
      </main>
    </div>
  );
}
