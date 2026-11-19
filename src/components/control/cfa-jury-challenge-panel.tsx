"use client";

import Link from "next/link";
import { useState } from "react";

import {
  CFA_CHALLENGE_QUESTIONS,
  getCfaSpecializationLabel,
} from "@/lib/cfa-applications";
import {
  PARCOURS_DIPLOMA_OPTIONS,
  PARCOURS_EXPERIENCE_OPTIONS,
  PARCOURS_SITUATION_OPTIONS,
  isResponseComplete,
  specializationHasCustomQuestions,
  type ChallengeResponse,
} from "@/lib/cfa/admission-challenge";
import { cn } from "@/lib/utils";

type ChallengeResponseView = ChallengeResponse & {
  mediaSignedUrl?: string | null;
  version?: number;
  versionCreatedAt?: string | null;
  scope?: "common" | "track" | "fallback";
};

type Props = {
  applicationId: string;
  specialization?: string | null;
  challengeV2?: {
    responses?: ChallengeResponseView[];
    usedFallback?: boolean;
  } | null;
  legacyAnswers?: Record<string, string> | null;
  schoolBackground?: string | null;
  experiences?: string | null;
  motivationText?: string | null;
  parcours?: Record<string, unknown> | null;
  alternanceStatus?: string | null;
  companyNameFromParcours?: string | null;
  shareWithCompanies?: boolean | null;
  shareWithCompaniesAt?: string | null;
  cvUrl?: string | null;
  juryScores?: {
    curiosite?: number;
    logique?: number;
    communication?: number;
    motivation?: number;
    comment?: string;
    evaluatorName?: string;
    evaluatedAt?: string;
    phase?: "before_interview" | "after_interview";
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

const LABEL_COLORS: Record<string, string> = {
  Raisonnement: "#8DB8FF",
  "Curiosité business": "#A99BFF",
  Curiosité: "#A99BFF",
  Projection: "#6BE3C0",
  Motivation: "#F6D68B",
  Communication: "#F29BCB",
};

function formatSec(sec: number | undefined) {
  if (!sec || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function diplomaLabel(value: unknown) {
  const found = PARCOURS_DIPLOMA_OPTIONS.find((o) => o.value === value);
  return found?.label ?? (typeof value === "string" && value ? value : null);
}

function situationLabel(value: unknown) {
  const found = PARCOURS_SITUATION_OPTIONS.find((o) => o.value === value);
  return found?.label ?? (typeof value === "string" && value ? value : null);
}

function experienceLabels(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => PARCOURS_EXPERIENCE_OPTIONS.find((o) => o.value === v)?.label ?? null)
    .filter(Boolean) as string[];
}

function formatAnswerMeta(r: ChallengeResponseView) {
  if (r.format === "text") return "Réponse écrite";
  const dur = formatSec(r.mediaDurationSec);
  if (r.format === "audio") return dur ? `Réponse orale · ${dur}` : "Réponse orale";
  if (r.format === "video") return dur ? `Réponse vidéo · ${dur}` : "Réponse vidéo";
  return "";
}

function versionCaption(r: ChallengeResponseView) {
  const n = r.version;
  const date = r.versionCreatedAt
    ? new Date(r.versionCreatedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  if (n && date) return `version ${n} du ${date}`;
  if (n) return `version ${n}`;
  return null;
}

export function CfaJuryChallengePanel({
  specialization,
  challengeV2,
  legacyAnswers,
  schoolBackground,
  experiences,
  motivationText,
  parcours,
  alternanceStatus,
  companyNameFromParcours,
  shareWithCompanies,
  shareWithCompaniesAt,
  cvUrl,
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
    phase: juryScores?.phase ?? "before_interview",
  });
  const [busy, setBusy] = useState(false);
  const responses = (challengeV2?.responses ?? []) as ChallengeResponseView[];
  const answered = responses.filter((r) => isResponseComplete(r)).length;
  const trackLabel = specialization ? getCfaSpecializationLabel(specialization) : "Filière";
  const usedFallback =
    challengeV2?.usedFallback === true ||
    (specialization ? !specializationHasCustomQuestions(specialization) : false);

  const diploma = diplomaLabel(parcours?.diploma);
  const diplomaYear = typeof parcours?.diplomaYear === "string" ? parcours.diplomaYear : "";
  const school = typeof parcours?.school === "string" ? parcours.school : "";
  const situation = situationLabel(parcours?.situation);
  const expLabels = experienceLabels(parcours?.experiences);
  const expDetail = typeof parcours?.experiencesDetail === "string" ? parcours.experiencesDetail : "";
  const companyFromCandidate =
    companyNameFromParcours ||
    (typeof parcours?.companyName === "string" ? parcours.companyName : "") ||
    "";

  const legacyFilled = CFA_CHALLENGE_QUESTIONS.map((q) => ({
    id: q.id,
    label: q.eyebrow,
    question: q.question,
    answer: (legacyAnswers?.[q.id] ?? "").trim(),
  })).filter((row) => row.answer);
  const legacyExtras = [
    { label: "Parcours scolaire", answer: (schoolBackground ?? "").trim() },
    { label: "Expériences", answer: (experiences ?? "").trim() },
    { label: "Motivation", answer: (motivationText ?? "").trim() },
  ].filter((row) => row.answer);
  const legacyCount = legacyFilled.length + legacyExtras.length;

  const shareLabel = shareWithCompanies
    ? shareWithCompaniesAt
      ? `Accepté le ${new Date(shareWithCompaniesAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      : "Accepté"
    : "Non accepté";

  const alternanceLabel =
    alternanceStatus === "company_found"
      ? companyFromCandidate
        ? `A déjà une entreprise : ${companyFromCandidate}`
        : "A déjà une entreprise"
      : alternanceStatus === "searching"
        ? "Recherche une entreprise"
        : "Non renseigné";

  return (
    <div className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,1.35fr)_320px]">
      <div className="space-y-6">
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#EEF1F8]">
                Challenge · {trackLabel}
              </h3>
              <p className="mt-1 text-xs text-[#AEB6CC]">
                {answered} / 3 réponses
              </p>
            </div>
            {usedFallback ? (
              <Link
                href="/super/admissions/questions"
                className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200"
              >
                Questions de secours : aucune question propre à {trackLabel}
              </Link>
            ) : null}
          </div>

          {prerequisitesFlag === "to_verify" ? (
            <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Prérequis à vérifier
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {responses.length ? (
              responses.map((r, index) => {
                const color = LABEL_COLORS[r.label] || "#8DB8FF";
                const scope =
                  r.scope === "common"
                    ? "commune"
                    : r.scope === "fallback"
                      ? "secours"
                      : "filière";
                const complete = isResponseComplete(r);
                const version = versionCaption(r);
                return (
                  <article
                    key={`${r.questionId || r.versionId || index}-${index}`}
                    className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {r.label || `Question ${index + 1}`}
                      </span>
                      <span className="text-[11px] text-[#5D6785]">{scope}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#EEF1F8]">{r.prompt}</p>
                    {version ? (
                      <p className="mt-1 text-[11px] text-[#5D6785]">{version}</p>
                    ) : null}

                    <div className="mt-3">
                      {!complete ? (
                        <p className="text-sm text-[#5D6785]">Sans réponse</p>
                      ) : r.format === "text" ? (
                        <p className="whitespace-pre-wrap text-sm text-[#AEB6CC]">{r.text}</p>
                      ) : r.format === "audio" && r.mediaSignedUrl ? (
                        <audio controls src={r.mediaSignedUrl} className="w-full" />
                      ) : r.format === "video" && r.mediaSignedUrl ? (
                        <video
                          controls
                          playsInline
                          src={r.mediaSignedUrl}
                          className="aspect-video w-full rounded-xl bg-black"
                        />
                      ) : (
                        <p className="text-sm text-[#F2CF6B]">
                          Média indisponible pour le moment. Rechargez la fiche.
                        </p>
                      )}
                    </div>
                    {complete ? (
                      <p className="mt-2 text-[11px] text-[#5D6785]">{formatAnswerMeta(r)}</p>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-[#5D6785]">Pas encore de réponses au challenge.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
          <h3 className="text-sm font-semibold text-[#EEF1F8]">Parcours et alternance</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              [
                "Dernier diplôme",
                diploma ? `${diploma}${diplomaYear ? ` · ${diplomaYear}` : ""}` : "Non renseigné",
              ],
              ["Établissement", school || "Non renseigné"],
              ["Aujourd’hui", situation || "Non renseigné"],
              [
                "Expériences",
                expLabels.length
                  ? `${expLabels.join(", ")}${expDetail ? ` — ${expDetail}` : ""}`
                  : "Non renseigné",
              ],
              [
                "CV",
                cvUrl ? (
                  <a href={cvUrl} target="_blank" rel="noreferrer" className="text-[#8DB8FF]">
                    Télécharger
                  </a>
                ) : (
                  "Non déposé"
                ),
              ],
              ["Situation alternance", alternanceLabel],
              ["Partage du profil aux entreprises", shareLabel],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="text-[#5D6785]">{label}</dt>
                <dd className="text-[#EEF1F8]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {legacyCount > 0 ? (
          <details className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#AEB6CC]">
              Réponses de l’ancien formulaire ({legacyCount})
            </summary>
            <div className="mt-3 space-y-3 text-sm text-[#AEB6CC]">
              {legacyFilled.map((row) => (
                <div key={row.id}>
                  <p className="font-medium text-[#EEF1F8]">
                    {row.label} — {row.question}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{row.answer}</p>
                </div>
              ))}
              {legacyExtras.map((row) => (
                <div key={row.label}>
                  <p className="font-medium text-[#EEF1F8]">{row.label}</p>
                  <p className="mt-1 whitespace-pre-wrap">{row.answer}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <aside className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4 min-[1100px]:sticky min-[1100px]:top-24 min-[1100px]:self-start">
        <h3 className="text-sm font-semibold text-[#EEF1F8]">Grille d’évaluation</h3>
        <p className="mt-1 text-xs text-[#5D6785]">Notes de 1 à 4</p>
        <div className="mt-3 inline-flex rounded-full border border-[#26304F] p-1 text-[11px] font-semibold">
          {(
            [
              ["before_interview", "Avant entretien"],
              ["after_interview", "Après entretien"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScores({ ...scores, phase: value })}
              className={cn(
                "rounded-full px-3 py-1.5",
                scores.phase === value ? "bg-[#6E5BFF] text-white" : "text-[#AEB6CC]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {SCORE_KEYS.map(([key, label]) => (
            <div key={key}>
              <p className="text-xs text-[#AEB6CC]">{label}</p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScores({ ...scores, [key]: n })}
                    className={cn(
                      "h-9 flex-1 rounded-xl text-sm font-semibold",
                      scores[key] === n
                        ? "bg-[#6E5BFF] text-white"
                        : "border border-[#26304F] text-[#AEB6CC] hover:bg-white/5",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <textarea
          className="mt-4 min-h-[88px] w-full rounded-xl border border-[#26304F] bg-[#111831] px-3 py-2 text-sm text-[#EEF1F8]"
          placeholder="Commentaire"
          value={scores.comment}
          onChange={(e) => setScores({ ...scores, comment: e.target.value })}
        />
        {juryScores?.evaluatorName || juryScores?.evaluatedAt ? (
          <p className="mt-2 text-[11px] text-[#5D6785]">
            {[juryScores.evaluatorName, juryScores.evaluatedAt
              ? new Date(juryScores.evaluatedAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {onSaveScores ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onSaveScores({
                ...scores,
                evaluatedAt: new Date().toISOString(),
              }).finally(() => setBusy(false));
            }}
            className={cn(
              "mt-3 h-10 w-full rounded-full bg-[#6E5BFF] text-sm font-semibold text-white",
              busy && "opacity-60",
            )}
          >
            Enregistrer la grille
          </button>
        ) : null}
      </aside>
    </div>
  );
}
