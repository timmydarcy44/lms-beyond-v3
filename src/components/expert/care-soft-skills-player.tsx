"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

const SCALE = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];

export function CareSoftSkillsPlayer({ token }: { token: string }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scoreLabel, setScoreLabel] = useState<string | null>(null);
  const question = SOFT_SKILLS_QUESTIONS[index];

  const choose = async (value: number) => {
    if (!question) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (index < SOFT_SKILLS_QUESTIONS.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/care-tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken: token, answers: next, questionnaireSlug: "soft-skills" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      setScoreLabel(json.scoreLabel ?? null);
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Merci</h1>
        <p className="mt-3 text-[#B5BAC6]">{scoreLabel ?? "Vos réponses ont été enregistrées."}</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm text-[#9096A3]">{index + 1} / {SOFT_SKILLS_QUESTIONS.length} · {question.skill}</p>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug">{question.text}</h1>
      <div className="mt-8 grid gap-2">
        {SCALE.map((label, value) => (
          <button
            key={label}
            type="button"
            disabled={busy}
            onClick={() => void choose(value)}
            className="h-12 rounded-full bg-[#12141A] text-sm font-semibold hover:bg-[#1E2130]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
