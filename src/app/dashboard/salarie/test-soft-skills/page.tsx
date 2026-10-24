"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills";
import { redirectAfterSalarieAssessmentTest } from "@/lib/salarie/post-test-redirect";
import { invalidateLearnerSnapshotCache } from "@/hooks/use-personalized-action-plan";
import { AssessmentChoice, AssessmentTestFrame } from "@/components/salarie/assessment-test-frame";

const SCALE = [
  { value: 1, label: "Jamais" },
  { value: 2, label: "Rarement" },
  { value: 3, label: "Parfois" },
  { value: 4, label: "Souvent" },
  { value: 5, label: "Toujours" },
];

export default function SalarieSoftSkillsTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = SOFT_SKILLS_QUESTIONS[currentIndex];
  const progress = Math.round(((currentIndex + 1) / SOFT_SKILLS_QUESTIONS.length) * 100);
  const canGoPrev = currentIndex > 0;
  const isLast = currentIndex === SOFT_SKILLS_QUESTIONS.length - 1;
  const selected = answers[currentQuestion.id];

  const handleAnswer = (value: number) => {
    const key = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError("");
    if (!isLast) {
      window.setTimeout(() => setCurrentIndex((prev) => prev + 1), 180);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        handleAnswer(Number(event.key));
      }
      if (event.key === "ArrowUp" && canGoPrev) {
        setCurrentIndex((prev) => prev - 1);
      }
      if (event.key === "ArrowDown" && !isLast) {
        setCurrentIndex((prev) => prev + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleSubmit = async () => {
    if (Object.keys(answers).length < SOFT_SKILLS_QUESTIONS.length) {
      setError("Il reste des questions sans réponse.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/soft-skills/submit-salarie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (response.ok) {
        invalidateLearnerSnapshotCache();
        const next = await redirectAfterSalarieAssessmentTest("soft_skills", "/dashboard/salarie");
        router.push(next);
        return;
      }
      setError("L'enregistrement n'a pas abouti. Réessayez.");
    } catch {
      setError("L'enregistrement n'a pas abouti. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AssessmentTestFrame
      stepLabel={`Question ${currentIndex + 1} sur ${SOFT_SKILLS_QUESTIONS.length}`}
      progress={progress}
      kicker={currentQuestion.skill}
      title={currentQuestion.text}
      footer={
        <>
          <button
            type="button"
            onClick={() => (canGoPrev ? setCurrentIndex((prev) => prev - 1) : router.push("/dashboard/salarie"))}
            className="text-sm font-medium text-[#8A8F98]"
          >
            {canGoPrev ? "Précédent" : "Quitter"}
          </button>
          {isLast && selected ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Enregistrement…" : "Terminer"}
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {SCALE.map((option) => (
          <AssessmentChoice
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            disabled={submitting}
            onClick={() => handleAnswer(option.value)}
          />
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-[#9B2335]">{error}</p> : null}
    </AssessmentTestFrame>
  );
}
