import { notFound } from "next/navigation";

import { InterviewPlayClient } from "@/components/apprenant/interview-play-client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import {
  buildInterviewRevisionOutline,
  resolveInterviewParentChapterTitle,
} from "@/lib/apprenant/interview-revision-outline";

type FormationInterviewPlayPageProps = {
  category: string;
  slug: string;
  lessonId: string;
};

function resolveInterviewContext(lesson: Record<string, unknown>, modules: { lessons?: unknown[] }[]) {
  const direct = String(lesson.interview_context ?? "").trim();
  if (direct.length >= 40) return direct;

  const parentId = String(lesson.parentChapterId ?? "");
  const parts: string[] = [];
  for (const mod of modules) {
    for (const raw of mod.lessons ?? []) {
      const L = raw as Record<string, unknown>;
      if (parentId && String(L.parentChapterId ?? "") !== parentId) continue;
      if (L.id === lesson.id) continue;
      if (L.kind === "quiz" || L.kind === "experiential_interview") continue;
      const text = String(L.description ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) parts.push(text);
    }
  }
  return parts.join("\n\n").trim().slice(0, 14_000);
}

export async function FormationInterviewPlayPage({
  category,
  slug,
  lessonId,
}: FormationInterviewPlayPageProps) {
  const data = await getLearnerContentDetail(category, slug);
  if (!data) notFound();

  const { card, detail } = data;
  const modules = detail.modules || [];
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const activeLesson = allLessons.find((item) => item.id === lessonId);
  if (!activeLesson) notFound();

  const kind = String((activeLesson as { kind?: string }).kind ?? "");
  const isInterview =
    kind === "experiential_interview" ||
    /entretien\s+expérientiel/i.test(activeLesson.title || "");

  if (!isInterview) notFound();

  const contextText = resolveInterviewContext(activeLesson as Record<string, unknown>, modules);
  const returnHref = `${card.href}/play/${lessonId}`;
  const displayChapterTitle = resolveInterviewParentChapterTitle(allLessons, activeLesson);
  const revisionItems = buildInterviewRevisionOutline(modules, activeLesson, `${card.href}/play`);

  return (
    <DyslexiaModeProvider>
      <div className="min-h-screen bg-white text-slate-900">
        <DashboardShell
          title="Entretien expérientiel"
          breadcrumbs={[{ label: activeLesson.title }]}
          initialCollapsed={true}
          forcedTheme="light"
          className="bg-white text-slate-900"
        >
          <InterviewPlayClient
            contextText={contextText}
            chapterTitle={displayChapterTitle}
            courseTitle={card.title}
            lessonId={activeLesson.id}
            returnHref={returnHref}
            revisionItems={revisionItems}
          />
        </DashboardShell>
      </div>
    </DyslexiaModeProvider>
  );
}
