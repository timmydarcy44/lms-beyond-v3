"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FocusModeProps {
  text: string;
  onClose: () => void;
}

const getSentences = (text: string) => {
  if (!text) return [];
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return matches
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      const words = sentence.split(/\s+/).filter(Boolean);
      return words.length >= 3;
    });
};

export function FocusMode({ text, onClose }: FocusModeProps) {
  const sentences = useMemo(() => getSentences(text), [text]);
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIndex(0);
  }, [text]);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, [index]);

  const total = sentences.length;
  const isComplete = total > 0 && index >= total;
  const current = sentences[index] || "";

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, total));
  };

  const goPrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchStartX - endX;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      goNext();
    } else {
      goPrev();
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0A0F] text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40">
          Focus
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 pt-3">
        <div className="flex items-center justify-between text-xs text-white/50 mb-2">
          <span>{total === 0 ? "0" : Math.min(index + 1, total)}/{total}</span>
          <span>Phrase</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6D28D9] rounded-full transition-all"
            style={{ width: total ? `${(Math.min(index + 1, total) / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 text-center">
        {total === 0 ? (
          <p className="text-white/40 text-lg">
            Aucun texte disponible.
          </p>
        ) : isComplete ? (
          <div className={`transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-2xl sm:text-3xl leading-relaxed mb-6">
              Bravo, tu as lu tout le cours !
            </p>
            <Button
              onClick={onClose}
              className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
            >
              Retour
            </Button>
          </div>
        ) : (
          <p className={`text-2xl sm:text-3xl leading-relaxed max-w-3xl transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            {current}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-6 pb-6">
        <Button
          onClick={goPrev}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
        <Button
          onClick={goNext}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
          disabled={total === 0 || index >= total}
        >
          {index === total - 1 ? "Terminer" : "Suivant"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
