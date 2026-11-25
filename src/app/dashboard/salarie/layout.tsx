import type { ReactNode } from "react";
import { LearnerPreviewBanner } from "@/components/control/learner-preview-banner";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { SalarieConnectShell } from "@/components/salarie/salarie-connect-shell";
import { readLearnerPreviewContext } from "@/lib/control/learner-preview";

export default async function SalarieLayout({ children }: { children: ReactNode }) {
  const preview = await readLearnerPreviewContext();
  const previewName =
    preview && !preview.expired ? preview.targetName : null;

  return (
    <SalarieConnectShell>
      {previewName ? (
        <LearnerPreviewBanner
          targetName={previewName}
          returnHref="/dashboard/entreprise/salaries"
          sessionLabel="Votre session RH / Control ne change pas — aucune action n’est enregistrée."
        />
      ) : null}
      <JadeInternalFill>{children}</JadeInternalFill>
    </SalarieConnectShell>
  );
}
