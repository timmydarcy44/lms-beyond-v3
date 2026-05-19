"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import TestFlow from "@/app/dashboard/student/learning/tests/[slug]/test-flow";
import { normalizeTestQuestions } from "@/lib/tests/normalize-test-questions";

export function LmsQuizByTestId({ testId }: { testId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Quiz");
  const [questions, setQuestions] = useState<any[]>([]);
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tests/${encodeURIComponent(testId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Chargement impossible");
        const test = data.test;
        if (!test?.questions || !Array.isArray(test.questions)) {
          throw new Error("Ce quiz ne contient pas encore de questions.");
        }
        if (!ignore) {
          setTitle(String(test.title ?? "Quiz"));
          setQuestions(test.questions);
          const sm = test?.scoring?.score_minimum ?? test?.scoring?.scoreMinimum;
          if (typeof sm === "number" && !Number.isNaN(sm)) setMinScore(Math.min(100, Math.max(0, sm)));
        }
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [testId]);

  const mapped = useMemo(() => normalizeTestQuestions(questions), [questions]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-slate-600">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm">Chargement du quiz…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-lg font-semibold text-slate-900">Impossible d&apos;afficher ce quiz</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">{error}</p>
      </div>
    );
  }

  const markQuizDone = () => {
    try {
      sessionStorage.setItem(`lms:quiz-done:${testId}`, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <TestFlow
      slug={testId}
      title={title}
      questions={mapped}
      summary="Merci d’avoir complété ce quiz."
      fullscreen
      minScorePercent={minScore}
      immersive
      onQuizCompleted={markQuizDone}
    />
  );
}
