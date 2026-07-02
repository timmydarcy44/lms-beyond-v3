import { EdgePremiumAudience } from "@/components/edge-site/premium/edge-premium-audience";
import { EdgePremiumCta } from "@/components/edge-site/premium/edge-premium-cta";
import { EdgePremiumEngagements } from "@/components/edge-site/premium/edge-premium-engagements";
import { EdgePremiumExpertSection } from "@/components/edge-site/premium/edge-premium-expert-section";
import { EdgePremiumHero } from "@/components/edge-site/premium/edge-premium-hero";
import { EdgePremiumLogos } from "@/components/edge-site/premium/edge-premium-logos";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { EdgePremiumStats } from "@/components/edge-site/premium/edge-premium-stats";
import { EdgePremiumVideo } from "@/components/edge-site/premium/edge-premium-video";

export function EdgePremiumHome() {
  return (
    <EdgePremiumShell overlayNav>
      <EdgePremiumHero />
      <EdgePremiumStats />
      <EdgePremiumVideo />
      <EdgePremiumEngagements />
      <EdgePremiumAudience />
      <EdgePremiumLogos />
      <EdgePremiumExpertSection />
      <EdgePremiumCta />
    </EdgePremiumShell>
  );
}
