import { EdgeMarketingPage } from "@/components/edge-site/marketing/edge-marketing-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import {
  getMarketingContent,
  marketingMetadata,
  type MarketingPageKey,
} from "@/lib/edge-site/marketing-content";

type Props = { contentKey: MarketingPageKey };

export function createMarketingPageMeta(key: MarketingPageKey) {
  return marketingMetadata(getMarketingContent(key));
}

export function EdgeMarketingRoutePage({ contentKey }: Props) {
  const content = getMarketingContent(contentKey);
  return (
    <EdgePremiumShell overlayNav={content.hero.tone !== "light"}>
      <EdgeMarketingPage content={content} />
    </EdgePremiumShell>
  );
}
