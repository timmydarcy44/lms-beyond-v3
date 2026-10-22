import { ExpertDashboardClient } from "@/components/expert/expert-dashboard-client";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { loadExpertShopFormations } from "@/lib/expert/shop-formations";

export const dynamic = "force-dynamic";

export default async function ExpertDashboardPage() {
  const [formations, poles] = await Promise.all([loadExpertShopFormations(), loadExpertPoleState()]);
  return <ExpertDashboardClient formations={formations} pole={poles.ready ? poles.pole : null} />;
}
