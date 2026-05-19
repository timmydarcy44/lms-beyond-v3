"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

type InterviewCinematicTransitionProps = {
  active: boolean;
  chapterTitle?: string;
  onComplete: () => void;
};

export function InterviewCinematicTransition({
  active,
  chapterTitle,
  onComplete,
}: InterviewCinematicTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "hold" | "out">("idle");

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }
    setPhase("in");
    const hold = window.setTimeout(() => setPhase("hold"), 400);
    const out = window.setTimeout(() => setPhase("out"), 2200);
    const done = window.setTimeout(() => {
      onComplete();
    }, 3000);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && phase !== "idle" ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050208]"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "out" ? 0.7 : 0.35 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,58,237,0.45) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(236,72,153,0.25) 0%, transparent 50%)",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-[length:200%_200%] opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            }}
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />

          <motion.div
            className="relative z-10 max-w-lg px-8 text-center"
            initial={{ opacity: 0, scale: 0.92, y: 24, filter: "blur(12px)" }}
            animate={{
              opacity: phase === "out" ? 0 : 1,
              scale: phase === "out" ? 1.04 : 1,
              y: phase === "out" ? -12 : 0,
              filter: phase === "out" ? "blur(8px)" : "blur(0px)",
            }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/20 shadow-[0_0_60px_rgba(124,58,237,0.5)]"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <MessageCircle className="h-8 w-8 text-violet-200" />
            </motion.div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-violet-300/90">
              Entretien expérientiel
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Je me teste
            </h2>
            {chapterTitle ? (
              <p className="mt-3 text-sm leading-relaxed text-white/65">{chapterTitle}</p>
            ) : null}
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-white/40">Préparation…</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
