import { notFound } from "next/navigation";
import {
  getLearnerContentDetail,
  isLearnerCategory,
  type LearnerCategory,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { FormationDetailView, type Episode } from "./view";

const CATEGORY_LABEL: Record<LearnerCategory, string> = {
  formations: "Formation",
  parcours: "Parcours",
  ressources: "Ressource",
  tests: "Test",
};

/**
 * Page spécifique pour les formations
 * Réutilise la même logique que /catalog/[category]/[slug]
 */
export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category: LearnerCategory = "formations";

  const detail = await getLearnerContentDetail(category, slug);
  if (!detail) {
    notFound();
  }

  const { card, detail: info, related = [] } = detail;
  const lessons = info.modules.flatMap((module) => module.lessons ?? []);
  const firstLesson = lessons[0];
  const playHref = firstLesson ? `${card.href}/play/${firstLesson.id}` : card.href;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard/apprenant" },
    { label: CATEGORY_LABEL[category] },
    { label: info.title },
  ];

  const contentType = "course";

  const getSequenceFallbackImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    ];
    return images[index % images.length];
  };

  const episodes: Episode[] = [];
  let episodeIndex = 1;
  info.modules.forEach((module: any) => {
    (module.lessons ?? []).forEach((lesson: any) => {
      const resolvedImage =
        lesson.imageUrl
        ?? module.imageUrl
        ?? lesson.thumbnailUrl
        ?? info.backgroundImage
        ?? getSequenceFallbackImage(episodeIndex - 1);
      episodes.push({
        id: lesson.id,
        index: episodeIndex,
        title: lesson.title,
        description: lesson.summary ?? lesson.description ?? undefined,
        imageUrl: resolvedImage,
        href: `${card.href}/play/${lesson.id}`,
        progress: lesson.progress ?? module.progress ?? null,
        durationLabel: typeof lesson.durationLabel === "string" ? lesson.durationLabel : null,
        locked: Boolean(lesson.locked ?? lesson.isLocked),
      });
      episodeIndex += 1;
    });
  });

  return (
    <LearningSessionTracker contentType={contentType} contentId={card.id}>
      <div className="min-h-screen bg-black text-white">
        <DashboardShell
          title={info.title}
          breadcrumbs={breadcrumbs}
          forcedTheme="dark"
          className="bg-black text-white"
        >
          <FormationDetailView
            card={card}
            info={info}
            related={related}
            playHref={playHref}
            episodes={episodes}
            breadcrumbs={breadcrumbs}
          />
          {related.length > 0 && (
            <SectionSlider
              title="Vous aimerez aussi"
              cards={related.map((card) => ({
                ...card,
                cta: card.cta ?? undefined,
                meta: card.meta ?? undefined,
                progress: card.progress ?? undefined,
              }))}
              accent="learner"
              theme="dark"
              variant="compact"
            />
          )}
        </DashboardShell>
      </div>
    </LearningSessionTracker>
  );
}


