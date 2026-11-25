"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  computeIdmcResultFromResponses,
  IDMC_AXES_LABELS,
  IDMC_LIKERT_OPTIONS,
  IDMC_QUESTIONS,
  type IdmcLikertValue,
  type IdmcResponse,
  type IdmcVariant,
} from "@/lib/idmc/idmc-questions";
import { saveIdmcResultats } from "@/lib/idmc/idmc-save";
import { applicationReturn, redirectAfterAssessmentTest } from "@/lib/apprenant/post-test-redirect";
import {
  EdgeAssessmentOption,
  EdgeAssessmentQuestionShell,
} from "@/components/edge/edge-assessment-question-shell";

function resolveVariant(from: string | null): IdmcVariant {
  // Experts / formateurs et salariés → banque « employee » (contexte pro).
  // Apprenants / candidature → banque « learner » (alternance).
  if (from === "expert" || from === "salarie" || from === "formateur") return "employee";
  return "learner";
}

function resolveDefaultNext(from: string | null): string {
  if (from === "expert" || from === "formateur") return "/dashboard/expert/bilans";
  if (from === "salarie") return "/dashboard/salarie";
  return applicationReturn("/dashboard/apprenant/profil?idmc=done");
}

function IdmcTestInner() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const variant = useMemo(() => resolveVariant(from), [from]);
  const questions = IDMC_QUESTIONS[variant];

  const supabase = createSupabaseBrowserClient();
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<IdmcLikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [responses, setResponses] = useState<IdmcResponse[]>([]);

  const current = questions[index];

  const handleSelect = (value: IdmcLikertValue) => {
    if (selectedValue !== null || submitting || analyzing || !current) return;
    setSelectedValue(value);
    const isReversed = Boolean(current.reversed);
    const score = isReversed ? ((3 - value) as IdmcLikertValue) : value;
    const finalResponses: IdmcResponse[] = [
      ...responses.filter((item) => item.question_index !== index + 1),
      {
        axis: current.axis,
        question_index: index + 1,
        text: current.text,
        value,
        score,
        reversed: isReversed,
      },
    ];
    setResponses(finalResponses);

    window.setTimeout(async () => {
      if (index < questions.length - 1) {
        setIndex((prev) => prev + 1);
        setSelectedValue(null);
        return;
      }

      setSubmitting(true);
      setAnalyzing(true);
      try {
        if (!supabase) return;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          window.alert("Session introuvable. Reconnectez-vous depuis votre espace.");
          setAnalyzing(false);
          return;
        }

        const { axisPoints, axisPercentages, globalScore, level } =
          computeIdmcResultFromResponses(finalResponses);

        const payload = {
          profile_id: userData.user.id,
          responses: finalResponses,
          scores: {
            axes: axisPercentages,
            points: axisPoints,
            global_score: Number(globalScore.toFixed(2)),
            level,
            variant,
          },
          global_score: Number(globalScore.toFixed(2)),
          level,
          updated_at: new Date().toISOString(),
        };

        const { error } = await saveIdmcResultats(supabase, payload);
        if (error) {
          console.error("[idmc] idmc_resultats error:", error);
          window.alert(
            "Impossible d'enregistrer vos résultats IDMC. Réessayez ou contactez le support.",
          );
          setAnalyzing(false);
          return;
        }

        const defaultNext = resolveDefaultNext(from);
        const next =
          from === "expert" || from === "formateur"
            ? defaultNext
            : await redirectAfterAssessmentTest("idmc", defaultNext);
        window.setTimeout(() => {
          window.location.href = next;
        }, 900);
      } finally {
        setSubmitting(false);
      }
    }, 300);
  };

  if (!current) return null;

  return (
    <EdgeAssessmentQuestionShell
      categoryTag={IDMC_AXES_LABELS[current.axis]}
      categoryMention="test IDMC"
      questionText={current.text}
      questionIndex={index}
      totalQuestions={questions.length}
      analyzing={analyzing}
      analyzingLabel="Analyse de votre profil IDMC en cours…"
      animateKey={index}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {IDMC_LIKERT_OPTIONS.map((option) => (
            <EdgeAssessmentOption
              key={option.label}
              selected={selectedValue === option.value}
              disabled={submitting || analyzing}
              onClick={() => handleSelect(option.value)}
              className="px-3 py-4 text-center text-xs sm:text-sm"
            >
              {option.label}
            </EdgeAssessmentOption>
          ))}
        </motion.div>
      </AnimatePresence>
    </EdgeAssessmentQuestionShell>
  );
}

export default function IdmcTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <IdmcTestInner />
    </Suspense>
  );
}
