"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Shuffle, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearnerFlashcard } from "@/lib/queries/apprenant";
import { useTheme } from "next-themes";

type LessonFlashcardsProps = {
  flashcards: LearnerFlashcard[];
};

export function LessonFlashcardsPanel({ flashcards }: LessonFlashcardsProps) {
  // Adapter les flashcards : utiliser front/back ou question/answer
  const sanitized = useMemo(() => {
    return flashcards.filter((card) => {
      const hasQuestion = (card as any).question || (card as any).front;
      const hasAnswer = (card as any).answer || (card as any).back;
      return hasQuestion && hasAnswer;
    }).map((card) => ({
      ...card,
      question: (card as any).question || (card as any).front,
      answer: (card as any).answer || (card as any).back,
    }));
  }, [flashcards]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  if (!sanitized.length) {
    return null;
  }

  const current = sanitized[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % sanitized.length);
    setShowAnswer(false);
  };

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * sanitized.length);
    setIndex(randomIndex);
    setShowAnswer(false);
  };

  return (
    <div
      className={cn(
        "space-y-5 rounded-3xl border p-6 shadow-[0_35px_110px_-55px_rgba(15,23,42,0.8)]",
        isLight
          ? "border-slate-200 bg-white text-slate-800 shadow-slate-200/60"
          : "border-white/10 bg-gradient-to-br from-[#0d1221]/85 via-[#131a2d]/85 to-[#1a2236]/85 text-white",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.35em]", isLight ? "text-slate-400" : "text-white/60")}>Flashcards intelligentes</p>
          <h3 className={cn("text-xl font-semibold", isLight ? "text-slate-900" : "text-white")}>
            Récapitulatif express du chapitre
          </h3>
        </div>
        <div className={cn("flex items-center gap-2 text-xs", isLight ? "text-slate-500" : "text-white/50")}
        >
          <Sparkles className="h-4 w-4" />
          <span>{sanitized.length} carte(s) générée(s) automatiquement</span>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border px-6 py-8 shadow-inner",
          isLight
            ? "border-slate-200 bg-slate-50 text-slate-800 shadow-slate-200/70"
            : "border-white/10 bg-white/5 text-white shadow-black/30",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60",
            isLight
              ? "bg-[radial-gradient(circle_at_top,_rgba(0,198,255,0.15),_transparent_60%)]"
              : "bg-[radial-gradient(circle_at_top,_rgba(255,81,47,0.25),_transparent_60%)]",
          )}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + (showAnswer ? "answer" : "question")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative space-y-4"
          >
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]",
                isLight ? "bg-slate-200 text-slate-700" : "bg-white/10 text-white/80",
              )}
            >
              {showAnswer ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              <span>{showAnswer ? "Réponse" : "Question"}</span>
            </div>
            <p
              className={cn(
                "text-lg leading-relaxed",
                showAnswer ? (isLight ? "text-slate-700" : "text-white/85") : isLight ? "text-slate-900" : "text-white",
              )}
            >
              {showAnswer ? (current as any).answer : (current as any).question}
            </p>
            {(current as any).tags?.length ? (
              <div className={cn("flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em]", isLight ? "text-slate-400" : "text-white/50")}
              >
                {((current as any).tags ?? []).map((tag: any) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-3 py-1",
                      isLight ? "bg-slate-200 text-slate-700" : "bg-white/10 text-white/70",
                    )}
                  >
                    {tag}
                  </span>
                ))}
                {(current as any).difficulty ? (
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1",
                      isLight ? "border-slate-300 text-slate-600" : "border-white/10 text-white/60",
                    )}
                  >
                    {(current as any).difficulty}
                  </span>
                ) : null}
              </div>
            ) : (current as any).difficulty ? (
              <div className={cn("text-[11px] uppercase tracking-[0.25em]", isLight ? "text-slate-400" : "text-white/50")}
              >
                <span
                  className={cn(
                    "rounded-full border px-3 py-1",
                    isLight ? "border-slate-300 text-slate-600" : "border-white/10 text-white/60",
                  )}
                >
                  {(current as any).difficulty}
                </span>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={cn("text-xs uppercase tracking-[0.35em]", isLight ? "text-slate-400" : "text-white/50")}
        >
          Carte {index + 1} / {sanitized.length}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "rounded-full text-xs font-semibold uppercase tracking-[0.3em]",
              isLight
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20",
              showAnswer && (isLight ? "border-slate-300 bg-slate-100" : "border-white/60 bg-white/20"),
            )}
            onClick={() => setShowAnswer((prev) => !prev)}
          >
            {showAnswer ? "Masquer" : "Révéler"} la réponse
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-full border text-xs font-semibold uppercase tracking-[0.3em]",
              isLight
                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                : "border-white/15 text-white/80 hover:bg-white/10",
            )}
            onClick={handleShuffle}
          >
            <Shuffle className="mr-2 h-3.5 w-3.5" /> Mélanger
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-full border text-xs font-semibold uppercase tracking-[0.3em]",
              isLight
                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                : "border-white/15 text-white/80 hover:bg-white/10",
            )}
            onClick={handleNext}
          >
            Suivante
          </Button>
        </div>
      </div>
    </div>
  );
}

