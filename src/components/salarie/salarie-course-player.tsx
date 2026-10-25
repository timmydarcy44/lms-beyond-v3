import { notFound, redirect } from "next/navigation";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningSessionTracker, LessonLeafSessionTracker } from "@/components/learning-session-tracker";
import { getSession } from "@/lib/auth/session";
import { getEdgeOnlineCourseDetailBySlug } from "@/lib/queries/edge-online-course-detail";
import { listSalarieAssignedFormations } from "@/lib/salarie/assigned-formations";

export async function SalarieCoursePlayer({ slug, lessonId }: { slug: string; lessonId?: string }) {
  const key = decodeURIComponent(String(slug ?? "")).trim();
  const session = await getSession();
  if (!session?.id) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/salarie/formations/${key}`)}`);
  }

  const assigned = await listSalarieAssignedFormations(session.id, session.email);
  const allowed = assigned.some((item) => item.slug === key || item.id === key);
  if (!allowed) notFound();

  const data = await getEdgeOnlineCourseDetailBySlug(key);
  if (!data) notFound();

  const { card, detail } = data;
  const modules = detail.modules || [];
  const allLessons = modules.flatMap(
    (module: { lessons?: Array<{ id: string; title?: string; videoUrl?: string; flashcards?: unknown[] }> }) =>
      module.lessons ?? [],
  );
  const activeLesson = (lessonId ? allLessons.find((item) => item.id === lessonId) : allLessons[0]) ?? null;

  if (!activeLesson) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-[#F4F4F1] px-6 text-[#07080B]">
        <h1 className="text-3xl font-extrabold">{detail.title}</h1>
        <p className="mt-3 text-sm text-[#6B6F7A]">Cette formation n&apos;a pas encore de séquence.</p>
        <a
          href="/dashboard/salarie/formations"
          className="mt-6 inline-flex h-11 w-fit items-center rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white"
        >
          Retour aux formations
        </a>
      </div>
    );
  }

  const activeModule = modules.find((module: { lessons?: Array<{ id: string }> }) =>
    module.lessons?.some((item) => item.id === activeLesson.id),
  );
  const activeIndex = allLessons.findIndex((item) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const lessonBaseHref = `/dashboard/salarie/formations/${encodeURIComponent(card.slug || key)}`;

  return (
    <DyslexiaModeProvider>
      <LearningSessionTracker contentType="course" contentId={card.id} showIndicator={false}>
        <LessonLeafSessionTracker lessonId={String(activeLesson.id)}>
          <LessonPlayView
            detail={detail}
            modules={modules as never}
            activeLesson={activeLesson as never}
            activeModule={activeModule as never}
            videoSrc={activeLesson.videoUrl || detail.trailerUrl || undefined}
            cardHref={lessonBaseHref}
            flashcards={(activeLesson.flashcards ?? []) as never}
            previousLesson={previousLesson as never}
            nextLesson={nextLesson as never}
            courseId={card.id}
            courseTitle={card.title}
          />
        </LessonLeafSessionTracker>
      </LearningSessionTracker>
    </DyslexiaModeProvider>
  );
}
