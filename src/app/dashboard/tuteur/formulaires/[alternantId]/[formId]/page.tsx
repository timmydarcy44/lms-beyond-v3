"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";
import { Button } from "@/components/ui/button";

type QuestionRow = {
  id: string;
  question: string;
  question_type: string;
  order_index: number;
  metadata: unknown;
};

type ResponseRow = {
  id: string;
  question_id: string;
  response: unknown;
};

export default function TutorLearnerFormDetailPage() {
  const { alternantId, formId } = useParams<{ alternantId: string; formId: string }>();
  const ws = useTutorWorkspace();
  const tutorName = ws.data?.tutorName ?? "Tuteur";

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!alternantId || !formId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tuteur/assignments/${alternantId}/forms/${formId}`, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Impossible de charger le formulaire");
        setQuestions([]);
        return;
      }
      const json = (await res.json()) as {
        form: { title: string };
        questions: QuestionRow[];
        responses: ResponseRow[];
      };
      setTitle(json.form?.title ?? "Formulaire");
      setQuestions(json.questions ?? []);
      const next: Record<string, string> = {};
      for (const q of json.questions ?? []) {
        const existing = json.responses?.find((r) => r.question_id === q.id);
        const raw = existing?.response;
        if (raw && typeof raw === "object" && raw !== null && "text" in raw) {
          next[q.id] = String((raw as { text?: string }).text ?? "");
        } else if (typeof raw === "string") {
          next[q.id] = raw;
        } else {
          next[q.id] = "";
        }
      }
      setAnswers(next);
    } finally {
      setLoading(false);
    }
  }, [alternantId, formId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          response: { text: answers[q.id] ?? "" },
        })),
      };
      const res = await fetch(`/api/tuteur/assignments/${alternantId}/forms/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Enregistrement impossible");
        return;
      }
      toast.success("Formulaire enregistré");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <TuteurShell tutorName={tutorName} navBadges={{ missions: ws.data?.kpis.pendingMissionActions }}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href={`/dashboard/tuteur/formulaires/${alternantId}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">{title || "Formulaire"}</h1>
            <p className="text-sm text-gray-500 mt-2">Répondez aux questions puis enregistrez.</p>
          </div>

          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}

          {!loading && questions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-gray-500 text-sm">
              Ce formulaire ne contient pas encore de questions (configuration côté organisme).
            </div>
          ) : null}

          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6">
                <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                <textarea
                  className="mt-3 w-full min-h-[100px] rounded-xl border border-gray-200 p-3 text-sm text-gray-800"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Votre réponse…"
                />
              </div>
            ))}
          </div>

          {questions.length > 0 ? (
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => load()}>
                Annuler les modifications
              </Button>
              <Button type="button" disabled={saving} onClick={() => void submit()}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </TuteurShell>
  );
}
