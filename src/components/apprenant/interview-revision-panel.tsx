"use client";

import { useState } from "react";
import { ArrowLeft, BookMarked, ChevronRight, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { InterviewRevisionDiagnostic } from "@/components/apprenant/interview-revision-diagnostic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RevisionLessonItem } from "@/lib/apprenant/interview-revision-outline";

type InterviewRevisionPanelProps = {
  chapterTitle: string;
  contextText: string;
  interviewObjectives?: string;
  revisionItems: RevisionLessonItem[];
  onBack: () => void;
  onStartInterview: () => void;
  className?: string;
};

export function InterviewRevisionPanel({
  chapterTitle,
  contextText,
  interviewObjectives,
  revisionItems,
  onBack,
  onStartInterview,
  className,
}: InterviewRevisionPanelProps) {
  const router = useRouter();
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  if (showDiagnostic) {
    return (
      <div className={cn("mx-auto max-w-2xl space-y-4", className)}>
        <InterviewRevisionDiagnostic
          contextText={contextText}
          interviewObjectives={interviewObjectives}
          chapterTitle={chapterTitle}
          revisionItems={revisionItems}
          onBack={() => setShowDiagnostic(false)}
          onStartInterview={onStartInterview}
          onOpenLesson={(href) => router.push(href)}
        />
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-2xl", className)}>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2 gap-2 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-700">Révision</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Reprenez le chapitre « {chapterTitle} »
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Choisissez un contenu à revoir, ou passez un mini-test pour identifier ce qu&apos;il faut
          approfondir.
        </p>

        <div className="mt-6 space-y-2">
          {revisionItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aucun sous-contenu disponible pour ce chapitre.
            </p>
          ) : (
            revisionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(item.href)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-violet-400 hover:bg-white"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase",
                    item.kind === "chapter"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-slate-200 text-slate-700",
                  )}
                >
                  {item.kind === "chapter" ? (
                    <BookMarked className="h-4 w-4" />
                  ) : (
                    "SC"
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wider text-slate-500">
                    {item.kind === "chapter" ? "Chapitre" : "Sous-chapitre"}
                  </span>
                  <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-violet-600" />
              </button>
            ))
          )}
        </div>

        <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDiagnostic(true)}
            disabled={revisionItems.length === 0}
            className="w-full justify-center gap-2 rounded-full border-violet-200 py-5 text-sm font-semibold text-violet-800 hover:bg-violet-50"
          >
            <ClipboardCheck className="h-4 w-4" />
            Mini-test : voir ce que je maîtrise
          </Button>
          <Button
            type="button"
            onClick={onStartInterview}
            className="w-full rounded-full bg-violet-600 py-5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Je suis prêt — lancer l&apos;entretien
          </Button>
        </div>
      </div>
    </div>
  );
}
