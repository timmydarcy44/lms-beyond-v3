import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const generateMetadata = () => createMarketingPageMeta("admissions");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="admissions" />;
}
