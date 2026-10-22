"use client";

import { useState } from "react";
import { ListChecks, MessageCircle, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import type { CourseBuilderChapter } from "@/types/course-builder";
import { CreateInterviewModal } from "./create-interview-modal";
import { AddCourseResourceModal } from "./add-course-resource-modal";
import { requestQuizBuilder } from "./quiz-builder-bus";

type ChapterAssessmentActionsProps = {
  courseId?: string;
  sectionId: string;
  sectionTitle: string;
  chapter: CourseBuilderChapter;
  isLight: boolean;
  primaryGradient: string;
};

export function ChapterAssessmentActions({
  sectionTitle,
  chapter,
  isLight,
  primaryGradient,
}: ChapterAssessmentActionsProps) {
  const sections = useCourseBuilder((s) => s.snapshot.sections);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const usedResourceIds = sections.flatMap((section) =>
    section.chapters.flatMap((ch) =>
      ch.subchapters
        .filter((sub) => sub.kind === "resource" && sub.resource_id)
        .map((sub) => String(sub.resource_id)),
    ),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => requestQuizBuilder({ chapterId: chapter.id })}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em]",
            primaryGradient,
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Créer un quiz
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setInterviewModalOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em]",
            isLight
              ? "border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100"
              : "border-violet-400/40 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Créer un entretien
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setResourceModalOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em]",
            isLight
              ? "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100"
              : "border-teal-400/40 bg-teal-500/10 text-teal-100 hover:bg-teal-500/20",
          )}
        >
          <Library className="h-3.5 w-3.5" />
          Intégrer une ressource
        </Button>
      </div>

      <CreateInterviewModal
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
        chapter={chapter}
        sectionTitle={sectionTitle}
      />
      <AddCourseResourceModal
        open={resourceModalOpen}
        onOpenChange={setResourceModalOpen}
        usedResourceIds={usedResourceIds}
      />
    </>
  );
}
