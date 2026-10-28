import { EdgeMarketingPage } from "@/components/edge-site/marketing/edge-marketing-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import type { MarketingPageKey } from "@/lib/edge-site/marketing-content";
import {
  generateMarketingMetadata,
  marketingPathForKey,
  resolveMarketingContent,
  webpageJsonLd,
  loadSeoPage,
} from "@/lib/seo/byound-seo";

type Props = { contentKey: MarketingPageKey };

export function createMarketingPageMeta(key: MarketingPageKey) {
  return generateMarketingMetadata(key);
}

export async function EdgeMarketingRoutePage({ contentKey }: Props) {
  const content = await resolveMarketingContent(contentKey);
  const seo = await loadSeoPage(marketingPathForKey(contentKey));
  return (
    <EdgePremiumShell overlayNav={content.hero.tone !== "light"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd(seo)) }} />
      <EdgeMarketingPage content={content} />
    </EdgePremiumShell>
  );
}
