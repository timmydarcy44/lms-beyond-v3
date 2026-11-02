import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { OpcoPage } from "@/components/financement-opco/opco-page";
import { HomeFooter } from "@/components/home/site-footer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getHomeContent } from "@/content/home";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { listPublishedFormations } from "@/lib/financement-opco-formations";
import { OPCO_META, validatedOpcoFaq } from "@/lib/financement-opco";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: OPCO_META.title,
  description: OPCO_META.description,
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/entreprises/financement-opco` },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const content = getHomeContent(routes, host);
  const formations = await listPublishedFormations();
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validatedOpcoFaq().map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <EdgePremiumShell overlayNav showTopBar={false} showFooter={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className={manrope.className}>
        <OpcoPage
          entreprisesHref={routes.entreprises}
          contactHref={routes.contact}
          privacyHref={content.legal.find((item) => item.label === "Confidentialité")?.href ?? routes.contact}
          formations={formations}
        />
        <HomeFooter columns={content.footer} legal={content.legal} />
      </div>
    </EdgePremiumShell>
  );
}
