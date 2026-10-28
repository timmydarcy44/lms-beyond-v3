import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("formationsBts");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="formationsBts" />;
}
