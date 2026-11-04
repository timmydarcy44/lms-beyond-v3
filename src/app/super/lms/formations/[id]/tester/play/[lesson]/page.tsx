import { notFound } from "next/navigation";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function FormationTesterLessonPage({
  params,
}: {
  params: Promise<{ id: string; lesson: string }>;
}) {
  const { id, lesson } = await params;
  const loaded = await getLearnerContentDetail("formations", id);
  if (!loaded) notFound();

  const { detail } = loaded;
  const modules = detail.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons ?? []);
  const activeLesson = allLessons.find((item) => item.id === lesson) ?? allLessons[0];
  if (!activeLesson) notFound();

  const activeModule = modules.find((module) => module.lessons?.some((item) => item.id === activeLesson.id));
  const activeIndex = allLessons.findIndex((item) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const base = `/super/lms/formations/${id}/tester`;

  return (
    <div className="learner-preview min-h-screen bg-black text-white">
      <DyslexiaModeProvider>
        <LessonPlayView
          preview
          detail={detail}
          modules={modules}
          activeLesson={activeLesson}
          activeModule={activeModule}
          videoSrc={activeLesson.videoUrl || detail.trailerUrl || undefined}
          cardHref={base}
          lessonBaseHref={base}
          flashcards={activeLesson.flashcards ?? []}
          previousLesson={previousLesson ? { id: previousLesson.id, title: previousLesson.title } : undefined}
          nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : undefined}
          courseId={loaded.card.id}
          courseTitle={loaded.card.title}
        />
      </DyslexiaModeProvider>
    </div>
  );
}
