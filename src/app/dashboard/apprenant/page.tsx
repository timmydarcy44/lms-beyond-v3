import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import { ApplicationGuide } from "@/components/offres/application-guide";
import { loadHomeApplication } from "@/lib/offres/application-home";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  buildPsgApprenantDemoBadges,
  buildPsgApprenantDemoParcours,
  isPsgDemoViewer,
} from "@/lib/entreprise/psg-demo-data";
import { getSession } from "@/lib/auth/session";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantHomePage() {
  const session = await getSession();
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

  const db = getServiceRoleClient();
  const application = session?.id && db ? await loadHomeApplication(db, session.id) : null;

  return (
    <>
    {application ? <ApplicationGuide application={application} /> : null}
    <ApprenantDashboardClient
      initialView="home"
      primaryParcours={primaryParcours?.href ? primaryParcours : null}
      visibleOpenBadges={visibleOpenBadges}
      earnedOpenBadges={earnedOpenBadges}
    />
    </>
  );
}
