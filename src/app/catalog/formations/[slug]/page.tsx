import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getLearnerContentDetail,
  type LearnerCategory,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { FormationStudio } from "./formation-studio";
import type { Episode } from "./view";
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

  const { card: rawCard, detail: info } = detail;
  const formationBaseHref =
    edgeOnlineHrefPrefix !== undefined
      ? edgeOnlinePublicHref(`/formations/${encodeURIComponent(slug)}`, edgeOnlineHrefPrefix)
      : rawCard.href;
  const card = { ...rawCard, href: formationBaseHref };

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
          <DyslexiaModeProvider>
          <Suspense fallback={null}>
          <FormationStudio
            courseId={card.id}
            code={/^[a-z0-9]{2,10}$/i.test(slug.split("-")[0] ?? "") ? (slug.split("-")[0] ?? "").toUpperCase() : (slug.split("-")[0] ?? "Formation").toUpperCase()}
            title={info.title}
            description={String((info as { presentation?: string; description?: string }).presentation || (info as { description?: string }).description || "")}
            cover={info.backgroundImage || null}
            playBase={card.href}
            backHref={breadcrumbs.find((crumb) => crumb.href)?.href ?? "/dashboard/apprenant"}
            snapshot={((info as { builder_snapshot?: CourseBuilderSnapshot | null }).builder_snapshot ?? null) as CourseBuilderSnapshot | null}
            skills={Array.isArray((info as { skills?: string[] }).skills) ? (info as { skills?: string[] }).skills ?? [] : []}
            episodes={episodes}
          />
          </Suspense>
          </DyslexiaModeProvider>
        </DashboardShell>
      </div>
    </LearningSessionTracker>
  );
}


