import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import {
  buildPsgApprenantDemoBadges,
  buildPsgApprenantDemoParcours,
  isPsgDemoViewer,
} from "@/lib/entreprise/psg-demo-data";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_COURSES } from "@/lib/demo/jade-dashboard-mocks";
import { getSession } from "@/lib/auth/session";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantHomePage() {
  const session = await getSession();
  const jade = isJadeDemoEmail(session?.email);
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

  const primaryParcours = jade
    ? { title: JADE_COURSES[0].title, href: JADE_COURSES[0].href }
    : primary
      ? { title: String(primary.title ?? "Parcours"), href: String(primary.href ?? "") }
      : null;

  return (
    <ApprenantDashboardClient
      initialView="home"
      primaryParcours={primaryParcours?.href ? primaryParcours : null}
      courses={jade ? JADE_COURSES : undefined}
      visibleOpenBadges={visibleOpenBadges}
      earnedOpenBadges={earnedOpenBadges}
    />
  );
}
