import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { FinancementPage } from "@/components/financement/financement-page";
import { HomeFooter } from "@/components/home/site-footer";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getHomeContent } from "@/content/home";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { FINANCEMENT_META, validatedFaq } from "@/lib/financement";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: FINANCEMENT_META.title,
  description: FINANCEMENT_META.description,
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/financer-ma-formation` },
};

export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const content = getHomeContent(routes, host);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validatedFaq().map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <EdgePremiumShell overlayNav showTopBar={false} showFooter={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className={manrope.className}>
        <FinancementPage
          schoolHref={routes.alternance}
          contactHref={routes.contact}
          offresHref="/offres"
          entreprisesHref={routes.entreprises}
        />
        <HomeFooter columns={content.footer} legal={content.legal} />
      </div>
    </EdgePremiumShell>
  );
}
