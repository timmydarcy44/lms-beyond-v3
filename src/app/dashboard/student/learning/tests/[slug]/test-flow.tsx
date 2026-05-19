"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TestQuestion, useTestSessions } from "@/hooks/use-test-sessions";
import { toast } from "sonner";
import { buildCategoryRadar, buildQuizReviewItems } from "@/lib/quiz/build-question-review";
import { QuizWelcome } from "@/components/quiz/quiz-welcome";
import { QuizResults } from "@/components/quiz/quiz-results";

export type TestFlowProps = {
  slug: string;
  title: string;
  questions: TestQuestion[];
  summary?: string;
  onClose?: () => void;
  fullscreen?: boolean;
  className?: string;
  /** Score minimum affiché sur l’écran d’accueil (%) */
  minScorePercent?: number;
  /** UI immersive claire (intro + fond blanc). Mettre false pour retrouver le thème sombre historique. */
  immersive?: boolean;
  /** Après complétion (résumé affiché), ex. pour débloquer la navigation formation */
  onQuizCompleted?: (testId: string) => void;
};

const questionVariants = {
  initial: { opacity: 0, x: 48, scale: 0.99 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.99,
    transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] as const },
  },
};

const PREMIUM_IMAGE_PREFIX = "minimalist, editorial photography, high-end";

function questionHasVisualMedia(question: TestQuestion | undefined): boolean {
  if (!question) return false;
  const kw = String(question.image_keyword ?? (question as { imageKeyword?: string }).imageKeyword ?? "").trim();
  const url = String(question.imageUrl ?? "").trim();
  return Boolean(url || kw);
}

function withPremiumImageKeyword(keyword: string) {
  const t = keyword.trim();
  if (!t) return PREMIUM_IMAGE_PREFIX;
  if (/minimalist.*editorial.*high-end/i.test(t)) return t.replace(/\s+/g, ",").replace(/,+/g, ",");
  return `${PREMIUM_IMAGE_PREFIX},${t.replace(/\s+/g, ",")}`.replace(/,+/g, ",");
}

function buildUnsplashKeywordSrc(keyword: string, w = 800, h = 450) {
  const q = withPremiumImageKeyword(keyword);
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`;
}

function QuestionMedia({
  question,
  variant = "compact",
}: {
  question: TestQuestion;
  variant?: "compact" | "split";
}) {
  const [broken, setBroken] = useState(false);
  const keyword =
    question.image_keyword ||
    (question as { imageKeyword?: string }).imageKeyword ||
    "";
  const explicit = question.imageUrl?.trim();
  const fallbackFeatured = `https://source.unsplash.com/featured/1200x1600/?${encodeURIComponent(withPremiumImageKeyword("education,abstract"))}`;
  const primarySrc = explicit || (keyword ? buildUnsplashKeywordSrc(keyword, 1200, 1600) : "");

  const splitWrap = "absolute inset-0 min-h-0 w-full overflow-hidden !bg-white";
  const compactFrame =
    "relative h-36 w-full max-w-xs overflow-hidden rounded-xl border-2 border-slate-300 !bg-white";

  if (variant === "split") {
    if (broken && !explicit) {
      return (
        <div className={splitWrap}>
          <div className="absolute inset-0 bg-slate-100" />
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-bold !text-slate-950">
            Visuel indisponible
          </p>
        </div>
      );
    }
    if (!primarySrc) {
      return (
        <div className={splitWrap}>
          <div className="absolute inset-0 bg-slate-100" />
        </div>
      );
    }
    return (
      <div className={splitWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primarySrc}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  if (broken && !explicit) {
    return (
      <div className={cn(compactFrame, "bg-white")}>
        <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs font-black !text-slate-950">
          Visuel
        </p>
      </div>
    );
  }

  if (!primarySrc) {
    return (
      <div className={compactFrame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackFeatured}
          alt=""
          className="relative z-10 h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <div className={compactFrame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={primarySrc}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
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
}: TestFlowProps) {
  const router = useRouter();
  const startSession = useTestSessions((state) => state.startSession);
  const recordAnswer = useTestSessions((state) => state.recordAnswer);
  const completeSession = useTestSessions((state) => state.completeSession);
  const session = useTestSessions((state) => state.sessions[slug]);

  const [showWelcome, setShowWelcome] = useState(immersive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [localTextAnswers, setLocalTextAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setShowWelcome(immersive);
    setCurrentIndex(0);
    setShowSummary(false);
    setLocalTextAnswers({});
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
    if (currentQuestion && currentQuestion.type === "text") {
      const storeValue = answers[currentQuestion.id];
      if (storeValue && typeof storeValue === "string" && !localTextAnswers[currentQuestion.id]) {
        setLocalTextAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: storeValue,
        }));
      }
    }
  }, [currentQuestion?.id, currentQuestion?.type, answers, currentQuestion, localTextAnswers]);

  const handleSingleSelect = (questionId: string, optionValue: string) => {
    recordAnswer(slug, questionId, optionValue);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
      } else {
        goNext();
      }
    }, 280);
  };

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
    setShowWelcome(false);
  };

  const goNext = async () => {
    if (!currentQuestion) return;
    if (!ensureAnswered(currentQuestion)) {
      if (currentQuestion.type === "text") {
        toast.error("Votre réponse doit contenir au moins 3 caractères ✍️");
      } else {
        toast.error("Merci de répondre avant de valider ✍️");
      }
      return;
    }
    if (currentIndex === questions.length - 1) {
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
            }),
          });
        } catch (e) {
          console.warn("[test-flow] quiz_submissions insert", e);
        }
        toast.success("Quiz complété !");
        setShowSummary(true);
        onQuizCompleted?.(slug);
      } catch (error) {
        console.error(error);
        toast.error("Un souci est survenu, réessayez");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  };

  const goPrevious = () => {
    if (showWelcome) {
      if (onClose) onClose();
      else router.back();
      return;
    }
    if (currentIndex === 0) {
      if (immersive) setShowWelcome(true);
      else if (onClose) onClose();
      else router.back();
      return;
    }
    setCurrentIndex((index) => Math.max(index - 1, 0));
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

    return (
      <QuizResults
        score={session.score}
        minScorePercent={minScorePercent}
        summary={summary}
        completionLabel={`Terminé le ${completionDelay}`}
        reviewItems={reviewItems}
        radarRows={radarRows}
        onClose={() => {
          if (onClose) onClose();
          else router.push("/dashboard/student/learning/tests");
        }}
        onReviewAgain={() => {
          setCurrentIndex(0);
          setShowSummary(false);
          setShowWelcome(immersive);
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

  const headerProgress = ((currentIndex + 1) / questions.length) * 100;

  const hasSplitMedia = currentQuestion ? questionHasVisualMedia(currentQuestion) : false;

  return (
    <div
      className={cn(
        "quiz-force-light flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden !bg-white",
        fullscreen && "min-h-[100dvh]",
        className,
      )}
    >
      <header className="shrink-0 border-b border-slate-200 !bg-white px-4 pb-2 pt-3 sm:px-6 [&_h2]:!text-slate-950 [&_span]:!text-slate-950">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goPrevious}
            className="shrink-0 rounded-full font-semibold !text-slate-950 hover:!bg-slate-100"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{currentIndex === 0 ? "Retour" : "Précédent"}</span>
          </Button>
          <h2 className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight !text-slate-950 sm:text-base">{title}</h2>
          <span className="shrink-0 tabular-nums text-xs font-bold !text-slate-950 sm:text-sm">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 w-full max-w-[1920px] overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-slate-950 via-indigo-600 to-violet-600"
            initial={false}
            animate={{ width: `${headerProgress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col !bg-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestion?.id}
            variants={questionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "grid min-h-0 flex-1 overflow-hidden",
              hasSplitMedia ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            {hasSplitMedia && currentQuestion ? (
              <div className="relative hidden min-h-0 lg:block">
                <QuestionMedia question={currentQuestion} variant="split" />
              </div>
            ) : null}
            {hasSplitMedia && currentQuestion ? (
              <div className="relative h-44 min-h-0 shrink-0 lg:hidden">
                <QuestionMedia question={currentQuestion} variant="split" />
              </div>
            ) : null}

            <div
              className={cn(
                "flex min-h-0 flex-col justify-center gap-6 overflow-y-auto !bg-white px-6 py-8 lg:gap-8 lg:px-20 lg:py-12",
                !hasSplitMedia && "lg:mx-auto lg:max-w-4xl lg:w-full",
              )}
            >
              <div className="shrink-0">
                <h3 className="!text-3xl !font-black !text-black leading-tight tracking-tight">
                  {currentQuestion?.title}
                </h3>
                {currentQuestion?.helper ? (
                  <p className="mt-3 text-base font-medium !text-slate-950 sm:text-lg">{currentQuestion.helper}</p>
                ) : null}
              </div>

              {currentQuestion ? (
                <div className="min-h-0 flex-1">
                  <QuestionRendererLight
                    question={currentQuestion}
                    answer={
                      currentQuestion.type === "text"
                        ? localTextAnswers[currentQuestion.id] || answers[currentQuestion.id] || ""
                        : answers[currentQuestion.id]
                    }
                    onSelectSingle={handleSingleSelect}
                    onSelectMultiple={handleMultipleSelect}
                    onScaleChange={handleScaleChange}
                    onTextChange={handleTextChange}
                  />
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="shrink-0 border-t border-slate-200 !bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1920px] justify-end gap-2">
          {currentIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goPrevious}
              className="rounded-full border-2 border-slate-300 !bg-white px-5 !text-slate-950 hover:!border-indigo-400 hover:!bg-indigo-50"
            >
              Précédent
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={isSubmitting}
            className="min-w-[132px] rounded-full !bg-indigo-600 px-6 py-2 text-sm font-semibold !text-white shadow-sm hover:!bg-indigo-700"
          >
            {currentIndex === questions.length - 1 ? "Terminer" : "Suivant"}
            {isSubmitting ? (
              <Loader2 className="ml-2 inline h-4 w-4 animate-spin !text-white" />
            ) : (
              <ChevronRight className="ml-1 inline h-4 w-4 !text-white" />
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function QuestionRendererLight({
  question,
  answer,
  onSelectSingle,
  onSelectMultiple,
  onScaleChange,
  onTextChange,
}: {
  question: TestQuestion;
  answer: unknown;
  onSelectSingle: (questionId: string, value: string) => void;
  onSelectMultiple: (questionId: string, value: string) => void;
  onScaleChange: (questionId: string, value: number) => void;
  onTextChange: (questionId: string, value: string) => void;
}) {
  const optionBase =
    "flex min-h-[56px] items-center justify-between rounded-xl border-2 border-slate-300 bg-slate-100 px-4 py-3 text-left text-sm font-medium opacity-100 transition hover:border-indigo-500 hover:bg-slate-100";
  const optionActive =
    "!border-indigo-600 !bg-white font-bold !text-slate-950 !opacity-100 shadow-sm ring-1 ring-indigo-600/15";

  if (question.type === "single") {
    return (
      <div
        className="grid auto-rows-fr gap-3 sm:grid-cols-2 !text-black !opacity-100"
        style={{ color: "#000000", opacity: 1 }}
      >
        {(question.options ?? []).map((option) => {
          const active = String(answer ?? "") === String(option.value ?? "");
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectSingle(question.id, String(option.value))}
              className={cn(optionBase, active && optionActive, "!text-slate-950")}
            >
              <span className={cn("!text-black !opacity-100 !text-slate-950", active && "font-bold")}>{option.label}</span>
              <Check
                className={cn("h-4 w-4 shrink-0 text-indigo-600", active ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(answer) ? answer.map(String) : [];
    return (
      <div
        className="grid auto-rows-fr gap-3 sm:grid-cols-2 !text-black !opacity-100"
        style={{ color: "#000000", opacity: 1 }}
      >
        {(question.options ?? []).map((option) => {
          const isActive = selected.includes(String(option.value));
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectMultiple(question.id, String(option.value))}
              className={cn(optionBase, isActive && optionActive, "!text-slate-950")}
            >
              <span className={cn("!text-black !opacity-100 !text-slate-950", isActive && "font-bold")}>{option.label}</span>
              <Check
                className={cn("h-4 w-4 shrink-0 text-indigo-600", isActive ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "scale") {
    const scale = question.scale ?? { min: 0, max: 10, step: 1 };
    const currentValue = typeof answer === "number" ? answer : Math.round((scale.max - scale.min) / 2);
    return (
      <div className="space-y-4 rounded-xl border-2 border-slate-300 !bg-white p-5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider !text-slate-950">
          <span>{scale.leftLabel ?? "Faible"}</span>
          <span>{scale.rightLabel ?? "Élevé"}</span>
        </div>
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={scale.step ?? 1}
          value={currentValue}
          onChange={(event) => onScaleChange(question.id, Number(event.target.value))}
          className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-indigo-600"
        />
        <p className="text-sm font-bold !text-slate-950">Valeur : {currentValue}</p>
      </div>
    );
  }

  const textValue = typeof answer === "string" ? answer : "";
  const trimmedLength = textValue.trim().length;
  return (
    <div className="space-y-2">
      <textarea
        rows={4}
        className="w-full resize-none rounded-xl border-2 border-slate-300 !bg-white p-4 text-base font-medium !text-slate-950 placeholder:!text-slate-950/50 focus:!border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        value={textValue}
        onChange={(event) => onTextChange(question.id, event.target.value)}
        placeholder={question.placeholder ?? "Votre réponse"}
      />
      <p className="text-sm font-bold !text-slate-950">
        {trimmedLength < 3 ? `Minimum 3 caractères (${trimmedLength}/3)` : "Réponse valide"}
      </p>
    </div>
  );
}
