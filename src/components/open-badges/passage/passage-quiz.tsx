"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { drawQuizQuestions, quizAskedCount, type BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { PassageButton } from "@/components/open-badges/passage/passage-chrome";

export function PassageQuiz({
  method,
  seed,
  secondsLeft,
  warning,
  onSubmit,
}: {
  method: BadgeMethodConfig;
  seed: string;
  secondsLeft: number | null;
  warning: string;
  onSubmit: (text: string) => void;
}) {
  const bank = method.quiz?.questions ?? [];
  const questions = useMemo(() => {
    const count = quizAskedCount(method.quiz);
    return count < bank.length ? drawQuizQuestions(bank, count, seed) : bank;
  }, [bank, method.quiz, seed]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState(false);
  const sentRef = useRef(false);
  const question = questions[index];
  const passing = method.quiz?.passingScorePercent ?? 100;
  const multiple = question?.questionType === "multiple";
  const selected = question ? answers[question.id] ?? [] : [];

  const choose = (choiceId: string) => {
    if (!question) return;
    setAnswers((current) => {
      const prev = current[question.id] ?? [];
      const next = multiple
        ? prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
        : [choiceId];
      return { ...current, [question.id]: next };
    });
  };

  const goNext = () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    const missing = questions.filter((item) => (answers[item.id] ?? []).length === 0).length;
    if (missing > 0) {
      setConfirm(true);
      return;
    }
    finish();
  };

  const finish = () => {
    if (sentRef.current) return;
    sentRef.current = true;
    const lines = questions.map((item, itemIndex) => {
      const labels = (answers[item.id] ?? [])
        .map((id) => item.choices.find((choice) => choice.id === id)?.label ?? id)
        .join(", ");
      return `${itemIndex + 1}. ${item.prompt}\n${labels || "(sans réponse)"}`;
    });
    onSubmit(lines.join("\n\n"));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!question) return;
      const digit = Number(event.key);
      if (digit >= 1 && digit <= 4 && question.choices[digit - 1]) {
        choose(question.choices[digit - 1].id);
      }
      if (event.key === "Enter") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (secondsLeft === 0) finish();
  }, [secondsLeft]);

  if (!question) {
    return <p className="px-6 py-10 text-sm text-[#B4B8C8]">Ce questionnaire n&apos;a pas encore de questions.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between text-sm text-[#B4B8C8]">
        <p>
          Question {index + 1} sur {questions.length}
        </p>
        <p>Seuil {passing} %</p>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {questions.map((item, itemIndex) => (
          <span
            key={item.id}
            style={{ background: itemIndex < index ? "var(--passage-progress-done)" : itemIndex === index ? "var(--passage-progress-now)" : "var(--passage-progress-todo)" }}
            className="h-1 flex-1 rounded-full"
          />
        ))}
      </div>
      {secondsLeft != null && secondsLeft <= 120 && secondsLeft > 0 ? (
        <p className="mt-4 text-sm text-[#F2C15A]">Il reste moins de deux minutes.</p>
      ) : null}
      {warning ? <p className="mt-4 text-sm text-[#F2C15A]">{warning}</p> : null}
      <article className="mt-6 rounded-3xl bg-[#15171E] p-6">
        <p className="text-xs text-[#8A8FA3]">{multiple ? "Plusieurs réponses possibles" : "Une seule réponse"}</p>
        <h2 className="mt-3 text-xl font-semibold" data-passage-prompt>{question.prompt}</h2>
        <div className="mt-5 space-y-2">
          {question.choices.map((choice, choiceIndex) => {
            const on = selected.includes(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm ${
                  on ? "border-[#6E5BFF] bg-[#6E5BFF]/15" : "border-[#1E2130]"
                }`}
              >
                <span className="text-[#8A8FA3]">{choiceIndex + 1}</span>
                {choice.label}
              </button>
            );
          })}
        </div>
      </article>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          className="text-sm text-[#B4B8C8] disabled:opacity-30"
        >
          ← Précédente
        </button>
        <PassageButton onClick={goNext}>
          {index === questions.length - 1 ? "Terminer le questionnaire" : "Question suivante →"}
        </PassageButton>
      </div>
      {confirm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md rounded-3xl bg-[#15171E] p-6">
            <p className="text-sm text-[#B4B8C8]">
              Certaines questions n&apos;ont pas de réponse. Le questionnaire part quand même.
            </p>
            <div className="mt-4 flex gap-3">
              <PassageButton onClick={finish}>Envoyer</PassageButton>
              <button type="button" onClick={() => setConfirm(false)} className="text-sm text-[#B4B8C8]">
                Revenir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
