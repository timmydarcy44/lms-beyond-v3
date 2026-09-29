import { EdgePremiumAudienceDoors } from "@/components/edge-site/premium/edge-premium-audience-doors";
import { EdgePremiumBrandPillars } from "@/components/edge-site/premium/edge-premium-brand-pillars";
import { EdgePremiumCta } from "@/components/edge-site/premium/edge-premium-cta";
import { EdgePremiumDiagnosticsSection } from "@/components/edge-site/premium/edge-premium-diagnostics-section";
import { EdgePremiumExpertSection } from "@/components/edge-site/premium/edge-premium-expert-section";
import { EdgePremiumHero } from "@/components/edge-site/premium/edge-premium-hero";
import { EdgePremiumLogos } from "@/components/edge-site/premium/edge-premium-logos";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { EdgePremiumSkillJourney } from "@/components/edge-site/premium/edge-premium-skill-journey";
import { EdgePremiumStats } from "@/components/edge-site/premium/edge-premium-stats";
import { EdgePremiumVideo } from "@/components/edge-site/premium/edge-premium-video";

export function EdgePremiumHome() {
  return (
    <EdgePremiumShell overlayNav>
      <EdgePremiumHero />
      <EdgePremiumAudienceDoors />
      <EdgePremiumSkillJourney />
      <EdgePremiumBrandPillars />
      <EdgePremiumStats />
      <EdgePremiumVideo />
      <EdgePremiumDiagnosticsSection />
      <EdgePremiumLogos />
      <EdgePremiumExpertSection />
      <EdgePremiumCta />
    </EdgePremiumShell>
  );
}
