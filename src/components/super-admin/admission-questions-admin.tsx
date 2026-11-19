"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Wand2 } from "lucide-react";

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

type Proposal = {
  label: string;
  prompt: string;
  starter_hint: string;
};

const TRACKS = [
  ...CFA_SPECIALIZATIONS.map((s) => ({ value: s.value, label: s.label, group: s.group })),
  { value: "_fallback", label: "Secours (autres filières)", group: "Système" },
];

export function AdmissionQuestionsAdmin() {
  const [track, setTrack] = useState("ai_business");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [common, setCommon] = useState<Question[]>([]);
  const [trackCounts, setTrackCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [createDraft, setCreateDraft] = useState({
    label: "",
    prompt: "",
    starter_hint: "",
  });
  const [aiDrafts, setAiDrafts] = useState<Proposal[]>([]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/super-admin/admissions/questions?track=${encodeURIComponent(track)}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
      setCommon(data.common ?? []);
      setTrackCounts(data.trackCounts ?? {});
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    setAiDrafts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  const preview = useMemo(() => [...common, ...questions].slice(0, 3), [common, questions]);
  const missingCount = CFA_SPECIALIZATIONS.filter((s) => (trackCounts[s.value] ?? 0) < 2).length;

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

  async function createQuestion(payload: Proposal) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/admissions/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          specialization: track,
          ...payload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCreateDraft({ label: "", prompt: "", starter_hint: "" });
      setMessage("Question créée.");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function seedProposals(scope: "track" | "all") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/admissions/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed_proposals",
          specialization: scope === "track" ? track : undefined,
          onlyMissing: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        scope === "all"
          ? `${data.inserted} question(s) ajoutée(s) sur les filières vides (${data.skipped} déjà présentes).`
          : `${data.inserted} proposition(s) ajoutée(s) pour cette filière.`,
      );
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Import impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function generateAi() {
    if (track === "_fallback") {
      setMessage("Choisis une filière pour générer avec l’IA.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/admissions/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_ai", specialization: track }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAiDrafts(data.questions ?? []);
      setMessage(
        data.source === "ai"
          ? "2 propositions IA prêtes — valide-les une par une."
          : "Propositions Byound (repli) — valide-les une par une.",
      );
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Génération impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Banque de questions candidature</h1>
          <p className="mt-2 text-sm text-neutral-500">
            1 question commune + 2 questions propres à la filière. Chaque modification versionne la
            question pour le jury.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || missingCount === 0}
            onClick={() => void seedProposals("all")}
            className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            Remplir les {missingCount} filières vides
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRACKS.filter((t) => t.value !== "common").map((t) => {
          const count = trackCounts[t.value] ?? 0;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTrack(t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                track === t.value
                  ? "border-violet-500 bg-violet-50 text-violet-800"
                  : "border-neutral-200",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-1.5 text-[11px]",
                  count >= 2 ? "text-emerald-600" : "text-amber-600",
                )}
              >
                {count}/2
              </span>
            </button>
          );
        })}
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
              <h2 className="text-lg font-semibold">
                Questions {TRACKS.find((t) => t.value === track)?.label ?? track}
              </h2>
              <div className="flex flex-wrap gap-2">
                {track !== "_fallback" ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void generateAi()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Générer avec l’IA
                    </button>
                    <button
                      type="button"
                      disabled={busy || questions.length >= 2}
                      onClick={() => void seedProposals("track")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Propositions Byound
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {questions.map((q) => (
              <QuestionEditor key={q.id} question={q} busy={busy} onSave={saveQuestion} />
            ))}

            {!questions.length ? (
              <p className="text-sm text-neutral-500">
                Aucune question propre — le secours sera utilisé côté candidat tant que tu n’en as
                pas créé 2.
              </p>
            ) : null}

            {aiDrafts.length ? (
              <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                <p className="text-sm font-semibold text-violet-900">Propositions à valider</p>
                {aiDrafts.map((draft, index) => (
                  <div key={`${draft.label}-${index}`} className="rounded-xl bg-white p-3">
                    <p className="text-xs font-semibold text-violet-700">{draft.label}</p>
                    <p className="mt-1 text-sm">{draft.prompt}</p>
                    <p className="mt-1 text-xs text-neutral-400">{draft.starter_hint}</p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void createQuestion(draft)}
                      className="mt-2 rounded-full bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Ajouter cette question
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-2xl border border-dashed border-neutral-300 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Plus className="h-4 w-4" /> Nouvelle question
              </p>
              <input
                className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold"
                placeholder="Étiquette (ex. Projection)"
                value={createDraft.label}
                onChange={(e) => setCreateDraft({ ...createDraft, label: e.target.value })}
              />
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="Question posée au candidat"
                value={createDraft.prompt}
                onChange={(e) => setCreateDraft({ ...createDraft, prompt: e.target.value })}
              />
              <input
                className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="Exemple de début de réponse"
                value={createDraft.starter_hint}
                onChange={(e) => setCreateDraft({ ...createDraft, starter_hint: e.target.value })}
              />
              <button
                type="button"
                disabled={busy || !createDraft.label.trim() || !createDraft.prompt.trim()}
                onClick={() => void createQuestion(createDraft)}
                className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-lg font-semibold">Aperçu candidat</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {preview.length < 3
                ? "Il manque des questions pour compléter les 3 du challenge."
                : "Les 3 questions affichées sur la page candidature."}
            </p>
            <div className="mt-4 space-y-4">
              {preview.map((q, index) => (
                <div key={q.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-violet-600">
                    {index + 1} · {q.label}
                    {index === 0 ? " · commune" : " · filière"}
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
