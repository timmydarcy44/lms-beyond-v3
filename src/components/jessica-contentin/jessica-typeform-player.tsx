"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { JessicaQuestionDef, JessicaQuestionnaireDef } from "@/lib/jessica-contentin/questionnaires";
import { cn } from "@/lib/utils";

type Props = {
  questionnaire: JessicaQuestionnaireDef;
  preview?: boolean;
  inviteToken?: string | null;
  recipientEmail?: string | null;
  recipientFirstName?: string | null;
  recipientLastName?: string | null;
};

type Phase = "intro" | "questions" | "done";

export function JessicaTypeformPlayer({
  questionnaire,
  preview,
  inviteToken,
  recipientEmail,
  recipientFirstName,
  recipientLastName,
}: Props) {
  const questions = questionnaire.questions;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [email, setEmail] = useState(recipientEmail ?? "");
  const [firstName, setFirstName] = useState(recipientFirstName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [scoreLabel, setScoreLabel] = useState<string | null>(null);

  const current = questions[index] as JessicaQuestionDef | undefined;
  const progress = questions.length ? ((index + (phase === "questions" ? 1 : 0)) / questions.length) * 100 : 0;

  const canContinue = useMemo(() => {
    if (!current) return false;
    const v = answers[current.id];
    if (current.type === "checkbox") return true;
    if (current.type === "text") return String(v ?? "").trim().length > 0;
    if (current.type === "scale") return v != null && v !== "";
    return v != null && v !== "";
  }, [answers, current]);

  const goNext = useCallback(async () => {
    if (phase === "intro") {
      setPhase("questions");
      setIndex(0);
      return;
    }
    if (!current) return;
    if (!canContinue && current.type !== "checkbox") {
      toast.error("Merci de répondre avant de continuer");
      return;
    }
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    if (preview) {
      setPhase("done");
      setScoreLabel("Prévisualisation — aucune réponse enregistrée");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/jessica-questionnaires/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireSlug: questionnaire.slug,
          answers,
          inviteToken: inviteToken || null,
          respondentEmail: email.trim() || null,
          respondentFirstName: firstName.trim() || null,
          respondentLastName: recipientLastName || null,
        }),
      });
      const json = (await res.json()) as { error?: string; scoreLabel?: string | null };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      setScoreLabel(json.scoreLabel ?? null);
      setPhase("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  }, [
    phase,
    current,
    canContinue,
    index,
    questions.length,
    preview,
    questionnaire.slug,
    answers,
    inviteToken,
    email,
    firstName,
    recipientLastName,
  ]);

  const goPrev = () => {
    if (phase === "questions" && index > 0) setIndex((i) => i - 1);
    else if (phase === "questions" && index === 0) setPhase("intro");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        void goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext]);

  const setAnswer = (id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(165deg, #F7F3EC 0%, #EFE6D8 45%, #E8DFD0 100%)",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#8B6F47]/10 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#C4A574]/15 blur-3xl" />
      </div>

      {phase === "questions" ? (
        <div className="fixed left-0 right-0 top-0 z-20 h-1 bg-black/5">
          <motion.div
            className="h-full bg-[#8B6F47]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      ) : null}

      {preview ? (
        <div className="relative z-20 bg-[#2F2A25] px-4 py-2 text-center text-sm text-white">
          Mode prévisualisation — les réponses ne seront pas enregistrées
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
        <AnimatePresence mode="wait">
          {phase === "intro" ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              <p className="text-sm tracking-[0.2em] text-[#8B6F47] uppercase">Jessica Contentin</p>
              <h1 className="text-4xl font-semibold leading-tight text-[#2F2A25] sm:text-5xl">
                {questionnaire.title}
              </h1>
              {questionnaire.description ? (
                <p className="text-lg leading-relaxed text-[#2F2A25]/80">{questionnaire.description}</p>
              ) : null}
              <p className="text-sm text-[#2F2A25]/55">
                {questions.length} question{questions.length > 1 ? "s" : ""} · environ{" "}
                {Math.max(2, Math.round(questions.length * 0.35))} min
              </p>

              {!preview && !inviteToken ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[#8B6F47]"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    className="rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[#8B6F47]"
                    placeholder="Votre email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void goNext()}
                className="inline-flex items-center gap-2 rounded-full bg-[#8B6F47] px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-[#7a6140]"
              >
                Commencer
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-[#2F2A25]/45">Appuyez sur Entrée ↵</p>
            </motion.div>
          ) : null}

          {phase === "questions" && current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <p className="text-sm text-[#8B6F47]">
                {index + 1} <span className="text-[#2F2A25]/30">→</span> {questions.length}
              </p>
              <h2 className="text-3xl font-semibold leading-snug text-[#2F2A25] sm:text-4xl">
                {current.label}
              </h2>

              <QuestionInput question={current} value={answers[current.id]} onChange={(v) => setAnswer(current.id, v)} />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void goNext()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#8B6F47] px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : index === questions.length - 1 ? (
                    <>
                      Envoyer <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      OK <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-[#2F2A25]/55 hover:text-[#2F2A25]"
                >
                  <ChevronUp className="h-4 w-4" />
                  Retour
                </button>
              </div>
            </motion.div>
          ) : null}

          {phase === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#8B6F47]/15 text-[#8B6F47]">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-semibold text-[#2F2A25]">Merci</h2>
              <p className="text-lg text-[#2F2A25]/75">
                {preview
                  ? "Fin de la prévisualisation."
                  : "Vos réponses ont bien été enregistrées."}
              </p>
              {scoreLabel ? <p className="text-sm text-[#8B6F47]">{scoreLabel}</p> : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: JessicaQuestionDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (question.type === "text") {
    return (
      <textarea
        autoFocus
        rows={4}
        className="w-full resize-none border-b-2 border-[#8B6F47]/40 bg-transparent text-xl text-[#2F2A25] outline-none placeholder:text-[#2F2A25]/30 focus:border-[#8B6F47]"
        placeholder="Votre réponse…"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.type === "scale") {
    const min = question.min ?? 0;
    const max = question.max ?? 5;
    const opts = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="flex flex-wrap gap-2">
        {opts.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border text-lg transition",
              String(value) === String(n)
                ? "border-[#8B6F47] bg-[#8B6F47] text-white"
                : "border-black/10 bg-white/70 text-[#2F2A25] hover:border-[#8B6F47]/50",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        {[
          { v: "1", label: "Oui" },
          { v: "0", label: "Non" },
        ].map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              "rounded-2xl border px-6 py-4 text-left text-lg transition",
              value === opt.v
                ? "border-[#8B6F47] bg-[#8B6F47] text-white"
                : "border-black/10 bg-white/80 text-[#2F2A25] hover:border-[#8B6F47]/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "checkbox") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "rounded-2xl border px-6 py-4 text-left text-lg transition",
          value
            ? "border-[#8B6F47] bg-[#8B6F47] text-white"
            : "border-black/10 bg-white/80 text-[#2F2A25] hover:border-[#8B6F47]/40",
        )}
      >
        {value ? "✓ Sélectionné" : "Cocher si concerné"}
      </button>
    );
  }

  // single
  return (
    <div className="flex flex-col gap-3">
      {(question.options ?? []).map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-2xl border px-5 py-4 text-left text-lg transition",
            value === opt
              ? "border-[#8B6F47] bg-[#8B6F47] text-white"
              : "border-black/10 bg-white/80 text-[#2F2A25] hover:border-[#8B6F47]/40",
          )}
        >
          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-current/30 text-sm">
            {String.fromCharCode(65 + i)}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}
