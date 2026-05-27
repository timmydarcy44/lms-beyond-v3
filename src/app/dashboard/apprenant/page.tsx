import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantHomePage() {
  const data = await getApprenantDashboardData();
  const visibleOpenBadges = data.visibleOpenBadges ?? [];
  const earnedOpenBadges = data.earnedOpenBadges ?? [];
  const primary = data.parcours?.[0];
  const primaryParcours = primary
    ? { title: String(primary.title ?? "Parcours"), href: String(primary.href ?? "") }
    : null;

  return (
    <ApprenantDashboardClient
      initialView="home"
      primaryParcours={primaryParcours?.href ? primaryParcours : null}
      visibleOpenBadges={visibleOpenBadges}
      earnedOpenBadges={earnedOpenBadges}
    />
  );
}
