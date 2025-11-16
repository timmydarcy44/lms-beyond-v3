"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, ListChecks, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TestQuestion, useTestSessions } from "@/hooks/use-test-sessions";
import { toast } from "sonner";

type TestFlowProps = {
  slug: string;
  title: string;
  questions: TestQuestion[];
  summary?: string;
  onClose?: () => void;
  fullscreen?: boolean;
  className?: string;
};

const questionVariants = {
  initial: {
    opacity: 0,
    x: 60,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -60,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

export default function TestFlow({ slug, title, questions, summary, onClose, fullscreen, className }: TestFlowProps) {
  const router = useRouter();
  const startSession = useTestSessions((state) => state.startSession);
  const recordAnswer = useTestSessions((state) => state.recordAnswer);
  const completeSession = useTestSessions((state) => state.completeSession);
  const session = useTestSessions((state) => state.sessions[slug]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (questions.length) {
      startSession({ slug, title, totalQuestions: questions.length });
    }
  }, [slug, startSession, title, questions.length]);

  const currentQuestion = questions[currentIndex];

  const answers = session?.answers ?? {};
  const answeredCount = useMemo(
    () =>
      Object.entries(answers).reduce((count, [key, value]) => {
        if (!questions.find((question) => question.id === key)) {
          return count;
        }

        if (Array.isArray(value)) {
          return value.length ? count + 1 : count;
        }

        if (typeof value === "number") {
          return !Number.isNaN(value) ? count + 1 : count;
        }

        if (typeof value === "string") {
          return value.trim().length ? count + 1 : count;
        }

        return value ? count + 1 : count;
      }, 0),
    [answers, questions],
  );

  const handleSingleSelect = (questionId: string, optionValue: string) => {
    recordAnswer(slug, questionId, optionValue);
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
    recordAnswer(slug, questionId, value);
  };

  const ensureAnswered = (question: TestQuestion): boolean => {
    const value = answers[question.id];
    if (question.type === "multiple") {
      return Array.isArray(value) && value.length > 0;
    }
    if (question.type === "single") {
      return typeof value === "string" && value.trim().length > 0;
    }
    if (question.type === "scale") {
      return typeof value === "number" && !Number.isNaN(value);
    }
    if (question.type === "text") {
      return typeof value === "string" && value.trim().length >= 3;
    }
    return false;
  };

  const goNext = async () => {
    if (!currentQuestion) return;
    if (!ensureAnswered(currentQuestion)) {
      toast.error("Merci de répondre avant de continuer ✍️");
      return;
    }
    if (currentIndex === questions.length - 1) {
      try {
        setIsSubmitting(true);
        const result = completeSession(slug);
        if (!result) {
          throw new Error("Impossible d'enregistrer le test");
        }
        toast.success("Test complété ! Vos résultats seront bientôt synchronisés.");
        setShowSummary(true);
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
    if (currentIndex === 0) {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
      return;
    }
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  if (!questions.length) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex items-center gap-3 py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm text-white/70">Chargement du test en cours…</p>
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
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        className={cn("space-y-8", fullscreen && "min-h-[70vh]")}
      >
        <Card className="border-white/10 bg-gradient-to-br from-[#1B2AC9] via-[#4A00E0] to-[#8E2DE2] text-white">
          <CardContent className="space-y-6 p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <ListChecks className="h-4 w-4" /> Résultats sauvegardés
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold">Score {session.score}/100</h2>
              <p className="text-sm text-white/80">
                Vos réponses sont prêtes à être synchronisées avec Supabase. Elles alimenteront prochainement votre espace "Mon compte" et les dashboards formateur, admin & tuteur.
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Terminé le {completionDelay}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Résumé</p>
              <p className="text-sm text-white/70">{summary ?? "Continuez à documenter vos prises de décision pour affiner votre profil pédagogique."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    router.push("/dashboard/tests");
                  }
                }}
                className="rounded-full bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#4A00E0]"
              >
                Retour aux tests
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentIndex(0);
                  setShowSummary(false);
                }}
                className="rounded-full border border-white/25 bg-white/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
              >
                Revoir mes réponses
              </Button>
              {onClose ? (
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full border border-white/25 bg-transparent px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
                >
                  Fermer
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const progressValue = (answeredCount / questions.length) * 100;

  return (
    <div className={cn("space-y-8", fullscreen && "min-h-[80vh]", className)}>
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={goPrevious}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {currentIndex === 0 ? "Retour" : "Précédent"}
        </Button>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              Question {currentIndex + 1}/{questions.length}
            </span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#131313] via-[#0B0B0B] to-[#050505]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestion?.id}
            variants={questionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-10 p-10 text-white"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Immersif • Typeform style</p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{currentQuestion?.title}</h2>
              {currentQuestion?.helper ? (
                <p className="max-w-2xl text-sm text-white/60">{currentQuestion.helper}</p>
              ) : null}
            </div>

            {currentQuestion ? (
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onSelectSingle={handleSingleSelect}
                onSelectMultiple={handleMultipleSelect}
                onScaleChange={handleScaleChange}
                onTextChange={handleTextChange}
              />
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                onClick={goNext}
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
              >
                {currentIndex === questions.length - 1 ? "Finaliser" : "Suivant"}
                {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

type QuestionRendererProps = {
  question: TestQuestion;
  answer: unknown;
  onSelectSingle: (questionId: string, value: string) => void;
  onSelectMultiple: (questionId: string, value: string) => void;
  onScaleChange: (questionId: string, value: number) => void;
  onTextChange: (questionId: string, value: string) => void;
};

function QuestionRenderer({
  question,
  answer,
  onSelectSingle,
  onSelectMultiple,
  onScaleChange,
  onTextChange,
}: QuestionRendererProps) {
  if (question.type === "single") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {(question.options ?? []).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectSingle(question.id, option.value)}
            className={cn(
              "group flex min-h-[80px] items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-left text-sm text-white/80 transition duration-300 hover:border-white/35 hover:bg-white/10",
              answer === option.value && "border-white/60 bg-white/15 text-white",
            )}
          >
            <span>{option.label}</span>
            <Check
              className={cn(
                "h-4 w-4 text-white/40 opacity-0 transition duration-300",
                answer === option.value && "opacity-100 text-white",
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(answer) ? answer : [];
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {(question.options ?? []).map((option) => {
          const isActive = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectMultiple(question.id, option.value)}
              className={cn(
                "group flex min-h-[80px] items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-left text-sm text-white/80 transition duration-300 hover:border-white/35 hover:bg-white/10",
                isActive && "border-white/60 bg-white/15 text-white",
              )}
            >
              <span>{option.label}</span>
              <Check
                className={cn(
                  "h-4 w-4 text-white/40 opacity-0 transition duration-300",
                  isActive && "opacity-100 text-white",
                )}
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
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
          <span>{scale.leftLabel ?? "Faible"}</span>
          <span>{scale.rightLabel ?? "Elevé"}</span>
        </div>
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={scale.step ?? 1}
          value={currentValue}
          onChange={(event) => onScaleChange(question.id, Number(event.target.value))}
          className="h-2 w-full appearance-none rounded-full bg-white/10 accent-[#FF512F]"
        />
        <p className="text-sm text-white/60">Intensité : {currentValue}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={5}
        className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onTextChange(question.id, event.target.value)}
        placeholder={question.placeholder ?? "Expliquez votre réponse"}
      />
      <p className="text-xs text-white/40">Minimum 3 caractères</p>
    </div>
  );
}

