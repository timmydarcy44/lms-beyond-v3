import { ExpertDashboardClient } from "@/components/expert/expert-dashboard-client";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { loadExpertShopFormations } from "@/lib/expert/shop-formations";
import { monthKey, revenueForMonth, revenueLinesFromMissions } from "@/lib/expert/space-model";
import { loadExpertRevenueExtras, loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertDashboardPage() {
  const [formations, poles, space, extras] = await Promise.all([
    loadExpertShopFormations(),
    loadExpertPoleState(),
    loadExpertSpace(),
    loadExpertRevenueExtras(),
  ]);
  const lines = [...revenueLinesFromMissions(space.missions), ...extras];
  const now = new Date();
  const month = monthKey(now);
  const report = revenueForMonth(lines, month);
  const bars = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    const slice = revenueForMonth(lines, key);
    return {
      month: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      value: slice.totalCents / 100,
    };
  });
  return (
    <ExpertDashboardClient
      formations={formations}
      pole={poles.ready ? poles.pole : null}
      revenue={{
        totalCents: report.totalCents,
        paidCents: report.paidCents,
        upcomingCents: report.upcomingCents,
        bars,
      }}
    />
  );
}
