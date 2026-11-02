import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { TestsPage } from "@/components/tests/tests-page";
import { HomeFooter } from "@/components/home/site-footer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getHomeContent } from "@/content/home";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { testsPage } from "@/lib/content/tests";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: testsPage.meta.title,
  description: testsPage.meta.description,
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/business/diagnostics` },
  openGraph: {
    title: testsPage.meta.title,
    description: testsPage.meta.description,
    url: `${BYOUND_PUBLIC_ORIGIN}/business/diagnostics`,
  },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const content = getHomeContent(routes, host);

  return (
    <EdgePremiumShell overlayNav showTopBar={false} showFooter={false}>
      <div className={manrope.className}>
        <TestsPage demoHref={routes.contact} takeHref="/soft-skills/test" />
        <HomeFooter columns={content.footer} legal={content.legal} />
      </div>
    </EdgePremiumShell>
  );
}
