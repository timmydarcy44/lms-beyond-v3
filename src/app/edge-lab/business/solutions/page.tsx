import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("businessSolutions");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="businessSolutions" />;
}
