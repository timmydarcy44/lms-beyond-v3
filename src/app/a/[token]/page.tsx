"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

const BG = "#0A0C1B";
const SURFACE = "#141731";
const BORDER = "#262A4A";
const TEXT = "#F3F4FA";
const MUTED = "#A3A8C7";
const ACCENT = "#6C5CF5";
const OK = "#4ADE9B";

type Payload = {
  kind: string;
  title: string;
  status: string;
  score_pct: number | null;
  course_title: string | null;
  questions: AssessmentQuestion[];
  answers: Record<string, unknown>;
};

export default function AssessmentPublicPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [data, setData] = useState<Payload | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/formation-assessments/${encodeURIComponent(token)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Lien invalide");
      return;
    }
    setData(json as Payload);
    setAnswers((json.answers as Record<string, unknown>) || {});
    if (json.status === "completed") {
      setDone(true);
      setScore(json.score_pct != null ? Number(json.score_pct) : null);
    } else {
      const qs = (json.questions as AssessmentQuestion[]) || [];
      const firstUnanswered = qs.findIndex((q) => json.answers?.[q.id] == null || json.answers?.[q.id] === "");
      setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const question = data?.questions[index];
  const total = data?.questions.length ?? 0;
  const progress = total ? Math.round(((index + (done ? 1 : 0)) / total) * 100) : 0;
  const value = question ? answers[question.id] : undefined;
  const canNext =
    question?.type === "text" ||
    (value != null && value !== "");

  const persist = async (nextAnswers: Record<string, unknown>, complete: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/formation-assessments/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: nextAnswers, complete }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      if (complete) {
        setDone(true);
        setScore(json.score_pct != null ? Number(json.score_pct) : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (!question || !data) return;
    const nextAnswers = { ...answers };
    if (index >= total - 1) {
      await persist(nextAnswers, true);
      return;
    }
    await persist({ [question.id]: answers[question.id] }, false);
    setIndex((i) => i + 1);
  };

  if (error && !data) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ background: BG, color: TEXT }}>
        <p className="text-sm text-red-300">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ background: BG, color: MUTED }}>
        Chargement…
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ background: BG, color: TEXT }}>
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
            style={{ background: OK }}
          >
            ✓
          </div>
          <h1 className="text-2xl font-bold">Merci</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {data.title} enregistré
            {data.course_title ? ` · ${data.course_title}` : ""}.
          </p>
          {score != null ? (
            <p className="text-lg font-semibold" style={{ color: "#B7AEFF" }}>
              Score indicatif : {score}&nbsp;%
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: BG, color: TEXT }}>
      <div className="mx-auto flex min-h-[85vh] max-w-md flex-col gap-5">
        <header>
          <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>
            {data.title}
            {data.course_title ? ` · ${data.course_title}` : ""}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: BORDER }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(progress, 8)}%`, background: ACCENT }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: MUTED }}>
            Question {index + 1} / {total}
          </p>
        </header>

        {question ? (
          <section
            className="flex flex-1 flex-col rounded-2xl p-5"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <h1 className="text-xl font-bold leading-snug">{question.prompt}</h1>

            <div className="mt-8 flex flex-1 flex-col gap-3">
              {question.type === "scale" ? (
                <div className="flex justify-between gap-2">
                  {Array.from(
                    { length: (question.max ?? 5) - (question.min ?? 1) + 1 },
                    (_, i) => (question.min ?? 1) + i,
                  ).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [question.id]: n }))}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl text-sm font-semibold"
                      style={{
                        background: value === n ? ACCENT : BG,
                        border: `1px solid ${BORDER}`,
                        color: TEXT,
                        minHeight: 44,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : null}

              {question.type === "scale" && question.labels ? (
                <div className="flex justify-between text-[11px]" style={{ color: MUTED }}>
                  <span>{question.labels[0]}</span>
                  <span>{question.labels[1]}</span>
                </div>
              ) : null}

              {question.type === "single"
                ? (question.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt }))}
                      className="rounded-xl px-4 py-3 text-left text-sm font-medium"
                      style={{
                        background: value === opt ? ACCENT : BG,
                        border: `1px solid ${BORDER}`,
                        color: TEXT,
                        minHeight: 44,
                      }}
                    >
                      {opt}
                    </button>
                  ))
                : null}

              {question.type === "text" ? (
                <textarea
                  value={String(value ?? "")}
                  onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
                  rows={5}
                  className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                  style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
                  placeholder="Votre réponse…"
                />
              ) : null}
            </div>

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

            <button
              type="button"
              disabled={busy || (question.type !== "text" && !canNext)}
              onClick={() => void goNext()}
              className="mt-6 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-40"
              style={{ background: ACCENT, minHeight: 44 }}
            >
              {index >= total - 1 ? "Terminer" : "Suivant"}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
