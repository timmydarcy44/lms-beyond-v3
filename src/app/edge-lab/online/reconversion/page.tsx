import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("lifeReconversion");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="lifeReconversion" />;
}
