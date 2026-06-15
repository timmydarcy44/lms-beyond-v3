"use client";

import { useState, useTransition } from "react";
import { ListChecks, MessageCircle, Loader2, Library } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import type { CourseBuilderChapter } from "@/types/course-builder";
import { buildChapterQuizPayload, extractChapterPlainText } from "@/lib/course-builder/chapter-content-text";
import { CreateInterviewModal } from "./create-interview-modal";
import { AddCourseResourceModal } from "./add-course-resource-modal";

type ChapterAssessmentActionsProps = {
  courseId?: string;
  sectionId: string;
  sectionTitle: string;
  chapter: CourseBuilderChapter;
  isLight: boolean;
  primaryGradient: string;
};

export function ChapterAssessmentActions({
  courseId,
  sectionId,
  sectionTitle,
  chapter,
  isLight,
  primaryGradient,
}: ChapterAssessmentActionsProps) {
  const appendSubchapterBlock = useCourseBuilder((s) => s.appendSubchapterBlock);
  const generalTitle = useCourseBuilder((s) => s.snapshot.general.title);
  const sections = useCourseBuilder((s) => s.snapshot.sections);
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"quiz" | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const usedResourceIds = sections.flatMap((section) =>
    section.chapters.flatMap((ch) =>
      ch.subchapters
        .filter((sub) => sub.kind === "resource" && sub.resource_id)
        .map((sub) => String(sub.resource_id)),
    ),
  );

  const plain = extractChapterPlainText(chapter);
  const canUseAi = plain.length >= 80;

  const handleCreateQuiz = () => {
    if (!courseId) {
      toast.error("Enregistrez la formation avant de créer un quiz.");
      return;
    }
    if (!canUseAi) {
      toast.error("Ajoutez du contenu au chapitre (80 caractères min.) avant de générer un quiz.");
      return;
    }
    setBusy("quiz");
    startTransition(async () => {
      const loadingId = toast.loading("Génération du quiz (IA)…");
      try {
        const chapterLabel = chapter.title?.trim() || "Chapitre";
        const quizTitle = `Quiz · ${chapterLabel}`;
        const payloadSection = buildChapterQuizPayload(sectionTitle, chapter);

        const genRes = await fetch("/api/formateur/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapitres: [payloadSection],
            nb_questions: 6,
            type: "qcm",
            niveau: "Moyen",
            formation_titre: generalTitle || "Formation",
          }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData?.error || "Génération impossible");

        const questions = (Array.isArray(genData?.questions) ? genData.questions : []).map((q: any) => ({
          question: String(q?.question ?? "Question"),
          options: Array.isArray(q?.options) && q.options.length >= 2 ? q.options : ["A", "B", "C", "D"],
          correct: typeof q?.correct === "number" ? q.correct : 0,
          explication: String(q?.explication ?? ""),
          points: 1,
          type: "qcm",
        }));
        if (!questions.length) throw new Error("Aucune question générée");

        const saveRes = await fetch("/api/formateur/quiz/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formation_id: courseId,
            title: quizTitle,
            titre: quizTitle,
            description: `Quiz de fin de chapitre — ${chapterLabel}`,
            questions,
            scoring: { points_par_question: 1, penalite: 0, score_minimum: 70 },
            type: "qcm",
          }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData?.error || "Sauvegarde impossible");

        const testId = saveData?.test_id ? String(saveData.test_id) : "";
        const quizUrl = testId ? `/quiz?testId=${encodeURIComponent(testId)}` : "";

        appendSubchapterBlock(sectionId, chapter.id, {
          title: quizTitle,
          duration: "10 min",
          type: "document",
          summary: "Vérifiez votre compréhension du chapitre.",
          content: quizUrl
            ? `<p><a href="${quizUrl}" target="_blank" rel="noreferrer">Ouvrir le quiz</a></p>`
            : "<p>Ouvrir le quiz</p>",
          kind: "quiz",
          quiz_id: testId || undefined,
        });

        toast.success("Quiz créé", { description: "Le quiz a été ajouté en fin de chapitre." });
      } catch (e) {
        console.error("[chapter-quiz]", e);
        toast.error(e instanceof Error ? e.message : "Échec de la création du quiz");
      } finally {
        toast.dismiss(loadingId);
        setBusy(null);
      }
    });
  };

  const disabled = isPending || busy !== null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={disabled}
          onClick={() => void handleCreateQuiz()}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em]",
            primaryGradient,
          )}
        >
          {busy === "quiz" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListChecks className="h-3.5 w-3.5" />}
          Créer un quiz
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
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
          disabled={disabled}
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
        {!canUseAi ? (
          <span className={cn("text-[11px]", isLight ? "text-slate-500" : "text-white/45")}>
            Contenu du chapitre trop court pour l’IA.
          </span>
        ) : null}
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
