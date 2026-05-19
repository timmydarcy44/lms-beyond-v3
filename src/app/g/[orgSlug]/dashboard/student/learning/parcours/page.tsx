import { getApprenantDashboardData, getLearnerPathDetail } from "@/lib/queries/apprenant";
import { orderParcoursWithFeaturedFirst } from "@/lib/learner/parcours-featured-order";
import {
  LearnerParcoursPageImpl,
  type FeaturedParcoursHero,
} from "@/app/dashboard/student/learning/parcours/learner-parcours-page-impl";

export default async function GalaxyLearnerParcoursPage(props: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await props.params;
  const data = await getApprenantDashboardData(orgSlug);
  const parcours = orderParcoursWithFeaturedFirst(data.parcours ?? []);
  const featured = parcours[0];
  let featuredHero: FeaturedParcoursHero | null = null;
  if (featured?.id) {
    const detail = await getLearnerPathDetail(featured.id);
    if (detail) {
      const coverUrl = detail.cover_image || featured.image || null;
      const coverStr = typeof coverUrl === "string" ? coverUrl.trim() : "";
      const coverIsVideo =
        coverStr.toLowerCase().endsWith(".mp4") ||
        coverStr.toLowerCase().endsWith(".webm") ||
        coverStr.startsWith("data:video/");
      featuredHero = {
        pathId: featured.id,
        title: detail.title || featured.title,
        resumeHref: featured.href,
        coverUrl: coverStr || null,
        coverIsVideo,
        presentation: detail.presentation,
        objectifs: detail.objectifs,
        tools: detail.tools,
        formationCount: detail.courses.length,
        testCount: detail.tests.length,
        resourceCount: detail.resources.length,
      };
    }
  }

  return <LearnerParcoursPageImpl data={{ ...data, parcours }} orgSlug={orgSlug} featuredHero={featuredHero} />;
}

