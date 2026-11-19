"use client";

import { useState } from "react";

import { CFA_CHALLENGE_QUESTIONS } from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

type Props = {
  applicationId: string;
  challengeV2?: {
    responses?: Array<{
      label?: string;
      prompt?: string;
      format?: string;
      text?: string;
      mediaPath?: string;
      versionId?: string;
    }>;
  } | null;
  legacyAnswers?: Record<string, string> | null;
  schoolBackground?: string | null;
  experiences?: string | null;
  motivationText?: string | null;
  juryScores?: {
    curiosite?: number;
    logique?: number;
    communication?: number;
    motivation?: number;
    comment?: string;
  } | null;
  prerequisitesFlag?: string | null;
  onSaveScores?: (scores: Record<string, unknown>) => Promise<void>;
};

const SCORE_KEYS = [
  ["curiosite", "Curiosité"],
  ["logique", "Logique"],
  ["communication", "Communication"],
  ["motivation", "Motivation"],
] as const;

export function CfaJuryChallengePanel({
  challengeV2,
  legacyAnswers,
  schoolBackground,
  experiences,
  motivationText,
  juryScores,
  prerequisitesFlag,
  onSaveScores,
}: Props) {
  const [scores, setScores] = useState({
    curiosite: juryScores?.curiosite ?? 0,
    logique: juryScores?.logique ?? 0,
    communication: juryScores?.communication ?? 0,
    motivation: juryScores?.motivation ?? 0,
    comment: juryScores?.comment ?? "",
  });
  const [busy, setBusy] = useState(false);
  const responses = challengeV2?.responses ?? [];

  return (
    <div className="space-y-6">
      {prerequisitesFlag === "to_verify" ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Prérequis à vérifier
        </p>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold">Challenge (formulaire actuel)</h3>
        <div className="mt-3 space-y-3">
          {responses.length ? (
            responses.map((r, index) => (
              <div key={`${r.versionId}-${index}`} className="rounded-xl border border-neutral-200 p-3">
                <p className="text-xs font-semibold text-violet-700">
                  {r.label} · v{String(r.versionId ?? "").slice(0, 8)}
                </p>
                <p className="mt-1 text-sm font-medium">{r.prompt}</p>
                <p className="mt-2 text-sm text-neutral-600">
                  {r.format === "text" ? r.text || "—" : `Média ${r.format} : ${r.mediaPath || "—"}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">Pas encore de réponses v2.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Réponses de l’ancien formulaire</h3>
        <div className="mt-3 space-y-2 text-sm text-neutral-600">
          {CFA_CHALLENGE_QUESTIONS.map((q) => (
            <p key={q.id}>
              <span className="font-medium text-neutral-800">{q.eyebrow} : </span>
              {legacyAnswers?.[q.id] || "—"}
            </p>
          ))}
          <p>
            <span className="font-medium text-neutral-800">Parcours scolaire : </span>
            {schoolBackground || "—"}
          </p>
          <p>
            <span className="font-medium text-neutral-800">Expériences : </span>
            {experiences || "—"}
          </p>
          <p>
            <span className="font-medium text-neutral-800">Pourquoi Byound : </span>
            {motivationText || "—"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Grille d’évaluation (1 à 4)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SCORE_KEYS.map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <select
                className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
                value={scores[key]}
                onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
              >
                <option value={0}>—</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <textarea
          className="mt-3 min-h-[72px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="Commentaire"
          value={scores.comment}
          onChange={(e) => setScores({ ...scores, comment: e.target.value })}
        />
        {onSaveScores ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onSaveScores(scores).finally(() => setBusy(false));
            }}
            className={cn(
              "mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white",
              busy && "opacity-60",
            )}
          >
            Enregistrer la grille
          </button>
        ) : null}
      </section>
    </div>
  );
}
