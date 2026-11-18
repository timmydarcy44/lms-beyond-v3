import type { Metadata } from "next";
import { headers } from "next/headers";

import { EcoleHubPage } from "@/components/edge-site/ecole/ecole-hub-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

export const metadata: Metadata = {
  title: "Byound School — École en alternance",
  description:
    "Bachelor en alternance Byound School : cursus AI Business, Business Sport, Real Estate. Candidature en ligne, accompagnement entreprise.",
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/ecole` },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <EcoleHubPage routes={routes} />
    </EdgePremiumShell>
  );
}
