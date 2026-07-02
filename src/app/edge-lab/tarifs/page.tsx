import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const metadata = createMarketingPageMeta("tarifs");

export default function TarifsPage() {
  return <EdgeMarketingRoutePage contentKey="tarifs" />;
}
