"use client";

import { useCallback, useEffect, useState } from "react";
import { AssessmentChoice, AssessmentTestFrame } from "@/components/salarie/assessment-test-frame";
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

  if (!current) return null;

  const progress = Math.round(((index + (phase === "least" ? 0.5 : 0)) / DISC_QUESTION_COUNT) * 100);

  return (
    <AssessmentTestFrame
      stepLabel={`Question ${index + 1} sur ${DISC_QUESTION_COUNT}`}
      progress={analyzing ? 100 : progress}
      kicker={analyzing ? "Analyse de votre profil" : instruction}
      title={analyzing ? "Un instant." : current.situation}
      footer={
        canAdvance ? (
          <button
            type="button"
            onClick={() => void handleNext()}
            className="h-12 w-full rounded-full bg-[#111111] text-[15px] font-semibold text-white"
          >
            {index < DISC_QUESTION_COUNT - 1 ? "Continuer" : "Terminer"}
          </button>
        ) : (
          <span />
        )
      }
    >
      <div className="space-y-3">
        {shuffledOptions.map((option) => {
          const locked = phase === "least" && mostLabel === option.label;
          const selected = mostLabel === option.label || leastLabel === option.label;
          const mark = mostLabel === option.label ? "Le plus" : leastLabel === option.label ? "Le moins" : "";
          return (
            <AssessmentChoice
              key={`${option.label}-${option.text}`}
              label={mark ? `${option.text} · ${mark}` : option.text}
              selected={selected && !locked}
              disabled={submitting || analyzing || locked}
              onClick={() => handlePick(option.label)}
            />
          );
        })}
      </div>
    </AssessmentTestFrame>
  );
}
