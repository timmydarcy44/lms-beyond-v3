"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TestAnswerValue, TestQuestion, answerMatchesCorrect, useTestSessions } from "@/hooks/use-test-sessions";
import { toast } from "sonner";
import { buildCategoryRadar, buildQuizReviewItems } from "@/lib/quiz/build-question-review";
import { QuizWelcome } from "@/components/quiz/quiz-welcome";
import { QuizResults } from "@/components/quiz/quiz-results";
import { QuizQuestionView } from "@/components/lms/quiz-question-view";
import { explicitQuestionImage, goalCount, questionConcept, questionExplanation } from "@/lib/lms/presentation";
import { quizScoreStorageKey } from "@/lib/lms/module-gate";
import type { QuizSegment } from "@/components/lms/quiz-progress-bar";

export type TestFlowProps = {
  slug: string;
  title: string;
  questions: TestQuestion[];
  summary?: string;
  onClose?: () => void;
  fullscreen?: boolean;
  className?: string;
  minScorePercent?: number;
  immersive?: boolean;
  onQuizCompleted?: (testId: string, score?: number) => void;
  chapterLabel?: string;
  courseId?: string;
  lessonId?: string;
  continueHref?: string;
  /** Le module suivant reste fermé sous le score minimum. */
  blocksNextModule?: boolean;
  /** Nom du module qui s’ouvre quand le seuil est atteint. */
  openedModuleName?: string;
};

type SavedSpot = {
  index: number;
  answers: Record<string, TestAnswerValue>;
  validated: Record<string, boolean>;
  revealed: boolean;
  done?: boolean;
};

function spotKey(slug: string) {
  return `lms:quiz-pos:${slug}`;
}

function readSpot(slug: string): SavedSpot | null {
  try {
    const raw = sessionStorage.getItem(spotKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSpot;
    if (!parsed || parsed.done || typeof parsed.index !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function TestFlow({
  slug,
  title,
  questions,
  summary,
  onClose,
  fullscreen,
  className,
  minScorePercent = 70,
  immersive = true,
  onQuizCompleted,
  chapterLabel,
  courseId,
  lessonId,
  continueHref,
  blocksNextModule = false,
  openedModuleName = "",
}: TestFlowProps) {
  const router = useRouter();
  const startSession = useTestSessions((state) => state.startSession);
  const recordAnswer = useTestSessions((state) => state.recordAnswer);
  const completeSession = useTestSessions((state) => state.completeSession);
  const resetSession = useTestSessions((state) => state.resetSession);
  const session = useTestSessions((state) => state.sessions[slug]);

  const [showWelcome, setShowWelcome] = useState(immersive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [localTextAnswers, setLocalTextAnswers] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const saved = readSpot(slug);
    setShowSummary(false);
    setLocalTextAnswers({});
    if (saved && questions.length) {
      startSession({ slug, title, totalQuestions: questions.length });
      for (const [id, value] of Object.entries(saved.answers ?? {})) {
        recordAnswer(slug, id, value);
      }
      setCurrentIndex(Math.min(saved.index, questions.length - 1));
      setValidated(saved.validated ?? {});
      setRevealed(Boolean(saved.revealed));
      setShowWelcome(false);
      return;
    }
    setShowWelcome(immersive);
    setCurrentIndex(0);
    setValidated({});
    setRevealed(false);
  }, [slug, questions.length, immersive]);

  const currentQuestion = questions[currentIndex];
  const answers = session?.answers ?? {};

  const reviewItems = useMemo(
    () => (session?.answers ? buildQuizReviewItems(questions, session.answers) : []),
    [session?.answers, questions],
  );
  const radarRows = useMemo(
    () => (session?.answers ? buildCategoryRadar(questions, session.answers) : []),
    [session?.answers, questions],
  );

  useEffect(() => {
    if (showWelcome || showSummary || !questions.length) return;
    const payload: SavedSpot = {
      index: currentIndex,
      answers,
      validated,
      revealed,
    };
    try {
      sessionStorage.setItem(spotKey(slug), JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [answers, currentIndex, questions.length, revealed, showSummary, showWelcome, slug, validated]);

  const handleMultipleSelect = (questionId: string, optionValue: string) => {
    const existing = (answers[questionId] as string[] | undefined) ?? [];
    const next = existing.includes(optionValue)
      ? existing.filter((value) => value !== optionValue)
      : [...existing, optionValue];
    recordAnswer(slug, questionId, next);
  };

  const handleScaleChange = (questionId: string, value: number) => {
    recordAnswer(slug, questionId, value);
  };

  const handleTextChange = (questionId: string, value: string) => {
    setLocalTextAnswers((prev) => ({ ...prev, [questionId]: value }));
    recordAnswer(slug, questionId, value);
  };

  const ensureAnswered = (question: TestQuestion): boolean => {
    if (question.type === "text") {
      const localValue = localTextAnswers[question.id];
      const storeValue = answers[question.id];
      const textValue = (typeof localValue === "string" ? localValue : typeof storeValue === "string" ? storeValue : "").trim();
      return textValue.length >= 3;
    }
    const value = answers[question.id];
    if (question.type === "multiple") return Array.isArray(value) && value.length > 0;
    if (question.type === "single") return typeof value === "string" && value.trim().length > 0;
    if (question.type === "scale") return typeof value === "number" && !Number.isNaN(value);
    return false;
  };

  const handleWelcomeStart = () => {
    if (questions.length) {
      startSession({ slug, title, totalQuestions: questions.length });
    }
    setCurrentIndex(0);
    setRevealed(false);
    setShowWelcome(false);
  };

  const finish = async () => {
    if (!currentQuestion) return;
    try {
      setIsSubmitting(true);
      const result = completeSession(slug, { questions });
      if (!result) throw new Error("Impossible d'enregistrer le test");
      const reviewPayload = {
        items: buildQuizReviewItems(questions, result.answers),
        radar: buildCategoryRadar(questions, result.answers),
      };
      try {
        await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId: slug,
            score: result.score,
            answers: result.answers,
            review: reviewPayload,
            openedModule: blocksNextModule && result.score >= minScorePercent ? openedModuleName : "",
            minPercent: minScorePercent,
          }),
        });
      } catch (error) {
        console.warn("[test-flow] quiz_submissions insert", error);
      }
      try {
        sessionStorage.setItem(spotKey(slug), JSON.stringify({ index: 0, answers: {}, validated: {}, revealed: false, done: true }));
      } catch {
        /* ignore */
      }
      try {
        sessionStorage.setItem(quizScoreStorageKey(slug), String(Math.round(result.score)));
      } catch {
        /* ignore */
      }
      toast.success("Quiz complété !");
      setShowSummary(true);
      onQuizCompleted?.(slug, result.score);
    } catch (error) {
      console.error(error);
      toast.error("Un souci est survenu, réessayez");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = () => {
    if (!currentQuestion) return;
    if (!ensureAnswered(currentQuestion)) {
      toast.error(currentQuestion.type === "text" ? "Ta réponse doit contenir au moins 3 caractères." : "Choisis une réponse avant de valider.");
      return;
    }
    setValidated((prev) => ({ ...prev, [currentQuestion.id]: true }));
    setRevealed(true);
  };

  const continueQuestion = () => {
    if (currentIndex === questions.length - 1) {
      void finish();
      return;
    }
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
    setRevealed(false);
  };

  const quit = () => {
    if (onClose) onClose();
    else router.back();
  };

  if (!questions.length) {
    return (
      <Card className={cn(immersive ? "!border-2 !border-slate-200 !bg-white" : "border-white/10 bg-white/5 text-white")}>
        <CardContent className="flex items-center gap-3 py-12">
          <Loader2 className={cn("h-5 w-5 animate-spin", immersive ? "!text-indigo-600" : "text-white/70")} />
          <p className={cn("text-sm font-semibold", immersive ? "!text-slate-950" : "text-white/70")}>Chargement du quiz…</p>
        </CardContent>
      </Card>
    );
  }

  if (showSummary && session?.score !== undefined && session.completedAt) {
    const completionDelay = session.completedAt.toLocaleString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });

    const holdsNext = blocksNextModule && session.score < minScorePercent;
    return (
      <QuizResults
        score={session.score}
        minScorePercent={minScorePercent}
        summary={summary}
        completionLabel={`Terminé le ${completionDelay}`}
        reviewItems={reviewItems}
        radarRows={radarRows}
        courseId={courseId}
        lessonId={lessonId}
        continueHref={holdsNext ? undefined : continueHref}
        unlockedModuleName={holdsNext ? undefined : openedModuleName.trim() || undefined}
        nextLockedMessage={
          holdsNext
            ? `Il te faut ${goalCount(minScorePercent, questions.length)} / ${questions.length} pour ouvrir le module suivant.`
            : undefined
        }
        onClose={() => {
          if (onClose) onClose();
          else router.push("/dashboard/student/learning/tests");
        }}
        onReviewAgain={() => {
          resetSession(slug);
          setCurrentIndex(0);
          setShowSummary(false);
          setValidated({});
          setRevealed(false);
          setShowWelcome(immersive);
          try {
            sessionStorage.removeItem(spotKey(slug));
          } catch {
            /* ignore */
          }
        }}
        fullscreen={fullscreen}
        className={className}
      />
    );
  }

  if (immersive && showWelcome) {
    return (
      <QuizWelcome
        title={title}
        questionCount={questions.length}
        minScorePercent={minScorePercent}
        onStart={handleWelcomeStart}
        onQuit={onClose}
        fullscreen={fullscreen}
        className={className}
      />
    );
  }

  if (!currentQuestion) return null;

  const selectedRaw = answers[currentQuestion.id];
  const selected = Array.isArray(selectedRaw)
    ? selectedRaw.map(String)
    : typeof selectedRaw === "string"
      ? [selectedRaw]
      : [];
  const correctRaw = currentQuestion.correct_answer;
  const correctValues = Array.isArray(correctRaw)
    ? correctRaw.map(String)
    : correctRaw === undefined || correctRaw === null
      ? []
      : [String(correctRaw)];

  const segments: QuizSegment[] = questions.map((question, index) => {
    const known = validated[question.id] || (index === currentIndex && revealed);
    if (known) return answerMatchesCorrect(question, answers[question.id]) ? "correct" : "wrong";
    if (index === currentIndex) return "current";
    return "upcoming";
  });

  let streak = 0;
  const last = revealed ? currentIndex : currentIndex - 1;
  for (let index = last; index >= 0; index -= 1) {
    const question = questions[index];
    if (!question || !validated[question.id]) break;
    if (!answerMatchesCorrect(question, answers[question.id])) break;
    streak += 1;
  }

  const concept = questionConcept(currentQuestion);
  const isChoice = currentQuestion.type === "single" || currentQuestion.type === "multiple";

  return (
    <div className={cn("h-[100dvh] max-h-[100dvh] overflow-y-auto", fullscreen && "min-h-[100dvh]", className)}>
      <QuizQuestionView
        chapterLabel={chapterLabel || title}
        index={currentIndex + 1}
        total={questions.length}
        prompt={currentQuestion.title}
        imageUrl={explicitQuestionImage(currentQuestion.imageUrl)}
        multiple={currentQuestion.type === "multiple"}
        options={isChoice ? currentQuestion.options ?? [] : []}
        selected={selected}
        revealed={revealed}
        correctValues={correctValues}
        explanation={questionExplanation(currentQuestion)}
        conceptLabel={concept?.label}
        conceptPassage={concept?.passage}
        streak={streak}
        segments={segments}
        canValidate={ensureAnswered(currentQuestion)}
        busy={isSubmitting}
        onToggle={(value) => {
          if (currentQuestion.type === "multiple") handleMultipleSelect(currentQuestion.id, value);
          else recordAnswer(slug, currentQuestion.id, value);
        }}
        onValidate={validate}
        onContinue={continueQuestion}
        onQuit={quit}
        extra={
          currentQuestion.type === "scale" ? (
            <ScaleField
              question={currentQuestion}
              value={typeof selectedRaw === "number" ? selectedRaw : undefined}
              onChange={(value) => handleScaleChange(currentQuestion.id, value)}
            />
          ) : currentQuestion.type === "text" ? (
            <textarea
              value={localTextAnswers[currentQuestion.id] || (typeof selectedRaw === "string" ? selectedRaw : "")}
              placeholder={currentQuestion.placeholder ?? "Ta réponse"}
              onChange={(event) => handleTextChange(currentQuestion.id, event.target.value)}
            />
          ) : currentQuestion.helper ? (
            <p>{currentQuestion.helper}</p>
          ) : null
        }
      />
    </div>
  );
}

function ScaleField({
  question,
  value,
  onChange,
}: {
  question: TestQuestion;
  value?: number;
  onChange: (value: number) => void;
}) {
  const scale = question.scale ?? { min: 0, max: 10, step: 1 };
  const current = typeof value === "number" ? value : scale.min;
  return (
    <label>
      <span>
        {scale.leftLabel ?? "Faible"} — {scale.rightLabel ?? "Élevé"}
      </span>
      <input
        type="range"
        min={scale.min}
        max={scale.max}
        step={scale.step ?? 1}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <strong>{current}</strong>
    </label>
  );
}
