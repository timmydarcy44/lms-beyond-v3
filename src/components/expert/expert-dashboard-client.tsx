"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import type { ExpertShopFormation } from "@/lib/expert/shop-formations";

export function ExpertDashboardClient({ formations }: { formations: ExpertShopFormation[] }) {
  const { isApproved } = useExpertAccess();
  return <ExpertCockpitDashboard restricted={!isApproved} formations={formations} />;
}
