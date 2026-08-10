import { Inter } from "next/font/google";
import { headers } from "next/headers";

import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { EdgePremiumTarifs } from "@/components/edge-site/premium/edge-premium-tarifs";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Tarifs — EDGE",
  description:
    "EDGE Skills, EDGE Learning et EDGE Learning+ : tarifs par collaborateur, facturation mensuelle ou annuelle.",
};

export default async function TarifsPage() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav={false} navChrome="light">
      <div className={cn(inter.className, "font-edge-sf antialiased")}>
        <EdgePremiumTarifs demoHref={routes.businessDemo} contactHref={routes.contact} />
      </div>
    </EdgePremiumShell>
  );
}
