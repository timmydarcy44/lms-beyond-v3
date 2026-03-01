"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills";

const answersLabels = ["1", "2", "3", "4", "5"];

const focusImages = [
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
];

export default function SoftSkillsTestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = SOFT_SKILLS_QUESTIONS[currentIndex];
  const progress = Math.round(((currentIndex + 1) / SOFT_SKILLS_QUESTIONS.length) * 100);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < SOFT_SKILLS_QUESTIONS.length - 1;
  const imageIndex = Math.floor(currentIndex / 5) % focusImages.length;

  const handleAnswer = (value: number) => {
    const key = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (canGoNext) {
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
    }
  };

  const handleKey = (event: KeyboardEvent) => {
    if (["1", "2", "3", "4", "5"].includes(event.key)) {
      handleAnswer(Number(event.key));
    }
    if (event.key === "ArrowUp" && canGoPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
    if (event.key === "ArrowDown" && canGoNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/soft-skills/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (response.ok) {
        window.location.href = "/soft-skills/resultats";
        return;
      }
      console.error("Erreur API submit:", await response.text());
    } catch (error) {
      console.error("Erreur submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const progressLabel = useMemo(
    () => `Question ${currentIndex + 1} sur ${SOFT_SKILLS_QUESTIONS.length}`,
    [currentIndex],
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-['Inter'] text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden items-center justify-center bg-black lg:flex">
          <motion.div
            key={focusImages[imageIndex]}
            initial={{ opacity: 0.5, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="h-[78%] w-[78%] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
          >
            <img
              src={focusImages[imageIndex]}
              alt="Focus"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>

        <div className="flex min-h-screen flex-col justify-between px-10 py-12">
          <div>
            <div className="h-1 w-full rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-[#F59E0B]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-[#9CA3AF]">
              <span>{progressLabel}</span>
              <span>{progress}%</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.35 }}
                className="mt-12 space-y-4"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[#F59E0B]">
                  {currentQuestion.skill}
                </div>
                <h1 className="text-[28px] font-semibold leading-snug text-white">
                  {currentQuestion.text}
                </h1>
              </motion.div>
            </AnimatePresence>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              {answersLabels.map((label, index) => {
                const value = index + 1;
                const active = answers[currentQuestion.id] === value;
                return (
                  <button
                    key={label}
                    onClick={() => handleAnswer(value)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border text-[16px] font-semibold transition ${
                      active
                        ? "border-[#F59E0B] bg-[#F59E0B] text-[#111827] shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                        : "border-white/15 text-white hover:border-[#F59E0B] hover:text-[#F59E0B] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end">
            {answers[currentQuestion.id] ? (
              currentIndex === SOFT_SKILLS_QUESTIONS.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-[#F59E0B] px-6 py-3 text-[14px] font-semibold text-[#111827]"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#111827]/40 border-t-[#111827]" />
                      Enregistrement...
                    </span>
                  ) : (
                    "Voir mes résultats"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="rounded-full bg-[#F59E0B] px-6 py-3 text-[14px] font-semibold text-[#111827]"
                >
                  Suivant
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
