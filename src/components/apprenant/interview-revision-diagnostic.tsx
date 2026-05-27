"use client";

import { useCallback, useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RevisionLessonItem } from "@/lib/apprenant/interview-revision-outline";

type DiagnosticQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  lessonId: string;
  topic: string;
};

type InterviewRevisionDiagnosticProps = {
  contextText: string;
  interviewObjectives?: string;
  chapterTitle: string;
  revisionItems: RevisionLessonItem[];
  onBack: () => void;
  onStartInterview: () => void;
  onOpenLesson: (href: string) => void;
};

export function InterviewRevisionDiagnostic({
  contextText,
  interviewObjectives,
  chapterTitle,
  revisionItems,
  onBack,
  onStartInterview,
  onOpenLesson,
}: InterviewRevisionDiagnosticProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "quiz" | "result">("idle");
  const [result, setResult] = useState<{
    summary: string;
    recommendedLessonIds: string[];
    wrongCount: number;
    totalCount: number;
  } | null>(null);

  const current = questions[index];

  const startDiagnostic = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/experiential-interview/revision-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          contextText,
          interviewObjectives: interviewObjectives?.trim() || undefined,
          chapterTitle,
          revisionItems: revisionItems.map((r) => ({ id: r.id, title: r.title, kind: r.kind })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Génération impossible");
      const qs = (data.questions ?? []) as DiagnosticQuestion[];
      if (!qs.length) throw new Error("Aucune question générée");
      setQuestions(qs);
      setAnswers({});
      setIndex(0);
      setPhase("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [contextText, interviewObjectives, chapterTitle, revisionItems]);

  const finishDiagnostic = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/experiential-interview/revision-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          contextText,
          interviewObjectives: interviewObjectives?.trim() || undefined,
          chapterTitle,
          revisionItems: revisionItems.map((r) => ({ id: r.id, title: r.title, kind: r.kind })),
          questions,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyse impossible");
      setResult({
        summary: String(data.summary ?? ""),
        recommendedLessonIds: Array.isArray(data.recommendedLessonIds) ? data.recommendedLessonIds : [],
        wrongCount: Number(data.wrongCount ?? 0),
        totalCount: Number(data.totalCount ?? questions.length),
      });
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const pickAnswer = (optionId: string) => {
    if (!current || loading) return;
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    if (index < questions.length - 1) {
      setTimeout(() => setIndex((i) => i + 1), 280);
    } else {
      void finishDiagnostic(next);
    }
  };

  const recommended = result
    ? revisionItems.filter((r) => result.recommendedLessonIds.includes(r.id))
    : [];

  if (phase === "idle") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Un mini-test de 3 à 5 questions pour repérer ce que vous maîtrisez déjà et ce qu&apos;il vaut mieux
          revoir avant l&apos;entretien.
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void startDiagnostic()}
            disabled={loading || revisionItems.length === 0}
            className="rounded-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lancer le mini-test
          </Button>
          <Button type="button" variant="outline" onClick={onBack} className="rounded-full">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "quiz" && current) {
    const progress = Math.round(((index + 1) / questions.length) * 100);
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>
            Question {index + 1} / {questions.length}
          </span>
          <span>{progress} %</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-base font-semibold text-slate-900">{current.question}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {current.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={loading}
                onClick={() => pickAnswer(opt.id)}
                className={cn(
                  "flex min-h-[56px] items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:border-violet-500 hover:bg-white",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
                  {letter}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-800">Bilan express</p>
        <p className="text-sm leading-relaxed text-slate-800">{result.summary}</p>
        <p className="text-xs text-slate-600">
          {result.wrongCount === 0
            ? "Toutes les réponses sont correctes."
            : `${result.wrongCount} réponse(s) à retravailler sur ${result.totalCount}.`}
        </p>
        {recommended.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Nous vous conseillons de revoir
            </p>
            <ul className="space-y-2">
              {recommended.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenLesson(item.href)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 hover:border-violet-400"
                  >
                    <span>{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-violet-600" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            onClick={onStartInterview}
            className="rounded-full bg-violet-600 text-white hover:bg-violet-500"
          >
            <Check className="mr-2 h-4 w-4" />
            Je suis prêt — lancer l&apos;entretien
          </Button>
          <Button type="button" variant="outline" onClick={onBack} className="rounded-full">
            Parcourir le chapitre
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
