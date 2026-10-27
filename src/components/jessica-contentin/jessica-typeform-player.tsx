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
  submitUrl?: string;
  appearance?: "jessica" | "care";
};

type Phase = "intro" | "questions" | "done";

export function JessicaTypeformPlayer({
  questionnaire,
  preview,
  inviteToken,
  recipientEmail,
  recipientFirstName,
  recipientLastName,
  submitUrl = "/api/public/jessica-questionnaires/submit",
  appearance = "jessica",
}: Props) {
  const care = appearance === "care";
  const questions = questionnaire.questions;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [email, setEmail] = useState(recipientEmail ?? "");
  const [firstName, setFirstName] = useState(recipientFirstName ?? "");
  const [lastName, setLastName] = useState(recipientLastName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [scoreLabel, setScoreLabel] = useState<string | null>(null);
  const linked = Boolean(inviteToken);
  const namesLocked = linked && Boolean(recipientFirstName?.trim() && recipientLastName?.trim());
  const accent = care ? "#FF4B4B" : "#8B6F47";
  const ink = care ? "#07080B" : "#2F2A25";

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
      if (!preview && !linked && (!firstName.trim() || !lastName.trim())) {
        toast.error("Indiquez votre nom et votre prénom pour commencer");
        return;
      }
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
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireSlug: questionnaire.slug,
          answers,
          inviteToken: inviteToken || null,
          respondentEmail: email.trim() || null,
          respondentFirstName: firstName.trim() || null,
          respondentLastName: lastName.trim() || null,
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
    lastName,
    linked,
    submitUrl,
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
        background: care ? "#FFFFFF" : "linear-gradient(165deg, #F7F3EC 0%, #EFE6D8 45%, #E8DFD0 100%)",
        fontFamily: care
          ? '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Manrope,sans-serif'
          : "Georgia, 'Times New Roman', serif",
      }}
    >
      {care ? null : (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#8B6F47]/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#C4A574]/15 blur-3xl" />
        </div>
      )}

      {phase === "questions" ? (
        <div className="fixed left-0 right-0 top-0 z-20 h-1 bg-black/5">
          <motion.div
            className="h-full"
            style={{ background: accent }}
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
              <p className="text-sm tracking-[0.2em] uppercase" style={{ color: accent }}>
                {care ? "Byound Care" : "Jessica Contentin"}
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: ink }}>
                {questionnaire.title}
              </h1>
              {questionnaire.description ? (
                <p className="text-lg leading-relaxed" style={{ color: ink, opacity: 0.8 }}>{questionnaire.description}</p>
              ) : null}
              <p className="text-sm" style={{ color: ink, opacity: 0.55 }}>
                {questions.length} question{questions.length > 1 ? "s" : ""} · environ{" "}
                {Math.max(2, Math.round(questions.length * 0.35))} min
              </p>

              {!preview && (!linked || care) ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none"
                    style={{ borderColor: namesLocked ? "#E5E5EA" : undefined }}
                    placeholder="Prénom"
                    value={firstName}
                    readOnly={namesLocked}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none"
                    placeholder="Nom"
                    value={lastName}
                    readOnly={namesLocked}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {!linked ? (
                    <input
                      className="rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none sm:col-span-2"
                      placeholder="Email (facultatif)"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void goNext()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-sm transition",
                  care ? "bg-[#FF4B4B] text-[#04140C] hover:bg-[#ff3b30]" : "bg-[#8B6F47] text-white hover:bg-[#7a6140]",
                )}
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
              <p className="text-sm" style={{ color: accent }}>
                {index + 1} <span style={{ color: ink, opacity: 0.3 }}>→</span> {questions.length}
              </p>
              <h2 className="text-3xl font-semibold leading-snug sm:text-4xl" style={{ color: ink }}>
                {current.label}
              </h2>

              <QuestionInput
                question={current}
                value={answers[current.id]}
                onChange={(v) => setAnswer(current.id, v)}
                care={care}
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void goNext()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60",
                    care ? "bg-[#FF4B4B] text-[#04140C]" : "bg-[#8B6F47] text-white",
                  )}
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
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: care ? "rgba(255,75,75,0.12)" : "rgba(139,111,71,0.15)", color: accent }}
              >
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-semibold" style={{ color: ink }}>Merci</h2>
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
  care,
}: {
  question: JessicaQuestionDef;
  value: unknown;
  onChange: (v: unknown) => void;
  care?: boolean;
}) {
  const selected = care
    ? "border-[#FF4B4B] bg-[#FF4B4B] text-[#04140C]"
    : "border-[#8B6F47] bg-[#8B6F47] text-white";
  const idle = care
    ? "border-[#E5E5EA] bg-white text-[#07080B] hover:border-[#FF4B4B]/50"
    : "border-[#E6D9C6] bg-white text-[#2F2A25] hover:border-[#8B6F47]/40";
  if (question.type === "text") {
    return (
      <textarea
        autoFocus
        rows={4}
        className={cn(
          "w-full resize-none border-b-2 bg-transparent text-xl outline-none",
          care
            ? "border-[#FF4B4B]/40 text-[#07080B] placeholder:text-[#07080B]/30 focus:border-[#FF4B4B]"
            : "border-[#8B6F47]/40 text-[#2F2A25] placeholder:text-[#2F2A25]/30 focus:border-[#8B6F47]",
        )}
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
              String(value) === String(n) ? selected : idle,
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
              value === opt.v ? selected : idle,
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
          value ? selected : idle,
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
            value === opt ? selected : idle,
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
