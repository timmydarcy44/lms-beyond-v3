"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import type { ExpertPole } from "@/lib/expert/pole-model";
import type { ExpertShopFormation } from "@/lib/expert/shop-formations";

export function ExpertDashboardClient({
  formations,
  pole,
}: {
  formations: ExpertShopFormation[];
  pole: ExpertPole | null;
}) {
  const { isApproved } = useExpertAccess();
  return <ExpertCockpitDashboard restricted={!isApproved} formations={formations} pole={pole} />;
}
