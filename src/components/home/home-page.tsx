import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";
import { HomeExperts } from "@/components/home/experts";
import { HomeFigures } from "@/components/home/figures";
import { HomeFinalCta } from "@/components/home/final-cta";
import { HomeFooter } from "@/components/home/site-footer";
import { HomeHero } from "@/components/home/hero";
import { HomeMethod } from "@/components/home/method";
import { HomeSocialProof } from "@/components/home/social-proof";
import { HomeTests } from "@/components/home/tests";
import { HomeTrainers } from "@/components/home/trainers";
import { HomeUniverses } from "@/components/home/universes";
import { getNtcBusinessSportContributors, type HomepageExpert } from "@/lib/expert/program-contributors";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { getHomeContent } from "@/content/home";
import "./home.css";

const manrope = Manrope({
  subsets: ["latin"],
});

export async function HomePage() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const [content, contributors] = await Promise.all([
    Promise.resolve(getHomeContent(routes, host)),
    getNtcBusinessSportContributors(),
  ]);
  const experts: HomepageExpert[] = contributors.flatMap((person) => {
    if (!person.photoUrl) return [];
    return [{
      id: person.id,
      name: person.name,
      jobTitle: person.jobTitle.replace(" at ", " · "),
      photoUrl: person.photoUrl,
      filiere: "Sport Business",
      order: null,
    }];
  });

  return (
    <div className={`${manrope.className} byound-home`}>
      <HomeHero
        schoolHref={content.hero.school}
        businessHref={content.hero.business}
        imageSrc={EDGE_HERO_IMAGE_URL}
      />
      <HomeSocialProof />
      <HomeUniverses
        more={content.moreFormations}
        schoolHref={content.schoolHref}
        businessHref={content.businessHref}
      />
      <HomeTests items={content.tests} testsHref={content.testsHref} demoHref={content.demoHref} />
      <HomeMethod />
      <HomeExperts people={experts} sportHref={content.sportExpertsHref} allHref={content.allExpertsHref} />
      <HomeFigures />
      <HomeTrainers href={content.trainerHref} />
      <HomeFinalCta contactHref={content.contactHref} demoHref={content.demoHref} />
      <HomeFooter columns={content.footer} legal={content.legal} />
    </div>
  );
}
