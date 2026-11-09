"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RevolutAssessment } from "@/components/formation-assessments/revolut-assessment";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

function PreviewInner() {
  const search = useSearchParams();
  const kind = (search.get("kind") || "positionnement").trim();
  const courseId = (search.get("courseId") || "").trim();
  const [title, setTitle] = useState("Aperçu");
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const q = new URLSearchParams({ kind });
      if (courseId) q.set("courseId", courseId);
      const res = await fetch(`/api/formation-assessments/preview?${q.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Aperçu impossible");
        return;
      }
      setTitle(String(json.title || kind));
      setCourseTitle(json.course_title ? String(json.course_title) : null);
      setQuestions((json.questions as AssessmentQuestion[]) || []);
    })();
  }, [kind, courseId]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#0B0D12] px-4 py-10 text-red-300">
        <p className="text-sm">{error}</p>
      </main>
    );
  }
  if (!questions.length) {
    return (
      <main className="min-h-screen bg-[#0B0D12] px-4 py-10 text-[#8B90A0]">Chargement…</main>
    );
  }

  return (
    <RevolutAssessment
      title={title}
      courseTitle={courseTitle}
      questions={questions}
      preview
    />
  );
}

export default function AssessmentPreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0B0D12] px-4 py-10 text-[#8B90A0]">Chargement…</main>
      }
    >
      <PreviewInner />
    </Suspense>
  );
}
