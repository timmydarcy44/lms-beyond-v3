"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X as XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FlashcardItem = {
  id: string;
  front: string;
  back: string;
};

export type FlashcardPlayerProps = {
  cards: FlashcardItem[];
  className?: string;
  /** Active a typing-based validation (optional). */
  typingMode?: boolean;
  onClose?: () => void;
  trackingContext?: {
    courseId: string;
    scopeId: string;
  };
};

const FLASH_MS = 520;

export function FlashcardPlayer({ cards, className, typingMode, onClose, trackingContext }: FlashcardPlayerProps) {
  const total = cards.length;
  const [index, setIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [screenFlash, setScreenFlash] = useState<null | "green" | "red">(null);
  const [flipped, setFlipped] = useState(false);

  const startedAtRef = useRef(new Date().toISOString());
  const knownCountRef = useRef(0);
  const unknownCountRef = useRef(0);
  const cardResultsRef = useRef<Array<{ cardId: string; result: "known" | "unknown" }>>([]);
  const persistedRef = useRef(false);

  const persistSession = useCallback(async () => {
    if (!trackingContext || persistedRef.current) return;
    if (knownCountRef.current === 0 && unknownCountRef.current === 0) return;
    persistedRef.current = true;
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000),
    );
    try {
      await fetch("/api/learner/flashcard-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: trackingContext.courseId,
          scopeId: trackingContext.scopeId,
          totalCards: total,
          knownCount: knownCountRef.current,
          unknownCount: unknownCountRef.current,
          cardResults: cardResultsRef.current,
          durationSeconds,
          startedAt: startedAtRef.current,
        }),
      });
    } catch {
      persistedRef.current = false;
    }
  }, [trackingContext, total]);

  const handleClose = useCallback(() => {
    void persistSession().finally(() => onClose?.());
  }, [onClose, persistSession]);

  const current = cards[index] ?? null;
  const progressPct = total > 0 ? Math.round((Math.min(reviewedCount, total) / total) * 100) : 0;

  const canSubmitTyping = useMemo(() => {
    if (!typingMode) return true;
    return true;
  }, [typingMode]);

  const flashAndNext = useCallback(
    (result: "known" | "unknown") => {
      if (!current || screenFlash) return;
      cardResultsRef.current.push({ cardId: current.id, result });
      if (result === "known") knownCountRef.current += 1;
      else unknownCountRef.current += 1;
      setReviewedCount((c) => Math.min(c + 1, total));
      setScreenFlash(result === "known" ? "green" : "red");
      window.setTimeout(() => {
        setScreenFlash(null);
        setFlipped(false);
        const nextIndex = Math.min(index + 1, total);
        setIndex(nextIndex);
        if (nextIndex >= total) void persistSession();
      }, FLASH_MS);
    },
    [current, total, screenFlash, index, persistSession],
  );

  const submitKnown = useCallback(() => flashAndNext("known"), [flashAndNext]);
  const submitUnknown = useCallback(() => flashAndNext("unknown"), [flashAndNext]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!current || screenFlash) return;
      if (!flipped) return;
      if (e.key === "ArrowLeft") flashAndNext("unknown");
      if (e.key === "ArrowRight") flashAndNext("known");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, flipped, flashAndNext, screenFlash]);

  if (!total) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[500] flex flex-col items-center justify-center overflow-hidden bg-[#061027] px-6 text-white",
          className,
        )}
      >
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            className="absolute right-4 top-4 z-[630] rounded-full bg-black/40 text-white hover:bg-black/55"
            onClick={handleClose}
          >
            Fermer
          </Button>
        ) : null}
        <p className="text-center text-lg text-slate-300">Aucune flashcard pour cet élément.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[500] flex flex-col overflow-hidden bg-[#061027] text-white",
          className,
        )}
      >
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            className="absolute right-4 top-4 z-[630] rounded-full bg-black/40 text-white hover:bg-black/55"
            onClick={handleClose}
          >
            Fermer
          </Button>
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Beyond Flash</p>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">
              Cartes révisées : {reviewedCount}/{total}
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                onClick={() => {
                  setIndex(0);
                  setReviewedCount(0);
                  setFlipped(false);
                }}
                className="h-12 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-8 font-semibold text-white hover:opacity-95"
              >
                Recommencer le paquet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[500] flex flex-col overflow-hidden bg-[#061027] text-white",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.06),transparent_55%)]" />

      {onClose ? (
        <Button
          type="button"
          variant="ghost"
          className="absolute right-4 top-4 z-[520] rounded-full bg-black/40 text-white hover:bg-black/55"
          onClick={onClose}
        >
          Fermer
        </Button>
      ) : null}

      <AnimatePresence>
        {screenFlash ? (
          <motion.div
            key={screenFlash}
            role="presentation"
            className="pointer-events-none fixed inset-0 z-[610] flex items-center justify-center"
            style={{ backgroundColor: screenFlash === "green" ? "#22c55e" : "#dc2626" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
          >
            {screenFlash === "green" ? (
              <Check className="h-28 w-28 shrink-0 text-white" strokeWidth={3} aria-hidden />
            ) : (
              <XIcon className="h-28 w-28 shrink-0 text-white" strokeWidth={3} aria-hidden />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-8 pt-14 sm:px-8">
        <div className="mx-auto w-full max-w-3xl shrink-0">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            <span>Beyond Flash</span>
            <span className="tabular-nums">
              {index + 1}/{total}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              className="relative flex w-full max-w-3xl flex-1 flex-col items-center justify-center"
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => !screenFlash && setFlipped((v) => !v)}
                onKeyDown={(e) => {
                  if (screenFlash) return;
                  if (e.key === "Enter" || e.key === " ") setFlipped((v) => !v);
                }}
                className={cn(
                  "relative w-full max-w-3xl cursor-pointer select-none rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md",
                  "min-h-[48vh] max-h-[62vh]",
                )}
                style={{ perspective: 1200 }}
              >
                <motion.div
                  className="relative h-full min-h-[48vh] w-full rounded-[2rem]"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-[2rem] px-8 py-10"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Question</p>
                    <p className="mt-5 text-balance text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-3xl whitespace-pre-wrap">
                      {current.front}
                    </p>
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                      Clique sur la carte pour révéler
                    </p>
                  </div>

                  <div
                    className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-[2rem] px-8 py-10"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Réponse</p>
                    <p className="mt-5 text-balance text-xl font-semibold leading-relaxed text-slate-100 sm:text-2xl whitespace-pre-wrap">
                      {current.back}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {flipped && !screenFlash ? (
          <div className="mx-auto mt-4 grid w-full max-w-3xl shrink-0 grid-cols-2 gap-3 px-1">
            <Button
              type="button"
              variant="outline"
              onClick={submitUnknown}
              className="h-14 rounded-2xl border-rose-400/40 bg-white/5 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-5 w-5 text-rose-300" />
              Je ne savais pas
            </Button>
            <Button
              type="button"
              onClick={submitKnown}
              disabled={!canSubmitTyping}
              className="h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 font-semibold text-white hover:opacity-95"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Je savais
            </Button>
          </div>
        ) : !screenFlash ? (
          <div className="mx-auto mt-4 shrink-0 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Retourne la carte pour t’auto-évaluer
          </div>
        ) : null}
      </div>
    </div>
  );
}
