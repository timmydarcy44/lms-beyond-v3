import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const metadata = createMarketingPageMeta("businessCasClients");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="businessCasClients" />;
}
