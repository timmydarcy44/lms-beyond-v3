import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const metadata = createMarketingPageMeta("formateursExperts");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="formateursExperts" />;
}
