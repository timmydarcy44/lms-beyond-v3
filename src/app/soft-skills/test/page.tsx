"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SOFT_SKILLS_QUESTIONS, SOFT_SKILLS_FREQUENCY_OPTIONS } from "@/lib/soft-skills";
import { redirectAfterAssessmentTest } from "@/lib/apprenant/post-test-redirect";
import {
  EdgeAssessmentOption,
  EdgeAssessmentQuestionShell,
} from "@/components/edge/edge-assessment-question-shell";
import { EDGE_COLORS } from "@/lib/edge/edge-brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveSoftSkillsResultats, validateSoftSkillsAnswers } from "@/lib/soft-skills/save-soft-skills";

const SCALE_LABELS = SOFT_SKILLS_FREQUENCY_OPTIONS;

export default function SoftSkillsTestPage() {
  const supabase = createSupabaseBrowserClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const currentQuestion = SOFT_SKILLS_QUESTIONS[currentIndex];
  const selectedValue = answers[currentQuestion.id] ?? null;

  const handleSubmit = async (answersPayload: Record<string, number>) => {
    const validationError = validateSoftSkillsAnswers(answersPayload);
    if (validationError) {
      window.alert(validationError);
      return;
    }

    setSubmitting(true);
    setAnalyzing(true);
    try {
      if (!supabase) {
        window.alert("Connexion indisponible. Rechargez la page.");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        window.alert("Session introuvable. Reconnectez-vous depuis votre espace apprenant.");
        return;
      }

      const { error } = await saveSoftSkillsResultats(supabase, userData.user.id, answersPayload);
      if (error) {
        console.error("[soft-skills] save error:", error);
        window.alert(
          "Impossible d'enregistrer vos réponses soft skills. Réessayez ou contactez le support.",
        );
        setAnalyzing(false);
        return;
      }

      const next = await redirectAfterAssessmentTest("soft_skills", "/soft-skills/resultats");
      window.setTimeout(() => {
        window.location.href = next;
      }, 600);
    } catch (error) {
      console.error("Erreur submit soft skills:", error);
      window.alert("Une erreur inattendue est survenue lors de l'enregistrement.");
      setAnalyzing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = (value: number) => {
    if (submitting || analyzing) return;

    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);

    if (currentIndex < SOFT_SKILLS_QUESTIONS.length - 1) {
      window.setTimeout(() => setCurrentIndex((prev) => prev + 1), 220);
      return;
    }

    window.setTimeout(() => {
      void handleSubmit(nextAnswers);
    }, 280);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (submitting || analyzing) return;
      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        handleAnswer(Number(event.key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const footer = useMemo(() => {
    if (!selectedValue || analyzing) return null;
    if (currentIndex < SOFT_SKILLS_QUESTIONS.length - 1) {
      return (
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: EDGE_COLORS.blueAccent }}
        >
          Question suivante
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => void handleSubmit(answers)}
        disabled={submitting}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: EDGE_COLORS.blueAccent }}
      >
        {submitting ? "Enregistrement…" : "Voir mes résultats"}
      </button>
    );
  }, [analyzing, answers, currentIndex, selectedValue, submitting]);

  return (
    <EdgeAssessmentQuestionShell
      categoryTag={currentQuestion.skill}
      categoryMention="soft skills"
      questionText={currentQuestion.text}
      questionIndex={currentIndex}
      totalQuestions={SOFT_SKILLS_QUESTIONS.length}
      footer={footer}
      analyzing={analyzing}
      analyzingLabel="Enregistrement de vos réponses soft skills…"
      animateKey={currentQuestion.id}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3"
        >
          {SCALE_LABELS.map((option) => (
            <EdgeAssessmentOption
              key={option.value}
              selected={selectedValue === option.value}
              disabled={submitting || analyzing}
              onClick={() => handleAnswer(option.value)}
              className="h-full px-2 py-3 text-center hover:translate-x-0 sm:px-3"
            >
              <span className="block text-base font-semibold">{option.shortLabel}</span>
              <span className="mt-1 block text-[11px] font-normal leading-snug text-black/60">
                {option.label}
              </span>
            </EdgeAssessmentOption>
          ))}
        </motion.div>
      </AnimatePresence>
    </EdgeAssessmentQuestionShell>
  );
}
