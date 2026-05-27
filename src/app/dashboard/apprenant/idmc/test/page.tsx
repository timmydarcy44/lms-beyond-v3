"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  computeIdmcResultFromResponses,
  IDMC_LIKERT_OPTIONS,
  IDMC_QUESTIONS,
  type IdmcLikertValue,
  type IdmcResponse,
} from "@/lib/idmc/idmc-questions";

export default function IdmcTestPage() {
  const supabase = createSupabaseBrowserClient();
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<IdmcLikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [responses, setResponses] = useState<IdmcResponse[]>([]);

  const current = IDMC_QUESTIONS[index];
  const progress = Math.round(((index + 1) / IDMC_QUESTIONS.length) * 100);

  const handleSelect = (value: IdmcLikertValue) => {
    if (selectedValue !== null || submitting || analyzing) return;
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
      if (index < IDMC_QUESTIONS.length - 1) {
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
          window.alert("Session introuvable. Reconnectez-vous depuis votre espace apprenant.");
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
          },
          global_score: Number(globalScore.toFixed(2)),
          level,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("idmc_resultats").upsert(payload, {
          onConflict: "profile_id",
        });
        if (error) {
          console.error("[idmc] idmc_resultats error:", error);
          window.alert(
            "Impossible d'enregistrer vos résultats IDMC. Réessayez ou contactez le support.",
          );
          setAnalyzing(false);
          return;
        }
        window.setTimeout(() => {
          window.location.href = "/dashboard/apprenant/profil?idmc=done";
        }, 900);
      } finally {
        setSubmitting(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        <div className="mb-8">
          <div className="h-1.5 w-full rounded-full bg-black/[0.08]">
            <div
              className="h-1.5 rounded-full bg-[#FF3B30] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-black/45">
            Question {index + 1} sur {IDMC_QUESTIONS.length}
          </p>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a] sm:text-3xl">
          Test IDMC
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-black/70">{current.text}</p>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {IDMC_LIKERT_OPTIONS.map((option) => {
                const selected = selectedValue === option.value;
                return (
                  <motion.button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ scale: 1.02 }}
                    disabled={submitting || analyzing}
                    className={`rounded-xl border px-3 py-4 text-center text-xs font-medium transition sm:text-sm ${
                      selected
                        ? "border-[#FF3B30] bg-[rgba(255,59,48,0.06)] text-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,59,48,0.2)]"
                        : "border-black/10 bg-[#f8f8f6] text-[#0a0a0a] hover:border-[#FF3B30]/40"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {analyzing ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-black/55">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-[#FF3B30]" />
            Analyse de votre profil IDMC en cours…
          </div>
        ) : null}
      </div>
    </div>
  );
}
