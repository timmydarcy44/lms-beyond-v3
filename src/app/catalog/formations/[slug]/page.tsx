import { notFound } from "next/navigation";
import {
  getLearnerContentDetail,
  type LearnerCategory,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { FormationDetailView, type Episode } from "./view";
import { edgeOnlinePublicHref, type EdgeOnlineHrefPrefix } from "@/lib/edge-online-public-path";

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
  return await renderFormationDetailPage({ slug, orgSlug: null });
}

export async function renderFormationDetailPage(args: {
  slug: string;
  orgSlug: string | null;
  /** Présent sur `/edgeonline/formations/*` : fil d’Ariane + cartes connexes avec chemins canoniques `/formations`. */
  edgeOnlineHrefPrefix?: EdgeOnlineHrefPrefix;
}) {
  const { slug, orgSlug, edgeOnlineHrefPrefix } = args;
  const category: LearnerCategory = "formations";

  const detail = await getLearnerContentDetail(category, slug);
  if (!detail) {
    notFound();
  }

  const { card: rawCard, detail: info, related = [] } = detail;
  const formationBaseHref =
    edgeOnlineHrefPrefix !== undefined
      ? edgeOnlinePublicHref(`/formations/${encodeURIComponent(slug)}`, edgeOnlineHrefPrefix)
      : rawCard.href;
  const card = { ...rawCard, href: formationBaseHref };
  const lessons = info.modules.flatMap((module) => module.lessons ?? []);
  const firstLesson = lessons[0];
  const playHref = firstLesson ? `${formationBaseHref}/play/${firstLesson.id}` : formationBaseHref;

  const formationsIndexHref =
    edgeOnlineHrefPrefix !== undefined ? edgeOnlinePublicHref("/", edgeOnlineHrefPrefix) : null;

  const breadcrumbs = formationsIndexHref
    ? [
        { label: "Formations", href: formationsIndexHref },
        { label: CATEGORY_LABEL[category] },
        { label: info.title },
      ]
    : orgSlug
      ? [
          { label: "Dashboard", href: `/g/${encodeURIComponent(orgSlug)}/dashboard/student/learning/formations` },
          { label: CATEGORY_LABEL[category] },
          { label: info.title },
        ]
      : [
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: CATEGORY_LABEL[category] },
        { label: info.title },
      ];

  const relatedForSlider =
    edgeOnlineHrefPrefix !== undefined && related.length > 0
      ? related.map((rc) => {
          const rs = String(rc.slug ?? rc.id ?? "").trim();
          if (!rs) return rc;
          return {
            ...rc,
            href: edgeOnlinePublicHref(`/formations/${encodeURIComponent(rs)}`, edgeOnlineHrefPrefix),
          };
        })
      : related;

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
        videoUrl: lesson.videoUrl ?? lesson.mediaUrl ?? undefined,
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
      <div className="m-0 ml-0 min-h-screen w-full max-w-none bg-black p-0 pl-0 text-white">
        <DashboardShell
          title={info.title}
          breadcrumbs={breadcrumbs}
          forcedTheme="dark"
          className="bg-black text-white"
          hideSidebar
          mainClassName="!m-0 !ml-0 !mt-0 !p-0 !px-0 !pl-0 !pt-0 w-full max-w-none"
        >
          <FormationDetailView
            card={card}
            info={info}
            related={relatedForSlider}
            playHref={playHref}
            episodes={episodes}
            breadcrumbs={breadcrumbs}
            orgSlug={orgSlug}
          />
          {relatedForSlider.length > 0 && (
            <SectionSlider
              title="Vous aimerez aussi"
              cards={relatedForSlider.map((card) => ({
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


