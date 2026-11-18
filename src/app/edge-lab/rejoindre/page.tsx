import type { Metadata } from "next";
import { headers } from "next/headers";

import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { RejoindreChooserPage } from "@/components/edge-site/rejoindre-chooser-page";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

export const metadata: Metadata = {
  title: "Rejoindre Byound",
  description:
    "Choisissez votre porte d’entrée : école en alternance, compte entreprise, ou espace particulier.",
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/rejoindre` },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav showTopBar={false}>
      <RejoindreChooserPage routes={routes} />
    </EdgePremiumShell>
  );
}
