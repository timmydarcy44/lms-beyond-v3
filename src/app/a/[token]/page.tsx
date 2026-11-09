"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RevolutAssessment } from "@/components/formation-assessments/revolut-assessment";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/formation-assessments/${encodeURIComponent(token)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Lien invalide");
      return;
    }
    setData(json as Payload);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#0B0D12] px-4 py-10 text-red-300">
        <p className="text-sm">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0B0D12] px-4 py-10 text-[#8B90A0]">Chargement…</main>
    );
  }

  return (
    <RevolutAssessment
      key={token}
      title={data.title}
      courseTitle={data.course_title}
      questions={data.questions}
      initialAnswers={data.answers || {}}
      alreadyDone={data.status === "completed"}
      initialScore={data.score_pct}
      onPersist={async (answers, complete) => {
        const res = await fetch(`/api/formation-assessments/${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, complete }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
        return { score_pct: json.score_pct };
      }}
    />
  );
}
