"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";
import { OrgFormationsShell } from "@/components/org/org-formations-shell";

function EcoleCreerInner({ orgId }: { orgId: string }) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || undefined;
  return (
    <FormateurFormationBuilderWhite
      initialCourseId={courseId}
      lockedOrgId={orgId}
      returnTo="/dashboard/ecole/formations/gerer"
      embed
    />
  );
}

export function EcoleFormationsCreerClient({ orgId }: { orgId: string }) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <OrgFormationsShell
        basePath="/dashboard/ecole/formations"
        title="Créer une formation"
        lead="Même workflow que le studio formateur. La formation sera accessible uniquement aux membres de votre organisation."
        variant="light"
      >
        <Suspense fallback={<p className="text-sm text-black/50">Chargement du builder…</p>}>
          <EcoleCreerInner orgId={orgId} />
        </Suspense>
      </OrgFormationsShell>
    </div>
  );
}
