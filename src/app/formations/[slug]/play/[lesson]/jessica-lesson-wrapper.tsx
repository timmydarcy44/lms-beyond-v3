"use client";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import { FloatingDashboardCTA } from "@/components/apprenant/floating-dashboard-cta";
import type {
  LearnerDetail,
  LearnerFlashcard,
  LearnerLesson,
  LearnerModule,
} from "@/lib/queries/apprenant";

type LessonPlayViewProps = {
  detail: LearnerDetail;
  modules: LearnerModule[];
  activeLesson: LearnerLesson;
  activeModule?: LearnerModule;
  videoSrc?: string | null;
  cardHref: string;
  flashcards: LearnerFlashcard[];
  previousLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  courseId: string;
  courseTitle: string;
};

export function JessicaLessonPlayView(props: LessonPlayViewProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <LessonPlayView {...props} theme="jessica" />
      <FloatingDashboardCTA />
    </div>
  );
}
