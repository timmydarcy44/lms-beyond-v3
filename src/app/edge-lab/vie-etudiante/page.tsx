import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("vieEtudiante");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="vieEtudiante" />;
}
