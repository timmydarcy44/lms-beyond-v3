"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { workshopMaxImprovements } from "@/lib/workshops/workshop-block";
import type { WorkshopConfig } from "@/types/course-builder";

type Feedback = {
  criteres: { critere: string; statut: "reussi" | "a_ameliorer"; commentaire: string; suggestion: string }[];
  commentaire_global: string;
};

type OutputPayload = {
  final?: boolean;
  answers?: Record<string, string>;
  feedback?: Feedback | null;
  feedbackCount?: number;
  error?: string;
};

const PROJECT_HREF = "/dashboard/apprenant/mon-projet-expert";

function isFeedback(value: unknown): value is Feedback {
  if (!value || typeof value !== "object") return false;
  const row = value as Feedback;
  return Array.isArray(row.criteres) && typeof row.commentaire_global === "string";
}

export function WorkshopLearnerView({
  courseId,
  blockId,
  workshop,
}: {
  courseId: string;
  blockId: string;
  workshop: WorkshopConfig;
}) {
  const fields = useMemo(
    () => (workshop.fields ?? []).filter((field) => field.id && (field.label.trim() || field.placeholder?.trim())),
    [workshop.fields],
  );
  const visibleFields = fields.length > 0 ? fields : (workshop.fields ?? []).filter((field) => field.id);
  const criteria = (workshop.criteria ?? []).map((item) => item.label.trim()).filter(Boolean);
  const max = workshopMaxImprovements(workshop);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [busy, setBusy] = useState<"feedback" | "final" | null>(null);
  const [notice, setNotice] = useState("");
  const savedRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const lockedRef = useRef(false);
  const holdRef = useRef(false);
  answersRef.current = answers;
  lockedRef.current = locked;

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ courseId, blockId });
    fetch(`/api/workshops/output?${params.toString()}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as OutputPayload;
      })
      .then((payload) => {
        if (ignore || !payload) {
          if (!ignore) setHydrated(true);
          return;
        }
        const next = payload.answers ?? {};
        savedRef.current = JSON.stringify(next);
        setAnswers(next);
        setFeedback(isFeedback(payload.feedback) ? payload.feedback : null);
        setFeedbackCount(payload.feedbackCount ?? 0);
        setLocked(Boolean(payload.final));
        setHydrated(true);
      })
      .catch(() => {
        if (!ignore) setHydrated(true);
      });
    return () => {
      ignore = true;
    };
  }, [blockId, courseId]);

  useEffect(() => {
    if (!hydrated || locked) return;
    const serialized = JSON.stringify(answers);
    if (serialized === savedRef.current || holdRef.current) return;
    timerRef.current = window.setTimeout(() => {
      void persist(answers, false);
    }, 2000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [answers, hydrated, locked]);

  useEffect(() => {
    return () => {
      if (lockedRef.current || holdRef.current) return;
      const current = answersRef.current;
      const serialized = JSON.stringify(current);
      if (serialized === savedRef.current) return;
      void fetch("/api/workshops/output", {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers: current }),
      });
    };
  }, [blockId, courseId]);

  async function persist(next: Record<string, string>, silent: boolean) {
    if (lockedRef.current) return;
    const serialized = JSON.stringify(next);
    if (serialized === savedRef.current) return;
    if (!silent) setSaveState("saving");
    const response = await fetch("/api/workshops/output", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, blockId, answers: next }),
    });
    const payload = (await response.json().catch(() => null)) as OutputPayload | null;
    if (response.status === 409 && payload?.final) {
      savedRef.current = JSON.stringify(payload.answers ?? next);
      setLocked(true);
      setFeedback(isFeedback(payload.feedback) ? payload.feedback : null);
      setSaveState("saved");
      return;
    }
    if (!response.ok) {
      if (!silent) setSaveState("error");
      return;
    }
    savedRef.current = serialized;
    if (!silent) setSaveState("saved");
  }

  async function requestFeedback() {
    if (locked || busy) return;
    if (!Object.values(answers).some((item) => item.trim())) {
      setNotice("Écrivez une réponse avant de demander un retour.");
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    holdRef.current = true;
    setBusy("feedback");
    setNotice("");
    try {
      await persist(answers, true);
      const response = await fetch("/api/ai/workshop-feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers }),
      });
      const payload = (await response.json().catch(() => null)) as { feedback?: Feedback; error?: string } | null;
      if (!response.ok || !isFeedback(payload?.feedback)) {
        setNotice(payload?.error || "Le retour n'a pas pu être préparé. Relancez.");
        return;
      }
      setFeedback(payload.feedback);
      setFeedbackCount((count) => count + 1);
      savedRef.current = JSON.stringify(answers);
      setSaveState("saved");
    } finally {
      holdRef.current = false;
      setBusy(null);
      const current = answersRef.current;
      if (!lockedRef.current && JSON.stringify(current) !== savedRef.current) void persist(current, false);
    }
  }

  async function validateAnswer() {
    if (locked || busy) return;
    if (!Object.values(answers).some((item) => item.trim())) {
      setNotice("Écrivez une réponse avant de la valider.");
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    holdRef.current = true;
    setBusy("final");
    setNotice("");
    try {
      const response = await fetch("/api/workshops/output", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers }),
      });
      const payload = (await response.json().catch(() => null)) as OutputPayload | null;
      if (!response.ok || !payload?.final) {
        setNotice(payload?.error || "La validation n'a pas abouti. Relancez.");
        return;
      }
      savedRef.current = JSON.stringify(payload.answers ?? answers);
      setAnswers(payload.answers ?? answers);
      setFeedback(isFeedback(payload.feedback) ? payload.feedback : feedback);
      lockedRef.current = true;
      setLocked(true);
      setSaveState("saved");
    } finally {
      holdRef.current = false;
      setBusy(null);
      const current = answersRef.current;
      if (!lockedRef.current && JSON.stringify(current) !== savedRef.current) void persist(current, false);
    }
  }

  const usedImprovements = Math.max(0, feedbackCount - (feedback ? 1 : 0));
  const remaining = Math.max(0, max - usedImprovements);
  const remainingLabel = remaining === 1 ? "1 essai restant" : `${remaining} essais restants`;
  const hasAnswer = Object.values(answers).some((item) => item.trim().length > 0);

  return (
    <section className="workshop-learner mx-auto flex w-full max-w-3xl flex-col gap-6 text-base leading-relaxed text-[var(--r-text,#1f1d1a)]" data-workshop="atelier">
      {workshop.brief?.trim() ? (
        <div>
          <h2 className="text-sm font-semibold text-[var(--r-muted,#5f5a50)]">Consigne</h2>
          <p className="mt-2 whitespace-pre-wrap text-[var(--r-body,#2a2825)]">{workshop.brief.trim()}</p>
        </div>
      ) : null}

      {workshop.situation?.trim() ? (
        <div className="rounded-2xl border border-[var(--r-border,#e3e0d8)] bg-[var(--r-surface,#fff)] p-4">
          <h2 className="text-sm font-semibold text-[var(--r-muted,#5f5a50)]">Mise en situation</h2>
          <p className="mt-2 whitespace-pre-wrap text-[var(--r-body,#2a2825)]">{workshop.situation.trim()}</p>
        </div>
      ) : null}

      {workshop.example?.trim() ? (
        <details className="rounded-2xl border border-[var(--r-border,#e3e0d8)] bg-[var(--r-surface,#fff)] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--r-text,#1f1d1a)]">Exemple résolu</summary>
          <p className="mt-3 whitespace-pre-wrap text-[var(--r-body,#2a2825)]">{workshop.example.trim()}</p>
        </details>
      ) : null}

      {criteria.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-[var(--r-muted,#5f5a50)]">Critères de réussite</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--r-body,#2a2825)]">
            {criteria.map((label, index) => (
              <li key={`${label}-${index}`}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--r-muted,#5f5a50)]">Votre réponse</h2>
          <p className="text-sm text-[var(--r-muted,#5f5a50)]" aria-live="polite">
            {saveState === "saving" ? "Enregistrement…" : saveState === "saved" ? "Enregistré" : saveState === "error" ? "Enregistrement interrompu" : ""}
          </p>
        </div>
        {visibleFields.map((field) => (
          <label key={field.id} className="flex flex-col gap-2">
            <span className="font-medium">{field.label.trim() || "Réponse"}</span>
            {field.type === "short" ? (
              <input
                value={answers[field.id] ?? ""}
                disabled={locked}
                placeholder={field.placeholder || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
                className="min-h-12 w-full rounded-2xl border border-[var(--r-border,#e3e0d8)] bg-[var(--r-surface,#fff)] px-4 text-base text-[var(--r-text,#1f1d1a)] outline-none focus:border-[#6E5BFF] disabled:opacity-80"
              />
            ) : (
              <textarea
                value={answers[field.id] ?? ""}
                disabled={locked}
                placeholder={field.placeholder || ""}
                rows={6}
                onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
                className="field-sizing-fixed min-h-36 w-full resize-y rounded-2xl border border-[var(--r-border,#e3e0d8)] bg-[var(--r-surface,#fff)] px-4 py-3 text-base text-[var(--r-text,#1f1d1a)] outline-none focus:border-[#6E5BFF] disabled:opacity-80"
              />
            )}
          </label>
        ))}
      </div>

      {feedback ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--r-muted,#5f5a50)]">Retour</h2>
          {feedback.criteres.map((item, index) => {
            const passed = item.statut === "reussi";
            return (
              <article
                key={`${item.critere}-${index}`}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: passed ? "rgba(47,208,138,0.45)" : "rgba(228,168,74,0.55)",
                  background: passed ? "rgba(47,208,138,0.08)" : "rgba(228,168,74,0.1)",
                }}
              >
                <p className="font-semibold">{item.critere}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: passed ? "#2FD08A" : "#E4A84A" }}>
                  {passed ? "Réussi" : "À améliorer"}
                </p>
                {item.commentaire ? <p className="mt-2 whitespace-pre-wrap text-[var(--r-body,#2a2825)]">{item.commentaire}</p> : null}
                {item.suggestion ? (
                  <p className="mt-2 whitespace-pre-wrap text-[var(--r-body,#2a2825)]">
                    <span className="font-semibold">Suggestion. </span>
                    {item.suggestion}
                  </p>
                ) : null}
              </article>
            );
          })}
          {feedback.commentaire_global ? (
            <p className="whitespace-pre-wrap text-[var(--r-body,#2a2825)]">{feedback.commentaire_global}</p>
          ) : null}
        </div>
      ) : null}

      {notice ? <p className="text-sm text-[#E4A84A]">{notice}</p> : null}

      {locked ? (
        <div className="rounded-2xl border border-[#2FD08A]/40 bg-[#2FD08A]/10 p-4">
          <p className="font-semibold">Votre réponse est validée.</p>
          <p className="mt-1 text-[var(--r-body,#2a2825)]">Elle est enregistrée dans votre dossier.</p>
          <Link href={PROJECT_HREF} className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#6E5BFF] underline-offset-4 hover:underline">
            Mon projet expert
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {feedbackCount === 0 ? (
            <button
              type="button"
              disabled={!hasAnswer || busy !== null}
              onClick={() => void requestFeedback()}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#6E5BFF] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === "feedback" ? "Préparation du retour…" : "Obtenir un retour"}
            </button>
          ) : remaining > 0 ? (
            <button
              type="button"
              disabled={!hasAnswer || busy !== null}
              onClick={() => void requestFeedback()}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#6E5BFF] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === "feedback" ? "Préparation du retour…" : `Améliorer ma réponse · ${remainingLabel}`}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!hasAnswer || busy !== null}
            onClick={() => void validateAnswer()}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--r-border,#e3e0d8)] bg-[var(--r-surface,#fff)] px-5 text-sm font-semibold text-[var(--r-text,#1f1d1a)] disabled:opacity-50"
          >
            {busy === "final" ? "Validation…" : "Valider ma réponse"}
          </button>
        </div>
      )}
    </section>
  );
}
