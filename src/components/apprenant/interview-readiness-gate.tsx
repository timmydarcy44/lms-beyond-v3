"use client";

import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { InterviewPlayTheme, InterviewStyle } from "@/lib/apprenant/interview-audience";
import { interviewBlockTitle } from "@/lib/apprenant/interview-audience";

type InterviewReadinessGateProps = {
  chapterTitle: string;
  courseTitle?: string;
  interviewObjectives?: string;
  onReady: () => void;
  onRevise: () => void;
  className?: string;
  theme?: InterviewPlayTheme;
  interviewStyle?: InterviewStyle;
};

function parseObjectivesList(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-–—*]+/, "").trim())
    .filter(Boolean);
}

const CHOICE_STYLES = {
  ready: {
    letter: "A",
    label: "Prêt !",
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
  isJessica,
  readySub,
}: {
  variant: keyof typeof CHOICE_STYLES;
  onClick: () => void;
  isJessica: boolean;
  readySub?: string;
}) {
  const cfg = CHOICE_STYLES[variant];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition sm:p-5",
        "ring-2 ring-transparent",
        isJessica
          ? "border-[#D2B48C]/45 bg-white/60 hover:border-[#C6A664] hover:shadow-[0_0_24px_rgba(198,166,100,0.25)]"
          : cn("border-white/15 bg-white/5", cfg.hover, cfg.ring),
      )}
    >
      <motion.span
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-xl font-black shadow-inner sm:h-16 sm:w-16 sm:text-2xl",
          isJessica
            ? "border-[#C6A664]/40 bg-[#F0EBE3] text-[#B8860B]"
            : cn(
                "border-white/20 bg-black/40 text-white",
                variant === "ready" ? "text-amber-300" : "text-sky-300",
              ),
        )}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {cfg.letter}
      </motion.span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span
          className={
            isJessica
              ? "text-base font-bold tracking-tight text-[#2F2A25] sm:text-lg"
              : "text-base font-bold tracking-tight text-white sm:text-lg"
          }
        >
          {cfg.label}
        </span>
        <span className={isJessica ? "mt-1 text-sm text-[#8B4513]/75" : "mt-1 text-sm text-white/55"}>
          {variant === "ready"
            ? readySub ?? "Je lance l'entretien expérientiel"
            : "sub" in cfg
              ? cfg.sub
              : ""}
        </span>
      </span>
      {!isJessica ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-0 transition group-hover:opacity-100",
            cfg.grad,
          )}
          aria-hidden
        />
      ) : null}
    </motion.button>
  );
}

export function InterviewReadinessGate({
  chapterTitle,
  courseTitle,
  interviewObjectives,
  onReady,
  onRevise,
  className,
  theme = "edge",
  interviewStyle = "experiential",
}: InterviewReadinessGateProps) {
  const isJessica = theme === "jessica";
  const isCoaching = interviewStyle === "coaching";
  const blockTitle = interviewBlockTitle(interviewStyle);
  const objectives = parseObjectivesList(String(interviewObjectives ?? "").trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8",
        isJessica
          ? "border-[#D2B48C]/45 bg-gradient-to-b from-[#F0EBE3] via-[#F8F5F0] to-[#F0EBE3] text-[#2F2A25]"
          : "border-violet-500/25 bg-gradient-to-b from-[#1a0a2e] via-[#12081f] to-[#050208] text-white",
        className,
      )}
    >
      <motion.div
        className={
          isJessica
            ? "mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6A664]/35 bg-[#C6A664]/15"
            : "mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/15"
        }
        animate={
          isJessica
            ? {
                boxShadow: [
                  "0 0 20px rgba(198,166,100,0.2)",
                  "0 0 40px rgba(198,166,100,0.35)",
                  "0 0 20px rgba(198,166,100,0.2)",
                ],
              }
            : {
                boxShadow: [
                  "0 0 20px rgba(124,58,237,0.2)",
                  "0 0 40px rgba(124,58,237,0.45)",
                  "0 0 20px rgba(124,58,237,0.2)",
                ],
              }
        }
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Sparkles className={isJessica ? "h-6 w-6 text-[#B8860B]" : "h-6 w-6 text-violet-200"} />
      </motion.div>

      <p
        className={
          isJessica
            ? "text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#B8860B]"
            : "text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-violet-300/80"
        }
      >
        {blockTitle}
      </p>

      <div className="mt-4 space-y-3 text-center">
        <p className={isJessica ? "text-lg leading-relaxed text-[#2F2A25] sm:text-xl" : "text-lg leading-relaxed text-white/90 sm:text-xl"}>
          {isCoaching ? (
            <>
              Vous allez être coaché sur le chapitre{" "}
              <span className={isJessica ? "font-semibold text-[#B8860B]" : "font-semibold text-violet-200"}>
                {chapterTitle}
              </span>
            </>
          ) : (
            <>
              Vous venez de voir le chapitre sur{" "}
              <span className={isJessica ? "font-semibold text-[#B8860B]" : "font-semibold text-violet-200"}>
                {chapterTitle}
              </span>
            </>
          )}
          {courseTitle ? (
            <span className={isJessica ? "mt-2 block text-sm text-[#8B4513]/70" : "mt-2 block text-sm text-white/50"}>
              Formation : {courseTitle}
            </span>
          ) : null}
        </p>
        <p className={isJessica ? "text-base text-[#8B4513]/80" : "text-base text-white/70"}>
          {isCoaching
            ? "Un échange guidé pour vérifier votre compréhension du cours, sans supposer de situation personnelle."
            : isJessica
              ? "Un échange guidé pour relier ce que vous avez appris à votre vécu (selon la thématique choisie par le formateur)."
              : "Vous allez passer l'entretien expérientiel : un échange guidé pour relier ce que vous avez appris à votre pratique."}
        </p>
        {objectives.length > 0 ? (
          <div
            className={
              isJessica
                ? "mx-auto mt-4 max-w-md rounded-2xl border border-[#C6A664]/30 bg-white/50 px-4 py-3 text-left"
                : "mx-auto mt-4 max-w-md rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-left"
            }
          >
            <p
              className={
                isJessica
                  ? "text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B8860B]"
                  : "text-[10px] font-semibold uppercase tracking-[0.32em] text-violet-200/80"
              }
            >
              Objectifs de cet entretien
            </p>
            <ul className={isJessica ? "mt-2 space-y-1.5 text-sm text-[#2F2A25]" : "mt-2 space-y-1.5 text-sm text-white/80"}>
              {objectives.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className={isJessica ? "text-[#C6A664]" : "text-violet-300"} aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p
          className={
            isJessica
              ? "flex items-center justify-center gap-2 text-sm font-medium text-[#B8860B]"
              : "flex items-center justify-center gap-2 text-sm font-medium text-amber-200/90"
          }
        >
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
          <ReadinessChoice
            variant="ready"
            onClick={onReady}
            isJessica={isJessica}
            readySub={
              isCoaching ? "Je lance le coaching sur le cours" : "Je lance l'entretien expérientiel"
            }
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } }}>
          <ReadinessChoice variant="revise" onClick={onRevise} isJessica={isJessica} />
        </motion.div>
      </motion.div>

      <p
        className={
          isJessica
            ? "mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-[#8B4513]/45"
            : "mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-white/30"
        }
      >
        Choisissez une réponse pour continuer
      </p>
    </motion.div>
  );
}
