"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DISC_QUESTIONS, type DiscLabel } from "@/lib/disc/disc-questions";

export default function DiscTestPage() {
  const supabase = createSupabaseBrowserClient();
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({ D: 0, I: 0, S: 0, C: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [responses, setResponses] = useState<
    Array<{ question_index: number; answer_text: string; answer_label: DiscLabel }>
  >([]);

  const current = DISC_QUESTIONS[index];
  const progress = Math.round(((index + 1) / DISC_QUESTIONS.length) * 100);

  const handleSelect = (value: DiscLabel, optionIndex: number) => {
    if (selectedIndex !== null || submitting || analyzing) return;
    setSelectedIndex(optionIndex);
    const next = { ...scores, [value]: scores[value] + 1 };
    setScores(next);
    const selectedOption = current.options[optionIndex];
    const finalResponses = selectedOption
      ? [
          ...responses.filter((item) => item.question_index !== index + 1),
          {
            question_index: index + 1,
            answer_text: selectedOption.t,
            answer_label: selectedOption.v,
          },
        ]
      : responses;
    if (selectedOption) {
      setResponses(finalResponses);
    }

    window.setTimeout(async () => {
      if (index < DISC_QUESTIONS.length - 1) {
        setIndex((prev) => prev + 1);
        setSelectedIndex(null);
        return;
      }

      setSubmitting(true);
      setAnalyzing(true);
      try {
        if (!supabase) return;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) return;
        const entries = Object.entries(next) as Array<[DiscLabel, number]>;
        const dominant = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "S";
        const profileLabel =
          dominant === "D"
            ? "Profil Dominant"
            : dominant === "I"
              ? "Profil Influent"
              : dominant === "S"
                ? "Profil Stable"
                : "Profil Consciencieux";

        const payload = {
          profile_id: userData.user.id,
          responses: finalResponses,
          scores: next,
          final_profile: profileLabel,
        };

        const { error } = await supabase.from("disc_resultats").upsert(payload, {
          onConflict: "profile_id",
        });
        if (error) {
          console.error("[disc] disc_resultats error:", error);
          window.alert(
            "Impossible d'enregistrer vos résultats DISC. Réessayez ou contactez le support.",
          );
          setAnalyzing(false);
          return;
        }
        window.setTimeout(() => {
          window.location.href = "/dashboard/apprenant/profil?disc=done";
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
            Question {index + 1} sur {DISC_QUESTIONS.length}
          </p>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a] sm:text-3xl">
          Lequel vous correspond le mieux ?
        </h1>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              {current.options.map((option, optionIndex) => {
                const selected = selectedIndex === optionIndex;
                return (
                  <motion.button
                    key={option.t}
                    type="button"
                    onClick={() => handleSelect(option.v, optionIndex)}
                    whileHover={{ scale: 1.01 }}
                    disabled={submitting || analyzing}
                    className={`w-full rounded-xl border px-5 py-4 text-left text-sm font-medium transition ${
                      selected
                        ? "border-[#FF3B30] bg-[rgba(255,59,48,0.06)] text-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,59,48,0.2)]"
                        : "border-black/10 bg-[#f8f8f6] text-[#0a0a0a] hover:border-[#FF3B30]/40"
                    }`}
                  >
                    {option.t}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {analyzing ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-black/55">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-[#FF3B30]" />
            Analyse de votre profil en cours…
          </div>
        ) : null}
      </div>
    </div>
  );
}
