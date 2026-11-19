"use client";

import { ArrowRight, Loader2 } from "lucide-react";

import {
  PARCOURS_DIPLOMA_OPTIONS,
  PARCOURS_EXPERIENCE_OPTIONS,
  PARCOURS_SITUATION_OPTIONS,
  type ChallengeResponse,
  type ParcoursState,
} from "@/lib/cfa/admission-challenge";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";

type Props = {
  specialization: string;
  responses: ChallengeResponse[];
  parcours: ParcoursState;
  alternanceStatus: "company_found" | "searching" | "";
  shareCompanies: boolean;
  cvName: string;
  token?: string;
  busy?: boolean;
  onEdit: () => void;
  onSubmit: () => void;
};

function truncate(value: string, max = 160) {
  const t = value.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function ChallengeReviewStep({
  specialization,
  responses,
  parcours,
  alternanceStatus,
  shareCompanies,
  cvName,
  token = "",
  busy,
  onEdit,
  onSubmit,
}: Props) {
  const diploma = PARCOURS_DIPLOMA_OPTIONS.find((o) => o.value === parcours.diploma)?.label;
  const situation = PARCOURS_SITUATION_OPTIONS.find((o) => o.value === parcours.situation)?.label;
  const experiences = (parcours.experiences ?? [])
    .map((v) => PARCOURS_EXPERIENCE_OPTIONS.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-[28px] border border-[#1F2850] bg-[#0E1430] p-6 sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight">Relis ta candidature.</h2>
        <p className="mt-2 text-sm text-[#9AA3BD]">
          Filière {getCfaSpecializationLabel(specialization)}. Tu peux encore modifier avant l’envoi.
        </p>

        <div className="mt-8 space-y-4">
          {responses.map((r, index) => (
            <div key={r.questionId} className="rounded-[22px] border border-[#1F2850] bg-[#151C3A]/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#A99BFF]">
                    Question {index + 1} · {r.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{r.prompt}</p>
                </div>
                <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#A99BFF]">
                  Modifier
                </button>
              </div>
              <div className="mt-4 text-sm text-[#9AA3BD]">
                {r.format === "text" ? (
                  <p>{truncate(r.text ?? "") || "—"}</p>
                ) : r.mediaPath ? (
                  r.format === "audio" ? (
                    <audio
                      controls
                      className="w-full"
                      src={`/api/cfa/applications/media?token=${encodeURIComponent(token)}&path=${encodeURIComponent(r.mediaPath)}&bucket=admission-media`}
                    />
                  ) : (
                    <video
                      controls
                      className="max-h-56 w-full rounded-xl bg-black"
                      src={`/api/cfa/applications/media?token=${encodeURIComponent(token)}&path=${encodeURIComponent(r.mediaPath)}&bucket=admission-media`}
                    />
                  )
                ) : (
                  <p>Média manquant</p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-[22px] border border-[#1F2850] bg-[#151C3A]/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">Ton parcours</p>
              <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#A99BFF]">
                Modifier
              </button>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-[#9AA3BD]">
              <li>
                Diplôme : {diploma || "—"}
                {parcours.diplomaYear ? ` · ${parcours.diplomaYear}` : ""}
              </li>
              {parcours.school ? <li>Établissement : {parcours.school}</li> : null}
              <li>Situation : {situation || "—"}</li>
              <li>Expériences : {experiences.length ? experiences.join(", ") : "—"}</li>
              <li>CV : {cvName || "non ajouté"}</li>
            </ul>
          </div>

          <div className="rounded-[22px] border border-[#1F2850] bg-[#151C3A]/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">Alternance</p>
              <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#A99BFF]">
                Modifier
              </button>
            </div>
            <p className="mt-3 text-sm text-[#9AA3BD]">
              {alternanceStatus === "company_found"
                ? `Entreprise déjà trouvée${parcours.companyName ? ` · ${parcours.companyName}` : ""}`
                : alternanceStatus === "searching"
                  ? "Recherche d’entreprise"
                  : "—"}
            </p>
            <p className="mt-2 text-sm text-[#9AA3BD]">
              Partage entreprises : {shareCompanies ? "oui" : "non"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-12 items-center justify-center rounded-full border border-[#26304F] px-5 text-sm font-semibold"
        >
          Modifier
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#070C1C] hover:bg-white/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Envoyer ma candidature
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
