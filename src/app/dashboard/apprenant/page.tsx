import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import {
  buildPsgApprenantDemoBadges,
  buildPsgApprenantDemoParcours,
  isPsgDemoViewer,
} from "@/lib/entreprise/psg-demo-data";
import { JadeDemoHome } from "@/components/demo/jade-demo-home";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantHomePage() {
  const session = await getSession();
  if (isJadeDemoEmail(session?.email)) {
    return <JadeDemoHome space="apprenant" />;
  }
  const data = await getApprenantDashboardData();
  const email = session?.email ?? null;
  const isPsgApprenant =
    isPsgDemoViewer(email) && String(email ?? "").toLowerCase().includes("demoapprenant@psg.fr");

  let visibleOpenBadges = data.visibleOpenBadges ?? [];
  let earnedOpenBadges = data.earnedOpenBadges ?? [];
  let primary = data.parcours?.[0];

  if (isPsgApprenant) {
    const demo = buildPsgApprenantDemoBadges();
    if (earnedOpenBadges.length === 0) earnedOpenBadges = demo.earnedOpenBadges;
    if (visibleOpenBadges.length === 0) visibleOpenBadges = demo.visibleOpenBadges;
    if (!primary) {
      const parcours = buildPsgApprenantDemoParcours();
      primary = { title: parcours.title, href: parcours.href };
    }
  }

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
