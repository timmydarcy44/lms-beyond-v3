"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import type { ExpertPole } from "@/lib/expert/pole-model";
import type { ExpertShopFormation } from "@/lib/expert/shop-formations";

export function ExpertDashboardClient({
  formations,
  pole,
  careOnly,
  appointments,
  revenue,
}: {
  formations: ExpertShopFormation[];
  pole: ExpertPole | null;
  careOnly?: boolean;
  appointments?: { thisMonth: number; upcoming: number };
  revenue?: {
    totalCents: number;
    paidCents: number;
    upcomingCents: number;
    bars: Array<{ month: string; value: number }>;
  };
}) {
  const { isApproved } = useExpertAccess();
  return (
    <ExpertCockpitDashboard
      restricted={!isApproved}
      formations={formations}
      pole={pole}
      careOnly={careOnly}
      appointments={appointments}
      revenue={revenue}
    />
  );
}
