import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const metadata = createMarketingPageMeta("webinaires");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="webinaires" />;
}
