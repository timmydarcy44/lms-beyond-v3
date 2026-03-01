"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LearnerFlashcard } from "@/lib/queries/apprenant";

type FlashcardsActivationProps = {
  flashcards: LearnerFlashcard[];
  theme?: "light" | "dark";
};

export function FlashcardsActivation({ flashcards, theme = "dark" }: FlashcardsActivationProps) {
  const sanitized = useMemo(() => {
    return flashcards
      .filter((card) => {
        const hasQuestion = (card as any).question || (card as any).front;
        const hasAnswer = (card as any).answer || (card as any).back;
        return hasQuestion && hasAnswer;
      })
      .map((card) => ({
        ...card,
        question: (card as any).question || (card as any).front,
        answer: (card as any).answer || (card as any).back,
      }));
  }, [flashcards]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const isLight = theme === "light";

  useEffect(() => {
    if (sanitized.length === 0) {
      setActiveIndex(null);
      return;
    }
    setActiveIndex((prev) => {
      if (prev !== null && prev < sanitized.length) {
        return prev;
      }
      return null;
    });
  }, [sanitized]);

  if (sanitized.length === 0) {
    return null;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setActiveIndex(null);
    setShowAnswer(false);
    setQuestionModalOpen(false);
  };

  const handleSelectCard = (index: number) => {
    setActiveIndex(index);
    setShowAnswer(false);
    setQuestionModalOpen(true);
  };

  const cardsContainerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.94 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.9, rotate: -4 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <div className="space-y-6">
      {/* CTA pour activer les flashcards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border p-8 shadow-[0_35px_110px_-55px_rgba(15,23,42,0.35)] transition",
          isLight
            ? "border-slate-200 bg-gradient-to-br from-white via-white to-slate-100 text-slate-900"
            : "border-white/10 bg-gradient-to-br from-[#0d1221]/85 via-[#131a2d]/85 to-[#1a2236]/85 text-white"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60",
            isLight
              ? "bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_65%)]"
              : "bg-[radial-gradient(circle_at_top,_rgba(255,81,47,0.25),_transparent_60%)]",
          )}
        />
        <div className="relative flex flex-col items-center justify-center gap-6 py-8 text-center">
          <div
            className={cn(
              "rounded-full p-4 shadow-lg transition",
              isLight
                ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white"
                : "bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white",
            )}
          >
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="apprenant-force-text text-2xl font-semibold text-black">
              {sanitized.length} flashcard{sanitized.length > 1 ? "s" : ""} disponible{sanitized.length > 1 ? "s" : ""}
            </h3>
            <p className="apprenant-force-text max-w-md text-sm text-black">
              Activez vos flashcards pour réviser le contenu de ce chapitre de manière interactive
            </p>
          </div>
          <Button
            onClick={handleOpenModal}
            className={cn(
              "rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em]",
              isLight
                ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.45)] hover:opacity-90"
                : "bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white hover:opacity-90",
            )}
          >
            <Play className="mr-2 h-4 w-4" />
            Activer mes flashcards
          </Button>
        </div>
      </motion.div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setActiveIndex(null);
            setShowAnswer(false);
          }
        }}
      >
        <DialogContent
          className="w-full rounded-[28px] border border-[#1f1f25] bg-[#050507] px-16 py-14 text-white shadow-[0_60px_180px_-70px_rgba(0,0,0,0.75)] overflow-hidden"
          style={{ width: "95vw", maxWidth: "95vw", maxHeight: "85vh" }}
        >
          <DialogHeader className="space-y-3 text-left text-white">
            <DialogTitle className="text-3xl font-semibold tracking-tight text-white">
              Mes flashcards
            </DialogTitle>
            <DialogDescription className="text-base text-white/70">
              Sélectionnez une carte pour afficher la question, puis cliquez sur &ldquo;Voir la réponse&rdquo; pour la révéler.
            </DialogDescription>
          </DialogHeader>

          <motion.div
              variants={cardsContainerVariants}
              initial="hidden"
              animate="show"
            className="grid grid-cols-2 gap-4 overflow-auto pr-2 sm:grid-cols-3 lg:grid-cols-4 max-h-[60vh]"
            >
            {sanitized.map((card, index) => (
              <motion.button
                key={card.id ?? index}
                variants={cardVariants}
                type="button"
                onClick={() => handleSelectCard(index)}
                className={cn(
                  "relative flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(140deg,#10101a,#0b0b12)] text-white transition-transform duration-300",
                  "hover:-translate-y-2 hover:border-orange-300/70"
                )}
                style={{ perspective: 1200 }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff7a1a]/18 via-transparent to-[#ff7a1a]/18" />
                <div className="relative flex flex-col items-center gap-3">
                  <Sparkles className="h-6 w-6 text-orange-200" />
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                    Carte {index + 1}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={questionModalOpen && activeIndex !== null}
        onOpenChange={(open) => {
          setQuestionModalOpen(open);
          if (!open) {
            setShowAnswer(false);
          }
        }}
      >
        <DialogContent className="w-full max-w-[480px] rounded-[24px] border border-white/10 bg-[#0b0b12] px-10 py-8 text-white shadow-[0_35px_110px_-55px_rgba(0,0,0,0.7)]">
          {activeIndex !== null ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">
                  Question
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-white/80">
                  {sanitized[activeIndex].question as string}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <Button
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="w-full rounded-full bg-[#ff7a1a] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-black shadow-[0_18px_55px_-35px_rgba(255,138,0,0.6)] hover:bg-[#ffa94d]"
                >
                  {showAnswer ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Masquer la réponse
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir la réponse
                    </>
                  )}
                </Button>

                {showAnswer ? (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/85"
                  >
                    {(sanitized[activeIndex] as any).answer}
                  </motion.p>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


