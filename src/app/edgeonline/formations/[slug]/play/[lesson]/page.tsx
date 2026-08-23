import { notFound } from "next/navigation";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";
import { getEdgeOnlineCourseDetailBySlug } from "@/lib/queries/edge-online-course-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineFormationLessonPlayPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: rawSlug, lesson } = await params;
  const slug = decodeURIComponent(String(rawSlug ?? "")).trim();
  const prefix = await getEdgeOnlineHrefPrefixServer();

  const data = await getEdgeOnlineCourseDetailBySlug(slug);
  if (!data) notFound();

  const { card: rawCard, detail } = data;
  const formationBaseHref = edgeOnlinePublicHref(
    `/formations/${encodeURIComponent(slug)}`,
    prefix,
  );
  const card = { ...rawCard, href: formationBaseHref };
  const modules = detail.modules || [];
  const allLessons = modules.flatMap(
    (module: { lessons?: Array<{ id: string; title?: string; videoUrl?: string; flashcards?: unknown[] }> }) =>
      module.lessons ?? [],
  );
  const activeLesson =
    allLessons.find((item) => item.id === lesson) ?? allLessons[0];

  if (!activeLesson) notFound();

  const activeModule = modules.find((module: { lessons?: Array<{ id: string }> }) =>
    module.lessons?.some((item) => item.id === activeLesson.id),
  );
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  return (
    <DyslexiaModeProvider>
      <LearningSessionTracker contentType="course" contentId={card.id} showIndicator={false}>
        <div className="min-h-screen bg-white text-slate-900">
          <DashboardShell
            title={String(activeLesson.title ?? "")}
            breadcrumbs={[{ label: String(activeLesson.title ?? "") }]}
            initialCollapsed
            forcedTheme="light"
            className="bg-white text-slate-900"
          >
            <LessonPlayView
              detail={detail}
              modules={modules as never}
              activeLesson={activeLesson as never}
              activeModule={activeModule as never}
              videoSrc={videoSrc}
              cardHref={card.href}
              flashcards={(activeLesson.flashcards ?? []) as never}
              previousLesson={previousLesson as never}
              nextLesson={nextLesson as never}
              courseId={card.id}
              courseTitle={card.title}
            />
          </DashboardShell>
        </div>
      </LearningSessionTracker>
    </DyslexiaModeProvider>
  );
}
