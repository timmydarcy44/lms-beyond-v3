"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DISC_QUESTIONS,
  DISC_QUESTION_COUNT,
  type DiscIpsativeResponse,
  type DiscLabel,
  type DiscQuestionOption,
} from "@/lib/disc/disc-questions";
import {
  applyIpsativeAnswer,
  emptyDiscRawScores,
  type DiscRawScores,
} from "@/lib/disc/disc-scoring";
import { shuffleDiscOptions } from "@/lib/disc/disc-shuffle";
import {
  EdgeAssessmentOption,
  EdgeAssessmentQuestionShell,
} from "@/components/edge/edge-assessment-question-shell";

type PickPhase = "most" | "least";

type DiscIpsativeTestRunnerProps = {
  onComplete: (data: {
    responses: DiscIpsativeResponse[];
    rawScores: DiscRawScores;
  }) => Promise<void>;
};

export function DiscIpsativeTestRunner({ onComplete }: DiscIpsativeTestRunnerProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<PickPhase>("most");
  const [mostLabel, setMostLabel] = useState<DiscLabel | null>(null);
  const [leastLabel, setLeastLabel] = useState<DiscLabel | null>(null);
  const [rawScores, setRawScores] = useState<DiscRawScores>(emptyDiscRawScores);
  const [responses, setResponses] = useState<DiscIpsativeResponse[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<DiscQuestionOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const current = DISC_QUESTIONS[index];

  useEffect(() => {
    if (!current) return;
    setShuffledOptions(shuffleDiscOptions(current.options));
    setPhase("most");
    setMostLabel(null);
    setLeastLabel(null);
  }, [index, current]);

  const instruction =
    phase === "most"
      ? "Sélectionnez celle qui vous correspond le plus"
      : "Maintenant, celle qui vous correspond le moins";

  const canAdvance = Boolean(mostLabel && leastLabel && !submitting && !analyzing);

  const handlePick = useCallback(
    (label: DiscLabel) => {
      if (submitting || analyzing) return;

      if (phase === "most") {
        setMostLabel(label);
        setPhase("least");
        return;
      }

      if (label === mostLabel) return;
      setLeastLabel(label);
    },
    [analyzing, mostLabel, phase, submitting],
  );

  const handleNext = useCallback(async () => {
    if (!canAdvance || !mostLabel || !leastLabel || !current) return;

    const mostOption = current.options.find((o) => o.label === mostLabel);
    const leastOption = current.options.find((o) => o.label === leastLabel);
    if (!mostOption || !leastOption) return;

    const nextRaw = applyIpsativeAnswer(rawScores, mostLabel, leastLabel);
    const entry: DiscIpsativeResponse = {
      question_index: index + 1,
      question_id: current.id,
      situation: current.situation,
      displayed_order: shuffledOptions.map((o) => o.label),
      most: { label: mostLabel, text: mostOption.text },
      least: { label: leastLabel, text: leastOption.text },
    };

    const nextResponses = [
      ...responses.filter((r) => r.question_index !== index + 1),
      entry,
    ];
    setRawScores(nextRaw);
    setResponses(nextResponses);

    if (index < DISC_QUESTION_COUNT - 1) {
      setIndex((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    setAnalyzing(true);
    try {
      await onComplete({ responses: nextResponses, rawScores: nextRaw });
    } finally {
      setSubmitting(false);
    }
  }, [
    canAdvance,
    current,
    index,
    leastLabel,
    mostLabel,
    onComplete,
    rawScores,
    responses,
    shuffledOptions,
  ]);

  const optionState = useMemo(() => {
    return (label: DiscLabel) => {
      if (mostLabel === label) return "most" as const;
      if (leastLabel === label) return "least" as const;
      return "available" as const;
    };
  }, [leastLabel, mostLabel]);

  if (!current) return null;

  return (
    <EdgeAssessmentQuestionShell
      categoryTag="Profil comportemental"
      categoryMention="test DISC"
      questionText={current.situation}
      questionIndex={index}
      totalQuestions={DISC_QUESTION_COUNT}
      analyzing={analyzing}
      analyzingLabel="Analyse de votre profil en cours…"
      animateKey={`${index}-${phase}`}
      footer={
        <div className="space-y-4">
          <p className="text-center text-sm font-medium text-[#3D7BFF]">{instruction}</p>
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => void handleNext()}
            className={cn(
              "w-full rounded-xl py-3.5 text-sm font-bold transition",
              canAdvance
                ? "bg-[#3D7BFF] text-white shadow-[0_8px_24px_-8px_rgba(61,123,255,0.55)] hover:bg-[#2f6ae8]"
                : "cursor-not-allowed bg-black/[0.06] text-black/30",
            )}
          >
            {index < DISC_QUESTION_COUNT - 1 ? "Suivant" : "Terminer le test"}
          </button>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${phase}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {shuffledOptions.map((option) => {
            const isMostLocked = phase === "least" && mostLabel === option.label;
            const isSelectedMost = mostLabel === option.label;
            const isSelectedLeast = leastLabel === option.label;
            optionState(option.label);

            return (
              <EdgeAssessmentOption
                key={`${option.label}-${option.text}`}
                selected={isSelectedMost || isSelectedLeast}
                disabled={submitting || analyzing || isMostLocked}
                onClick={() => handlePick(option.label)}
                className={cn(
                  isMostLocked &&
                    "border-black/[0.06] bg-black/[0.04] text-black/35 line-through decoration-black/20",
                  isSelectedMost &&
                    "border-[rgba(61,123,255,0.45)] bg-[rgba(61,123,255,0.12)] ring-1 ring-[rgba(61,123,255,0.2)]",
                  isSelectedLeast &&
                    "border-[rgba(255,59,48,0.35)] bg-[rgba(255,59,48,0.06)] ring-1 ring-[rgba(255,59,48,0.15)]",
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>{option.text}</span>
                  {isSelectedMost ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#3D7BFF]">
                      Plus
                    </span>
                  ) : null}
                  {isSelectedLeast ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#FF3B30]">
                      Moins
                    </span>
                  ) : null}
                </span>
              </EdgeAssessmentOption>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </EdgeAssessmentQuestionShell>
  );
}
