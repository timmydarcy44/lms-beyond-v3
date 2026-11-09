"use client";

import { useMemo, useState } from "react";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

const BG = "#0B0D12";
const CARD = "#151821";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#F4F5F7";
const MUTED = "#8B90A0";
const ACCENT = "#FFFFFF";
const ACCENT_FG = "#0B0D12";
const CHIP = "#1C2030";

export type RevolutAssessmentProps = {
  title: string;
  courseTitle?: string | null;
  questions: AssessmentQuestion[];
  initialAnswers?: Record<string, unknown>;
  /** Preview CMS : pas d'appel API */
  preview?: boolean;
  alreadyDone?: boolean;
  initialScore?: number | null;
  onPersist?: (
    answers: Record<string, unknown>,
    complete: boolean,
  ) => Promise<{ score_pct?: number | null } | void>;
};

export function RevolutAssessment({
  title,
  courseTitle,
  questions,
  initialAnswers = {},
  preview = false,
  alreadyDone = false,
  initialScore = null,
  onPersist,
}: RevolutAssessmentProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyDone);
  const [score, setScore] = useState<number | null>(initialScore);

  const total = questions.length;
  const question = questions[index];
  const progress = total ? Math.round(((index + (done ? 1 : 0)) / total) * 100) : 0;
  const value = question ? answers[question.id] : undefined;

  const canNext = useMemo(() => {
    if (!question) return false;
    if (question.type === "section") return true;
    if (question.type === "text") return true;
    if (question.type === "multi") return Array.isArray(value) && value.length > 0;
    return value != null && value !== "";
  }, [question, value]);

  const setValue = (next: unknown) => {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: next }));
  };

  const toggleMulti = (opt: string) => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    if (opt === "Aucun frein") {
      setValue(["Aucun frein"]);
      return;
    }
    const withoutNone = current.filter((x) => x !== "Aucun frein");
    if (withoutNone.includes(opt)) {
      setValue(withoutNone.filter((x) => x !== opt));
    } else {
      setValue([...withoutNone, opt]);
    }
  };

  const goNext = async () => {
    if (!question) return;
    setBusy(true);
    setError(null);
    try {
      const isLast = index >= total - 1;
      const snapshot = { ...answers };
      if (onPersist && !preview) {
        const result = await onPersist(
          isLast ? snapshot : { [question.id]: snapshot[question.id] },
          isLast,
        );
        if (isLast) {
          setDone(true);
          if (result?.score_pct != null) setScore(Number(result.score_pct));
        }
      } else if (isLast) {
        setDone(true);
      }
      if (!isLast) setIndex((i) => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ background: BG, color: TEXT }}>
        <div className="mx-auto max-w-md text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: ACCENT, color: ACCENT_FG }}
          >
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Merci</h1>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>
            {title} enregistré
            {courseTitle ? ` · ${courseTitle}` : ""}.
          </p>
          {score != null ? (
            <p className="mt-4 text-base font-medium">Score indicatif · {score}&nbsp;%</p>
          ) : null}
          {preview ? (
            <p className="mt-6 text-xs" style={{ color: MUTED }}>
              Mode aperçu — aucune réponse n&apos;a été enregistrée.
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: BG, color: TEXT }}>
      <div className="mx-auto flex min-h-[88vh] max-w-md flex-col">
        {preview ? (
          <p
            className="mb-3 rounded-full px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: CHIP, color: MUTED }}
          >
            Aperçu apprenant
          </p>
        ) : null}

        <header className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            {title}
            {courseTitle ? ` · ${courseTitle}` : ""}
          </p>
          <div className="mt-4 h-1 overflow-hidden rounded-full" style={{ background: BORDER }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(progress, 6)}%`, background: ACCENT }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: MUTED }}>
            {index + 1} / {total}
          </p>
        </header>

        {question ? (
          <section
            className="flex flex-1 flex-col rounded-[28px] p-6"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            {question.sectionLabel ? (
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                {question.sectionLabel}
              </p>
            ) : null}
            <h1 className="text-[26px] font-semibold leading-[1.2] tracking-tight">{question.prompt}</h1>

            <div className="mt-8 flex flex-1 flex-col gap-2.5">
              {question.type === "section" ? (
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                  Appuyez sur Continuer pour commencer.
                </p>
              ) : null}

              {question.type === "nps" || question.type === "scale"
                ? (() => {
                    const min = question.min ?? (question.type === "nps" ? 0 : 1);
                    const max = question.max ?? (question.type === "nps" ? 10 : 5);
                    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                    return (
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                        {nums.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setValue(n)}
                            className="flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold transition"
                            style={{
                              background: value === n ? ACCENT : CHIP,
                              color: value === n ? ACCENT_FG : TEXT,
                              border: `1px solid ${BORDER}`,
                              minHeight: 44,
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    );
                  })()
                : null}

              {question.type === "single"
                ? (question.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setValue(opt)}
                      className="rounded-2xl px-4 py-4 text-left text-[15px] font-medium transition"
                      style={{
                        background: value === opt ? ACCENT : CHIP,
                        color: value === opt ? ACCENT_FG : TEXT,
                        border: `1px solid ${BORDER}`,
                        minHeight: 52,
                      }}
                    >
                      {opt}
                    </button>
                  ))
                : null}

              {question.type === "multi"
                ? (question.options ?? []).map((opt) => {
                    const selected = Array.isArray(value) && value.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMulti(opt)}
                        className="rounded-2xl px-4 py-4 text-left text-[15px] font-medium transition"
                        style={{
                          background: selected ? ACCENT : CHIP,
                          color: selected ? ACCENT_FG : TEXT,
                          border: `1px solid ${BORDER}`,
                          minHeight: 52,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })
                : null}

              {question.type === "text" ? (
                <textarea
                  value={String(value ?? "")}
                  onChange={(e) => setValue(e.target.value)}
                  rows={5}
                  placeholder="Votre réponse…"
                  className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
                  style={{
                    background: CHIP,
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                    minHeight: 120,
                  }}
                />
              ) : null}
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <button
              type="button"
              disabled={busy || !canNext}
              onClick={() => void goNext()}
              className="mt-8 w-full rounded-full py-4 text-[15px] font-semibold disabled:opacity-35"
              style={{ background: ACCENT, color: ACCENT_FG, minHeight: 52 }}
            >
              {index >= total - 1 ? "Terminer" : question.type === "section" ? "Continuer" : "Suivant"}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
