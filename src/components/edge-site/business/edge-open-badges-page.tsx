import { headers } from "next/headers";

import { EdgeOpenBadgesHero } from "@/components/edge-site/business/edge-open-badges-hero";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

export async function EdgeOpenBadgesPage() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeOpenBadgesHero />
      <section className="bg-edge-black-deep px-5 pb-20 pt-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={routes.businessDemo} showArrow shape="revolut">
              Demander une démo
            </EdgePremiumButton>
            <EdgePremiumButton href={routes.contact} variant="secondary-dark" shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </EdgePremiumShell>
  );
}
