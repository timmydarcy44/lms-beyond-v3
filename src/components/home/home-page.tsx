import fs from "node:fs";
import path from "node:path";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";
import { HomeDiagnostics } from "@/components/home/diagnostics";
import { HomeFigures } from "@/components/home/figures";
import { HomeFinalCta } from "@/components/home/final-cta";
import { HomeFooter } from "@/components/home/site-footer";
import { HomeHero } from "@/components/home/hero";
import { HomeMethod } from "@/components/home/method";
import { HomeSocialProof } from "@/components/home/social-proof";
import { HomeTrainers } from "@/components/home/trainers";
import { HomeUniverses } from "@/components/home/universes";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { getHomeContent } from "@/content/home";
import "./home.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function HomePage() {
  const host = (await headers()).get("host");
  const content = getHomeContent(getEdgeMarketingRoutes(host), host);
  const localHero = path.join(process.cwd(), "public", "images", "hero-byound.jpg");
  const heroSrc = fs.existsSync(localHero) ? "/images/hero-byound.jpg" : EDGE_HERO_IMAGE_URL;

  return (
    <div className={`${manrope.className} byound-home`}>
      <HomeHero schoolHref={content.hero.school} businessHref={content.hero.business} imageSrc={heroSrc} />
      <HomeSocialProof />
      <HomeUniverses
        formations={content.formations}
        more={content.moreFormations}
        schoolHref={content.schoolHref}
        businessHref={content.businessHref}
      />
      <HomeDiagnostics
        items={content.diagnostics}
        diagnosticsHref={content.diagnosticsHref}
        demoHref={content.demoHref}
      />
      <HomeMethod />
      <HomeFigures />
      <HomeTrainers href={content.trainerHref} />
      <HomeFinalCta contactHref={content.contactHref} demoHref={content.demoHref} />
      <HomeFooter columns={content.footer} legal={content.legal} />
    </div>
  );
}
