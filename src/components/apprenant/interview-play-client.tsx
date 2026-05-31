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
  interviewObjectives?: string;
  chapterTitle: string;
  courseTitle?: string;
  lessonId: string;
  returnHref: string;
  revisionItems: RevisionLessonItem[];
};

async function fetchOpeningMessage(
  contextText: string,
  chapterTitle: string,
  courseTitle?: string,
  interviewObjectives?: string,
): Promise<string | null> {
  if (!contextText.trim() || contextText.trim().length < 40) return null;
  try {
    const res = await fetch("/api/ai/experiential-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [],
        contextText,
        interviewObjectives: interviewObjectives?.trim() || undefined,
        chapterTitle,
        courseTitle,
      }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return String(data.reply ?? "").trim() || null;
  } catch {
    return null;
  }
}

export function InterviewPlayClient({
  contextText,
  interviewObjectives,
  chapterTitle,
  courseTitle,
  lessonId,
  returnHref,
  revisionItems,
}: InterviewPlayClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("readiness");
  const [feedback, setFeedback] = useState<InterviewFeedbackPayload | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [prefetchedOpening, setPrefetchedOpening] = useState<string | null>(null);

  useEffect(() => {
    setFlowPhase("readiness");
    setMessages([]);
    setFeedback(null);
    setFeedbackError(null);
    setPrefetchedOpening(null);
  }, [lessonId]);

  useEffect(() => {
    if (flowPhase !== "cinematic" && flowPhase !== "readiness") return;
    let cancelled = false;
    void fetchOpeningMessage(contextText, chapterTitle, courseTitle, interviewObjectives).then((reply) => {
      if (!cancelled && reply) setPrefetchedOpening(reply);
    });
    return () => {
      cancelled = true;
    };
  }, [flowPhase, contextText, interviewObjectives, chapterTitle, courseTitle, lessonId]);

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
          interviewObjectives: interviewObjectives?.trim() || undefined,
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
      <div className="apprenant-studio-light flex min-h-dvh items-center justify-center px-4 py-10">
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
    <div data-interview-immersive className="relative min-h-dvh w-full bg-[#050208] text-white">
      <InterviewCinematicTransition
        active={flowPhase === "cinematic"}
        chapterTitle={chapterTitle}
        onComplete={() => setFlowPhase("readiness")}
      />

      {flowPhase === "readiness" ? (
        <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
          <InterviewReadinessGate
            chapterTitle={chapterTitle}
            courseTitle={courseTitle}
            interviewObjectives={interviewObjectives}
            onReady={startInterview}
            onRevise={() => setFlowPhase("revision")}
          />
        </div>
      ) : null}

      {flowPhase === "revision" ? (
        <div className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 py-8 sm:px-6">
          <InterviewRevisionPanel
            chapterTitle={chapterTitle}
            contextText={contextText}
            interviewObjectives={interviewObjectives}
            revisionItems={revisionItems}
            onBack={() => setFlowPhase("readiness")}
            onStartInterview={startInterview}
            className="text-white"
          />
        </div>
      ) : null}

      {flowPhase === "chat" ? (
        <div className="flex h-[100dvh] min-h-0 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-white/10 bg-[#0a0612]/90 px-4 py-3 backdrop-blur-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (canFinish) void handleFinish();
                else router.push(returnHref);
              }}
              className="rounded-full border-white/20 bg-transparent text-xs uppercase tracking-[0.2em] text-white hover:bg-white/10"
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
            <p className="shrink-0 px-4 py-2 text-center text-xs text-white/50">
              Échangez au moins deux fois avec l&apos;assistant avant de terminer.
            </p>
          ) : null}
          <div className="min-h-0 flex-1">
            <ExperientialInterviewView
              contextText={contextText}
              interviewObjectives={interviewObjectives}
              chapterTitle={chapterTitle}
              courseTitle={courseTitle}
              conversationActive
              initialAssistantMessage={prefetchedOpening}
              onMessagesChange={setMessages}
              className="h-full min-h-0 rounded-none border-0 shadow-none"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
