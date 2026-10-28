import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("blog");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="blog" />;
}
