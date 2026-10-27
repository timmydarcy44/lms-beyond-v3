"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

const SCALE = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];

export function CareSoftSkillsPlayer({
  token,
  firstName,
  lastName,
}: {
  token: string;
  firstName?: string;
  lastName?: string;
}) {
  const linked = Boolean(firstName?.trim() && lastName?.trim());
  const [givenFirst, setGivenFirst] = useState(firstName ?? "");
  const [givenLast, setGivenLast] = useState(lastName ?? "");
  const [started, setStarted] = useState(linked);
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
        body: JSON.stringify({
          inviteToken: token,
          answers: next,
          questionnaireSlug: "soft-skills",
          respondentFirstName: givenFirst.trim() || null,
          respondentLastName: givenLast.trim() || null,
        }),
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

  if (!started) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF4B4B]">Byound Care</p>
        <h1 className="mt-4 text-3xl font-extrabold">Test des soft skills</h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <input
            className="h-12 rounded-xl border border-[#E5E5EA] px-4"
            placeholder="Prénom"
            value={givenFirst}
            onChange={(event) => setGivenFirst(event.target.value)}
          />
          <input
            className="h-12 rounded-xl border border-[#E5E5EA] px-4"
            placeholder="Nom"
            value={givenLast}
            onChange={(event) => setGivenLast(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="mt-6 h-12 rounded-full bg-[#FF4B4B] px-6 text-sm font-extrabold text-[#04140C]"
          onClick={() => {
            if (!givenFirst.trim() || !givenLast.trim()) {
              toast.error("Indiquez votre nom et votre prénom");
              return;
            }
            setStarted(true);
          }}
        >
          Commencer
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Merci</h1>
        <p className="mt-3 text-[#636366]">{scoreLabel ?? "Vos réponses ont été enregistrées."}</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm text-[#FF4B4B]">{index + 1} / {SOFT_SKILLS_QUESTIONS.length} · {question.skill}</p>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug">{question.text}</h1>
      <div className="mt-8 grid gap-2">
        {SCALE.map((label, value) => (
          <button
            key={label}
            type="button"
            disabled={busy}
            onClick={() => void choose(value)}
            className="h-12 rounded-full border border-[#E5E5EA] bg-white text-sm font-semibold text-[#07080B] hover:border-[#FF4B4B] hover:bg-[#FF4B4B] hover:text-[#04140C]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
