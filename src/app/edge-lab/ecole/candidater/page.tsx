import type { Metadata } from "next";
import { Suspense } from "react";

import { CfaApplicationFlow } from "@/components/edge-site/cfa/cfa-application-flow";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";

export const metadata: Metadata = {
  title: "Candidater — Byound School",
  description:
    "Créez votre profil, passez le Byound Challenge et rejoignez la prochaine promotion Byound School.",
};

export default function CfaApplyPage() {
  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <Suspense fallback={<div className="min-h-screen bg-[#070b1f]" />}>
        <CfaApplicationFlow />
      </Suspense>
    </EdgePremiumShell>
  );
}
