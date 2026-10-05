import { createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { EdgeExpertLandingPage } from "@/components/edge-site/experts/edge-expert-landing-page";

export const metadata = createMarketingPageMeta("formateursExperts");

export default function Page() {
  return (
    <EdgePremiumShell overlayNav>
      <EdgeExpertLandingPage />
    </EdgePremiumShell>
  );
}
