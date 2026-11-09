"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

type Props = {
  courseId: string;
  initialTitle: string;
  initialQuestions: AssessmentQuestion[];
  onSaved: (title: string) => void;
  onCancel: () => void;
};

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#635BFF]";
const TEXTAREA = `${INPUT} min-h-[72px] resize-y`;

function blankQuestion(): AssessmentQuestion {
  return {
    id: `q${Date.now().toString(36)}`,
    prompt: "",
    type: "scale",
    min: 1,
    max: 5,
    labels: ["Débutant", "Expert"],
  };
}

export function PositionnementQuestionsEditor({
  courseId,
  initialTitle,
  initialQuestions,
  onSaved,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    initialQuestions.length ? initialQuestions : [blankQuestion()],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (index: number, patch: Partial<AssessmentQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  };

  const save = async () => {
    const cleaned = questions
      .map((q) => ({ ...q, prompt: q.prompt.trim() }))
      .filter((q) => q.prompt.length > 0);
    if (!cleaned.length) {
      setError("Ajoutez au moins une question.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/training-courses/${courseId}/positionnement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, questions: cleaned }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      onSaved(String(json.template?.title || title || "Test de positionnement"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">Modifier le test</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#635BFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7B74FF] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Enregistrer
          </button>
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Titre</span>
        <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <div className="space-y-3">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Question {index + 1}
              </p>
              <button
                type="button"
                onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-red-500"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              className={TEXTAREA}
              value={q.prompt}
              onChange={(e) => update(index, { prompt: e.target.value })}
              placeholder="Énoncé de la question…"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-gray-600">Type</span>
                <select
                  className={INPUT}
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as AssessmentQuestion["type"];
                    if (type === "scale") {
                      update(index, {
                        type,
                        min: 1,
                        max: 5,
                        labels: ["Débutant", "Expert"],
                        options: undefined,
                      });
                    } else if (type === "single") {
                      update(index, {
                        type,
                        options: q.options?.length ? q.options : ["Oui", "Non"],
                        min: undefined,
                        max: undefined,
                        labels: undefined,
                      });
                    } else {
                      update(index, {
                        type: "text",
                        options: undefined,
                        min: undefined,
                        max: undefined,
                        labels: undefined,
                      });
                    }
                  }}
                >
                  <option value="scale">Échelle 1–5</option>
                  <option value="single">Choix unique</option>
                  <option value="text">Texte libre</option>
                </select>
              </label>
              {q.type === "single" ? (
                <label className="block text-xs">
                  <span className="mb-1 block font-medium text-gray-600">
                    Options (une par ligne)
                  </span>
                  <textarea
                    className={TEXTAREA}
                    value={(q.options ?? []).join("\n")}
                    onChange={(e) =>
                      update(index, {
                        options: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter une question
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
