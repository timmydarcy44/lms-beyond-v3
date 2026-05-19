"use client";

import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type InterviewReadinessGateProps = {
  chapterTitle: string;
  courseTitle?: string;
  onReady: () => void;
  onRevise: () => void;
  className?: string;
};

const CHOICE_STYLES = {
  ready: {
    letter: "A",
    label: "Prêt !",
    sub: "Je lance l'entretien expérientiel",
    ring: "ring-amber-400/60",
    hover: "hover:border-amber-400 hover:shadow-[0_0_32px_rgba(251,191,36,0.35)]",
    grad: "from-amber-500/20 via-amber-400/10 to-transparent",
  },
  revise: {
    letter: "B",
    label: "Je veux encore réviser avant",
    sub: "Revoir le chapitre ou tester mes acquis",
    ring: "ring-sky-400/50",
    hover: "hover:border-sky-400 hover:shadow-[0_0_32px_rgba(56,189,248,0.28)]",
    grad: "from-sky-500/15 via-indigo-500/10 to-transparent",
  },
} as const;

function ReadinessChoice({
  variant,
  onClick,
}: {
  variant: keyof typeof CHOICE_STYLES;
  onClick: () => void;
}) {
  const cfg = CHOICE_STYLES[variant];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-left transition sm:p-5",
        "ring-2 ring-transparent",
        cfg.hover,
        cfg.ring,
      )}
    >
      <motion.span
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-xl font-black text-white shadow-inner sm:h-16 sm:w-16 sm:text-2xl",
          variant === "ready" ? "text-amber-300" : "text-sky-300",
        )}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {cfg.letter}
      </motion.span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="text-base font-bold tracking-tight text-white sm:text-lg">{cfg.label}</span>
        <span className="mt-1 text-sm text-white/55">{cfg.sub}</span>
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-0 transition group-hover:opacity-100",
          cfg.grad,
        )}
        aria-hidden
      />
    </motion.button>
  );
}

export function InterviewReadinessGate({
  chapterTitle,
  courseTitle,
  onReady,
  onRevise,
  className,
}: InterviewReadinessGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto max-w-2xl overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-b from-[#1a0a2e] via-[#12081f] to-[#050208] p-6 shadow-2xl sm:p-8",
        className,
      )}
    >
      <motion.div
        className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/15"
        animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.2)", "0 0 40px rgba(124,58,237,0.45)", "0 0 20px rgba(124,58,237,0.2)"] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Sparkles className="h-6 w-6 text-violet-200" />
      </motion.div>

      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-violet-300/80">
        Entretien expérientiel
      </p>

      <div className="mt-4 space-y-3 text-center">
        <p className="text-lg leading-relaxed text-white/90 sm:text-xl">
          Vous venez de voir le chapitre sur{" "}
          <span className="font-semibold text-violet-200">{chapterTitle}</span>
          {courseTitle ? (
            <span className="block mt-2 text-sm text-white/50">Formation : {courseTitle}</span>
          ) : null}
        </p>
        <p className="text-base text-white/70">
          Vous allez passer l&apos;entretien expérientiel : un échange guidé pour relier ce que vous avez appris à
          votre pratique.
        </p>
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-amber-200/90">
          <BookOpen className="h-4 w-4 shrink-0" />
          Êtes-vous prêt ?
        </p>
      </div>

      <motion.div
        className="mt-8 grid gap-3 sm:gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12 } },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}>
          <ReadinessChoice variant="ready" onClick={onReady} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } }}>
          <ReadinessChoice variant="revise" onClick={onRevise} />
        </motion.div>
      </motion.div>

      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-white/30">
        Choisissez une réponse pour continuer
      </p>
    </motion.div>
  );
}
