import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { OpenBadgesBusinessPage, type OpenBadgeExpert } from "@/components/open-badges-business/open-badges-page";
import { HomeFooter } from "@/components/home/site-footer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getHomeContent } from "@/content/home";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { openBadgesBusiness } from "@/lib/content/open-badges-business";
import { getNtcBusinessSportContributors } from "@/lib/expert/program-contributors";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: openBadgesBusiness.meta.title,
  description: openBadgesBusiness.meta.description,
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/business/open-badges` },
  openGraph: {
    title: openBadgesBusiness.meta.title,
    description: openBadgesBusiness.meta.description,
    url: `${BYOUND_PUBLIC_ORIGIN}/business/open-badges`,
  },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const content = getHomeContent(routes, host);
  const experts: OpenBadgeExpert[] = openBadgesBusiness.showExperts
    ? (await getNtcBusinessSportContributors()).map((person) => ({
        id: person.id,
        name: person.name,
        jobTitle: person.jobTitle.replace(" at ", " · "),
        photoUrl: person.photoUrl,
      }))
    : [];

  return (
    <EdgePremiumShell overlayNav showTopBar={false} showFooter={false}>
      <div className={manrope.className}>
        <OpenBadgesBusinessPage
          experts={experts}
          demoHref={routes.contact}
          advisorHref={routes.contact}
          expertsHref={routes.formateursExperts}
        />
        <HomeFooter columns={content.footer} legal={content.legal} />
      </div>
    </EdgePremiumShell>
  );
}
