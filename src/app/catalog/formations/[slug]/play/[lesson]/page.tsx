import { notFound } from "next/navigation";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningSessionTracker } from "@/components/learning-session-tracker";

/**
 * Page de lecture d'une leçon spécifique dans une formation
 * Réutilise la même logique que /catalog/[category]/[slug]/play/[lesson]
 */
export default async function FormationLessonPlayPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson } = await params;
  const category = "formations" as const;

  const data = await getLearnerContentDetail(category, slug);
  if (!data) {
    notFound();
  }

  const { card, detail } = data;
  const modules = detail.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons ?? []);
  const activeLesson = allLessons.find((item) => item.id === lesson) ?? allLessons[0];

  if (!activeLesson) {
    console.warn("[learner] Lesson not found:", { lesson, availableLessons: allLessons.map(l => l.id) });
    notFound();
  }

  const activeModule = modules.find((module) => module.lessons?.some((item: { id: string }) => item.id === activeLesson.id));
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item: { id: string }) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const flashcards = activeLesson.flashcards ?? [];

  return (
    <DyslexiaModeProvider>
      <LearningSessionTracker contentType="course" contentId={card.id} showIndicator={false}>
        <LessonPlayView
          detail={detail}
          modules={modules}
          activeLesson={activeLesson}
          activeModule={activeModule}
          videoSrc={videoSrc}
          cardHref={card.href}
          flashcards={flashcards}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          courseId={card.id}
          courseTitle={card.title}
        />
      </LearningSessionTracker>
    </DyslexiaModeProvider>
  );
}

