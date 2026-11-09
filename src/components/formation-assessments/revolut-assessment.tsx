"use client";

import { useMemo, useState } from "react";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

/** Palette type Revolut — violet, overlays, contraste chaud. */
const PURPLE = "#7B61FF";
const PURPLE_DEEP = "#5B3DF5";
const PURPLE_SOFT = "rgba(123, 97, 255, 0.18)";
const PURPLE_GLOW = "rgba(123, 97, 255, 0.45)";
const BG = "#0A0618";
const CARD = "rgba(28, 18, 52, 0.72)";
const CARD_BORDER = "rgba(167, 139, 250, 0.28)";
const TEXT = "#F7F5FF";
const MUTED = "#B7A9D9";
const CHIP = "rgba(255,255,255,0.06)";
const CHIP_HOVER = "rgba(123, 97, 255, 0.22)";
const WHITE = "#FFFFFF";

export type RevolutAssessmentProps = {
  title: string;
  courseTitle?: string | null;
  kind?: string | null;
  firstName?: string | null;
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6"
      style={{ background: BG, color: TEXT }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl"
        style={{ background: PURPLE_GLOW, opacity: 0.55 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(236, 72, 153, 0.28)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "rgba(99, 102, 241, 0.18)" }}
      />
      <div className="relative mx-auto flex min-h-[88vh] max-w-md flex-col">{children}</div>
    </main>
  );
}

function thankYouCopy(params: {
  kind?: string | null;
  firstName?: string | null;
  courseTitle?: string | null;
  title: string;
}): { headline: string; body: string } {
  const name = (params.firstName || "").trim();
  if (params.kind === "positionnement") {
    return {
      headline: name ? `Merci ${name}` : "Merci",
      body: name
        ? `Nous sommes ravis de pouvoir vous accompagner dans cette formation${params.courseTitle ? ` « ${params.courseTitle} »` : ""}.`
        : `Nous sommes ravis de pouvoir vous accompagner dans cette formation${params.courseTitle ? ` « ${params.courseTitle} »` : ""}.`,
    };
  }
  return {
    headline: name ? `Merci ${name}` : "Merci",
    body: `${params.title} enregistré${params.courseTitle ? ` · ${params.courseTitle}` : ""}.`,
  };
}

export function RevolutAssessment({
  title,
  courseTitle,
  kind,
  firstName,
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
    const copy = thankYouCopy({ kind, firstName, courseTitle, title });
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-12 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold shadow-[0_0_40px_rgba(123,97,255,0.55)]"
            style={{
              background: `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`,
              color: WHITE,
            }}
          >
            ✓
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight">{copy.headline}</h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed" style={{ color: MUTED }}>
            {copy.body}
          </p>
          {score != null && kind === "positionnement" ? (
            <p className="mt-5 text-sm font-medium" style={{ color: PURPLE }}>
              Score indicatif · {score}&nbsp;%
            </p>
          ) : null}
          {score != null && kind !== "positionnement" ? (
            <p className="mt-5 text-sm font-medium" style={{ color: PURPLE }}>
              Score indicatif · {score}&nbsp;%
            </p>
          ) : null}
          {preview ? (
            <p className="mt-8 text-xs" style={{ color: MUTED }}>
              Mode aperçu — aucune réponse n&apos;a été enregistrée.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {preview ? (
        <p
          className="mb-3 self-center rounded-full px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: PURPLE_SOFT, color: "#D6CCFF", border: `1px solid ${CARD_BORDER}` }}
        >
          Aperçu apprenant
        </p>
      ) : null}

      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>
          {title}
          {courseTitle ? ` · ${courseTitle}` : ""}
        </p>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(progress, 8)}%`,
              background: `linear-gradient(90deg, ${PURPLE}, #C084FC)`,
              boxShadow: `0 0 12px ${PURPLE_GLOW}`,
            }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: MUTED }}>
          {index + 1} / {total}
        </p>
      </header>

      {question ? (
        <section
          className="flex flex-1 flex-col rounded-[28px] p-6 backdrop-blur-xl"
          style={{
            background: CARD,
            border: `1px solid ${CARD_BORDER}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {question.sectionLabel ? (
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "#C4B5FD" }}
            >
              {question.sectionLabel}
            </p>
          ) : null}
          <h1 className="text-[26px] font-semibold leading-[1.25] tracking-tight">
            {question.prompt}
          </h1>

          <div className="mt-8 flex flex-1 flex-col gap-3">
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
                  /** Likert courte : lignes pleine largeur (évite les mauvais taps). NPS : grille aérée. */
                  const vertical = nums.length <= 6;
                  const lowLabel =
                    question.labels?.[0] || (question.type === "nps" ? "Pas du tout" : null);
                  const highLabel =
                    question.labels?.[1] || (question.type === "nps" ? "Tout à fait" : null);
                  return (
                    <div className="flex flex-col gap-3">
                      {(lowLabel || highLabel) && !vertical ? (
                        <div
                          className="flex justify-between gap-3 text-[11px] font-medium"
                          style={{ color: MUTED }}
                        >
                          <span>{lowLabel}</span>
                          <span className="text-right">{highLabel}</span>
                        </div>
                      ) : null}
                      <div
                        className={
                          vertical
                            ? "flex flex-col gap-2.5"
                            : "grid grid-cols-3 gap-3 sm:grid-cols-4"
                        }
                      >
                        {nums.map((n) => {
                          const selected = value === n;
                          const sideLabel =
                            vertical && n === min && lowLabel
                              ? lowLabel
                              : vertical && n === max && highLabel
                                ? highLabel
                                : null;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setValue(n)}
                              className={
                                vertical
                                  ? "flex w-full items-center gap-4 rounded-2xl px-4 text-left transition active:scale-[0.99]"
                                  : "flex items-center justify-center rounded-2xl text-lg font-semibold transition active:scale-[0.97]"
                              }
                              style={{
                                background: selected
                                  ? `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`
                                  : CHIP,
                                color: selected ? WHITE : TEXT,
                                border: selected
                                  ? `1px solid ${PURPLE}`
                                  : "1px solid rgba(255,255,255,0.1)",
                                minHeight: vertical ? 60 : 58,
                                boxShadow: selected
                                  ? `0 8px 24px ${PURPLE_GLOW}`
                                  : "none",
                              }}
                            >
                              {vertical ? (
                                <>
                                  <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                                    style={{
                                      background: selected
                                        ? "rgba(255,255,255,0.18)"
                                        : PURPLE_SOFT,
                                      color: selected ? WHITE : "#D6CCFF",
                                    }}
                                  >
                                    {n}
                                  </span>
                                  <span
                                    className="text-[15px] font-medium"
                                    style={{ color: selected ? WHITE : MUTED }}
                                  >
                                    {sideLabel || "\u00A0"}
                                  </span>
                                </>
                              ) : (
                                n
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              : null}

            {question.type === "single"
              ? (question.options ?? []).map((opt) => {
                  const selected = value === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setValue(opt)}
                      className="rounded-2xl px-4 py-4 text-left text-[15px] font-medium transition active:scale-[0.99]"
                      style={{
                        background: selected
                          ? `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`
                          : CHIP,
                        color: selected ? WHITE : TEXT,
                        border: selected
                          ? `1px solid ${PURPLE}`
                          : "1px solid rgba(255,255,255,0.1)",
                        minHeight: 56,
                        boxShadow: selected ? `0 8px 24px ${PURPLE_GLOW}` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = CHIP_HOVER;
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = CHIP;
                      }}
                    >
                      {opt}
                    </button>
                  );
                })
              : null}

            {question.type === "multi"
              ? (question.options ?? []).map((opt) => {
                  const selected = Array.isArray(value) && value.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMulti(opt)}
                      className="rounded-2xl px-4 py-4 text-left text-[15px] font-medium transition active:scale-[0.99]"
                      style={{
                        background: selected
                          ? `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`
                          : CHIP,
                        color: selected ? WHITE : TEXT,
                        border: selected
                          ? `1px solid ${PURPLE}`
                          : "1px solid rgba(255,255,255,0.1)",
                        minHeight: 56,
                        boxShadow: selected ? `0 8px 24px ${PURPLE_GLOW}` : "none",
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
                className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none placeholder:text-[#8B7DB8]"
                style={{
                  background: CHIP,
                  border: `1px solid ${CARD_BORDER}`,
                  color: TEXT,
                  minHeight: 128,
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
            style={{
              background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`,
              color: WHITE,
              minHeight: 54,
              boxShadow: canNext ? `0 10px 28px ${PURPLE_GLOW}` : "none",
            }}
          >
            {index >= total - 1
              ? "Terminer"
              : question.type === "section"
                ? "Continuer"
                : "Suivant"}
          </button>
        </section>
      ) : null}
    </Shell>
  );
}
