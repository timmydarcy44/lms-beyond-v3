"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearnerFlashcard } from "@/lib/queries/apprenant";
import { LessonFlashcardsPanel } from "./lesson-flashcards";

type FlashcardsActivationProps = {
  flashcards: LearnerFlashcard[];
};

export function FlashcardsActivation({ flashcards }: FlashcardsActivationProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [showCards, setShowCards] = useState(false);

  if (flashcards.length === 0) {
    return null;
  }

  const handleActivate = () => {
    setIsActivated(true);
    // Délai pour l'animation d'apparition des cartes
    setTimeout(() => {
      setShowCards(true);
    }, 300);
  };

  if (isActivated && showCards) {
    return <LessonFlashcardsPanel flashcards={flashcards} />;
  }

  return (
    <div className="space-y-6">
      {/* CTA pour activer les flashcards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border p-8 shadow-[0_35px_110px_-55px_rgba(15,23,42,0.8)]",
          "border-white/10 bg-gradient-to-br from-[#0d1221]/85 via-[#131a2d]/85 to-[#1a2236]/85 text-white"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(255,81,47,0.25),_transparent_60%)]"
        />
        <div className="relative flex flex-col items-center justify-center gap-6 py-8 text-center">
          <div className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] p-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-white">
              {flashcards.length} flashcard{flashcards.length > 1 ? "s" : ""} disponible{flashcards.length > 1 ? "s" : ""}
            </h3>
            <p className="text-sm text-white/70 max-w-md">
              Activez vos flashcards pour réviser le contenu de ce chapitre de manière interactive
            </p>
          </div>
          <Button
            onClick={handleActivate}
            className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90"
          >
            <Play className="mr-2 h-4 w-4" />
            Activer mes flashcards
          </Button>
        </div>
      </motion.div>

      {/* Animation des cartes qui apparaissent (face cachée) */}
      <AnimatePresence>
        {isActivated && !showCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {flashcards.slice(0, 8).map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: 0,
                  transition: {
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: "easeOut"
                  }
                }}
                className={cn(
                  "aspect-[3/4] rounded-2xl border-2 border-white/20 bg-gradient-to-br from-[#1a2236] to-[#0d1221]",
                  "flex items-center justify-center shadow-lg",
                  "backface-hidden perspective-1000"
                )}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="text-center space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-white/40" />
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Carte {index + 1}
                  </p>
                </div>
              </motion.div>
            ))}
            {flashcards.length > 8 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: {
                    delay: 8 * 0.1,
                    duration: 0.5,
                    ease: "easeOut"
                  }
                }}
                className={cn(
                  "aspect-[3/4] rounded-2xl border-2 border-white/20 bg-gradient-to-br from-[#1a2236] to-[#0d1221]",
                  "flex items-center justify-center shadow-lg"
                )}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-white/60">+{flashcards.length - 8}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">
                    Autres
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

