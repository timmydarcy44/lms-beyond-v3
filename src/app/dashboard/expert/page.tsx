import { ExpertDashboardClient } from "@/components/expert/expert-dashboard-client";
import { loadExpertShopFormations } from "@/lib/expert/shop-formations";

export const dynamic = "force-dynamic";

export default async function ExpertDashboardPage() {
  const formations = await loadExpertShopFormations();
  return <ExpertDashboardClient formations={formations} />;
}
