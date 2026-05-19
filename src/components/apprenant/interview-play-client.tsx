"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ExperientialInterviewView } from "@/components/apprenant/experiential-interview-view";
import { InterviewCinematicTransition } from "@/components/apprenant/interview-cinematic-transition";
import { InterviewFeedbackPanel } from "@/components/apprenant/interview-feedback-panel";
import { InterviewReadinessGate } from "@/components/apprenant/interview-readiness-gate";
import { InterviewRevisionPanel } from "@/components/apprenant/interview-revision-panel";
import { Button } from "@/components/ui/button";
import type { InterviewFeedbackPayload } from "@/app/api/ai/experiential-interview/feedback/route";
import type { RevisionLessonItem } from "@/lib/apprenant/interview-revision-outline";

type ChatMessage = { role: "user" | "assistant"; content: string };

type FlowPhase = "cinematic" | "readiness" | "revision" | "chat" | "feedback";

type InterviewPlayClientProps = {
  contextText: string;
  chapterTitle: string;
  courseTitle?: string;
  lessonId: string;
  returnHref: string;
  revisionItems: RevisionLessonItem[];
};

export function InterviewPlayClient({
  contextText,
  chapterTitle,
  courseTitle,
  lessonId,
  returnHref,
  revisionItems,
}: InterviewPlayClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("cinematic");
  const [feedback, setFeedback] = useState<InterviewFeedbackPayload | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    setFlowPhase("cinematic");
    setMessages([]);
    setFeedback(null);
    setFeedbackError(null);
  }, [lessonId]);

  const userTurns = messages.filter((m) => m.role === "user" && m.content.trim()).length;
  const canFinish = userTurns >= 2;

  const markInterviewDone = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`lms:interview-done:${lessonId}`, "1");
    } catch {
      /* ignore */
    }
  }, [lessonId]);

  const handleFinish = async () => {
    if (!canFinish) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    setFlowPhase("feedback");
    try {
      const res = await fetch("/api/ai/experiential-interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          contextText,
          chapterTitle,
          courseTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Impossible de générer le bilan");
      setFeedback(data.feedback as InterviewFeedbackPayload);
      markInterviewDone();
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "Erreur lors du bilan");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleContinue = () => {
    router.push(returnHref);
    router.refresh();
  };

  const startInterview = () => {
    setMessages([]);
    setFlowPhase("chat");
  };

  if (flowPhase === "feedback") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <InterviewFeedbackPanel
          feedback={feedback}
          loading={feedbackLoading}
          error={feedbackError}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  return (
    <>
      <InterviewCinematicTransition
        active={flowPhase === "cinematic"}
        chapterTitle={chapterTitle}
        onComplete={() => setFlowPhase("readiness")}
      />

      {flowPhase === "readiness" ? (
        <div className="px-4 py-8">
          <InterviewReadinessGate
            chapterTitle={chapterTitle}
            courseTitle={courseTitle}
            onReady={startInterview}
            onRevise={() => setFlowPhase("revision")}
          />
        </div>
      ) : null}

      {flowPhase === "revision" ? (
        <div className="px-4 py-8">
          <InterviewRevisionPanel
            chapterTitle={chapterTitle}
            contextText={contextText}
            revisionItems={revisionItems}
            onBack={() => setFlowPhase("readiness")}
            onStartInterview={startInterview}
          />
        </div>
      ) : null}

      {flowPhase === "chat" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (canFinish) void handleFinish();
                else router.push(returnHref);
              }}
              className="rounded-full border-slate-200 text-xs uppercase tracking-[0.2em]"
            >
              {canFinish ? "Terminer et voir le bilan" : "Quitter"}
            </Button>
            <Button
              type="button"
              disabled={!canFinish}
              onClick={() => void handleFinish()}
              className="rounded-full bg-violet-600 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Terminer l&apos;entretien
            </Button>
          </div>
          {!canFinish ? (
            <p className="text-center text-xs text-slate-500">
              Échangez au moins deux fois avec l&apos;assistant avant de terminer.
            </p>
          ) : null}
          <ExperientialInterviewView
            contextText={contextText}
            chapterTitle={chapterTitle}
            courseTitle={courseTitle}
            conversationActive
            onMessagesChange={setMessages}
          />
        </div>
      ) : null}
    </>
  );
}
