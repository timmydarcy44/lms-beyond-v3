import { notFound } from "next/navigation";

import { JessicaLessonPlayView } from "./jessica-lesson-wrapper";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import {
  getLearnerContentDetail,
} from "@/lib/queries/apprenant";
import { getServerClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface FormationLessonPlayPageProps {
  params: Promise<{
    slug: string;
    lesson: string;
  }>;
}

export default async function FormationLessonPlayPage({ params }: FormationLessonPlayPageProps) {
  const { slug, lesson } = await params;

  // Récupérer les détails de la formation
  const data = await getLearnerContentDetail("formations", slug);
  if (!data) {
    notFound();
  }

  // Vérifier que c'est bien une formation de Jessica Contentin
  const supabase = await getServerClient();
  if (supabase) {
    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (jessicaProfile) {
      // Récupérer le course et vérifier le creator_id
      const { data: course } = await supabase
        .from("courses")
        .select("creator_id")
        .eq("id", slug)
        .maybeSingle();

      if (course && course.creator_id !== jessicaProfile.id) {
        notFound();
      }
    }
  }

  const { card, detail } = data;
  const modules = detail.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons ?? []);
  const activeLesson = allLessons.find((item) => item.id === lesson) ?? allLessons[0];

  if (!activeLesson) {
    console.warn("[formation/play] Lesson not found:", { lesson, availableLessons: allLessons.map(l => l.id) });
    notFound();
  }

  const activeModule = modules.find((module) => module.lessons?.some((item: { id: string }) => item.id === activeLesson.id));
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item: { id: string }) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const flashcards = activeLesson.flashcards ?? [];
  
  // Debug: Log des flashcards
  console.log("[formation/play] Active lesson flashcards:", JSON.stringify({
    lessonId: activeLesson.id,
    lessonTitle: activeLesson.title,
    flashcardsCount: flashcards.length,
    flashcards: flashcards.map(f => ({ id: f.id, front: f.front?.substring(0, 30) }))
  }));
  
  // Utiliser la route formations au lieu de catalog/formations
  const baseHref = `/formations/${slug}`;

  return (
    <DyslexiaModeProvider>
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <JessicaLessonPlayView
          detail={detail}
          modules={modules}
          activeLesson={activeLesson}
          activeModule={activeModule}
          videoSrc={videoSrc ?? null}
          cardHref={baseHref}
          flashcards={flashcards}
          previousLesson={
            previousLesson ? { id: previousLesson.id, title: previousLesson.title ?? "Chapitre précédent" } : undefined
          }
          nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title ?? "Chapitre suivant" } : undefined}
          courseId={card.id}
          courseTitle={card.title}
        />
      </div>
    </DyslexiaModeProvider>
  );
}

