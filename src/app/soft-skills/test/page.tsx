"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills";
import { redirectAfterAssessmentTest } from "@/lib/apprenant/post-test-redirect";
import {
  EdgeAssessmentOption,
  EdgeAssessmentQuestionShell,
} from "@/components/edge/edge-assessment-question-shell";
import { EDGE_COLORS } from "@/lib/edge/edge-brand";

const SCALE_LABELS = [
  { value: 1, label: "1 — Pas du tout" },
  { value: 2, label: "2" },
  { value: 3, label: "3 — Moyennement" },
  { value: 4, label: "4" },
  { value: 5, label: "5 — Tout à fait" },
];

export default function SoftSkillsTestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = SOFT_SKILLS_QUESTIONS[currentIndex];
  const selectedValue = answers[currentQuestion.id] ?? null;

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (currentIndex < SOFT_SKILLS_QUESTIONS.length - 1) {
      window.setTimeout(() => setCurrentIndex((prev) => prev + 1), 220);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/soft-skills/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });
      if (response.ok) {
        const next = await redirectAfterAssessmentTest("soft_skills", "/soft-skills/resultats");
        window.location.href = next;
        return;
      }
      console.error("Erreur API submit:", await response.text());
    } catch (error) {
      console.error("Erreur submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        handleAnswer(Number(event.key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const footer = useMemo(() => {
    if (!selectedValue) return null;
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
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: EDGE_COLORS.blueAccent }}
      >
        {submitting ? "Enregistrement…" : "Voir mes résultats"}
      </button>
    );
  }, [currentIndex, selectedValue, submitting]);

  return (
    <EdgeAssessmentQuestionShell
      categoryTag={currentQuestion.skill}
      categoryMention="soft skills"
      questionText={currentQuestion.text}
      questionIndex={currentIndex}
      totalQuestions={SOFT_SKILLS_QUESTIONS.length}
      footer={footer}
      animateKey={currentQuestion.id}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {SCALE_LABELS.map((option) => (
            <EdgeAssessmentOption
              key={option.value}
              selected={selectedValue === option.value}
              onClick={() => handleAnswer(option.value)}
            >
              {option.label}
            </EdgeAssessmentOption>
          ))}
        </motion.div>
      </AnimatePresence>
    </EdgeAssessmentQuestionShell>
  );
}
