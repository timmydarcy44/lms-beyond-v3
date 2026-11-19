"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  specialization: string;
  slug: string;
  label: string;
  prompt: string;
  starter_hint: string | null;
  sort_order: number;
  active: boolean;
};

const TRACKS = [
  { value: "common", label: "Question commune" },
  ...CFA_SPECIALIZATIONS.map((s) => ({ value: s.value, label: s.label })),
  { value: "_fallback", label: "Secours (autres filières)" },
];

export function AdmissionQuestionsAdmin() {
  const [track, setTrack] = useState("ai_business");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [common, setCommon] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/admissions/questions?track=${encodeURIComponent(track)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
      setCommon(data.common ?? []);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  const preview = useMemo(() => [...common, ...questions].slice(0, 3), [common, questions]);

  async function saveQuestion(question: Question) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/admissions/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage("Enregistré (nouvelle version créée si le texte a changé).");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Banque de questions candidature</h1>
        <p className="mt-2 text-sm text-neutral-500">
          1 question commune + 2 questions propres à la filière. Chaque modification versionne la
          question pour le jury.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRACKS.filter((t) => t.value !== "common").map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTrack(t.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              track === t.value ? "border-violet-500 bg-violet-50 text-violet-800" : "border-neutral-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-violet-700">{message}</p> : null}
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Question commune</h2>
            {common.map((q) => (
              <QuestionEditor key={q.id} question={q} busy={busy} onSave={saveQuestion} />
            ))}
            <h2 className="pt-4 text-lg font-semibold">Questions {track}</h2>
            {questions.map((q) => (
              <QuestionEditor key={q.id} question={q} busy={busy} onSave={saveQuestion} />
            ))}
            {!questions.length ? (
              <p className="text-sm text-neutral-500">
                Aucune question propre — le secours `_fallback` sera utilisé côté candidat.
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-lg font-semibold">Aperçu candidat</h2>
            <div className="mt-4 space-y-4">
              {preview.map((q, index) => (
                <div key={q.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-violet-600">
                    {index + 1} · {q.label}
                  </p>
                  <p className="mt-2 text-sm font-medium">{q.prompt}</p>
                  <p className="mt-2 text-xs text-neutral-400">{q.starter_hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  question,
  busy,
  onSave,
}: {
  question: Question;
  busy: boolean;
  onSave: (q: Question) => void;
}) {
  const [draft, setDraft] = useState(question);
  useEffect(() => setDraft(question), [question]);

  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <input
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          />
          Active
        </label>
      </div>
      <textarea
        className="mt-3 min-h-[88px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        value={draft.prompt}
        onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
      />
      <input
        className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        placeholder="Exemple de début de réponse"
        value={draft.starter_hint ?? ""}
        onChange={(e) => setDraft({ ...draft, starter_hint: e.target.value })}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(draft)}
        className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Enregistrer
      </button>
    </div>
  );
}
