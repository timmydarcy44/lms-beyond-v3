import { notFound } from "next/navigation";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getLearnerContentDetail,
  isLearnerCategory,
  type LearnerCategory,
} from "@/lib/queries/apprenant";

const CATEGORY_LABEL: Record<LearnerCategory, string> = {
  formations: "Formation",
  parcours: "Parcours",
  ressources: "Ressource",
  tests: "Test",
};

interface LearnerPlayPageProps {
  params: Promise<{
    category: string;
    slug: string;
    lesson: string;
  }>;
}

export default async function LearnerPlayPage({ params }: LearnerPlayPageProps) {
  const { category: rawCategory, slug, lesson } = await params;

  if (!isLearnerCategory(rawCategory)) {
    notFound();
  }
  const category = rawCategory as LearnerCategory;

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
  // Utiliser videoUrl du lesson si disponible, sinon trailerUrl du detail
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item: { id: string }) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const flashcards = activeLesson.flashcards ?? [];

  // Breadcrumbs simplifiés (juste le nom du chapitre)
  const breadcrumbs = [
    { label: activeLesson.title },
  ];

  return (
    <DyslexiaModeProvider>
      <DashboardShell
        title={activeLesson.title}
        subtitle={activeModule ? `${activeModule.title} • ${activeLesson.duration}` : undefined}
        breadcrumbs={breadcrumbs}
        initialCollapsed
        compactHeader
      >
        <LessonPlayView
          detail={detail}
          modules={modules}
          activeLesson={activeLesson}
          activeModule={activeModule}
          videoSrc={videoSrc ?? null}
          cardHref={card.href}
          flashcards={flashcards}
          previousLesson={
            previousLesson ? { id: previousLesson.id, title: previousLesson.title ?? "Chapitre précédent" } : undefined
          }
          nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title ?? "Chapitre suivant" } : undefined}
          courseId={card.id}
          courseTitle={card.title}
        />
      </DashboardShell>
    </DyslexiaModeProvider>
  );
}

