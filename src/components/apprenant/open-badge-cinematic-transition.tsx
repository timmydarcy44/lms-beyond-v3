"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award } from "lucide-react";

type OpenBadgeCinematicTransitionProps = {
  active: boolean;
  badgeName?: string;
  badgeImageUrl?: string | null;
  onComplete: () => void;
};

export function OpenBadgeCinematicTransition({
  active,
  badgeName,
  badgeImageUrl,
  onComplete,
}: OpenBadgeCinematicTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "hold" | "out">("idle");

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }
    setPhase("in");
    const hold = window.setTimeout(() => setPhase("hold"), 320);
    const out = window.setTimeout(() => setPhase("out"), 1100);
    const done = window.setTimeout(() => onComplete(), 1450);
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
          className="fixed inset-0 z-[300] flex min-h-dvh items-center justify-center overflow-hidden bg-[#030303]"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "out" ? 0.55 : 0.4 }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(255,59,48,0.35) 0%, transparent 58%), radial-gradient(ellipse 45% 35% at 80% 75%, rgba(255,255,255,0.06) 0%, transparent 50%)",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-[length:220%_220%] opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.12) 50%, transparent 58%)",
            }}
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />

          <motion.div
            className="relative z-10 max-w-md px-8 text-center"
            initial={{ opacity: 0, scale: 0.88, y: 28, filter: "blur(14px)" }}
            animate={{
              opacity: phase === "out" ? 0 : 1,
              scale: phase === "out" ? 1.05 : 1,
              y: phase === "out" ? -16 : 0,
              filter: phase === "out" ? "blur(10px)" : "blur(0px)",
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_0_80px_rgba(255,59,48,0.35)]"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {badgeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badgeImageUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <Award className="h-12 w-12 text-[#FF3B30]" strokeWidth={1.25} />
              )}
            </motion.div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-[#FF3B30]/90">
              Open Badge
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-3xl">
              {badgeName?.trim() || "Certification"}
            </h2>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/45">
              Préparation de l&apos;épreuve…
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
