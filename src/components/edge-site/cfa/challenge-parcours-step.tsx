"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Upload } from "lucide-react";

import { ChallengeMediaRecorder } from "@/components/edge-site/cfa/challenge-media-recorder";
import { DELAI_REPONSE_QUESTION } from "@/lib/cfa/admission-delays";
import {
  DIPLOMAS_MEETING_BAC,
  PARCOURS_DIPLOMA_OPTIONS,
  PARCOURS_EXPERIENCE_OPTIONS,
  PARCOURS_SITUATION_OPTIONS,
  TEXT_MAX_CHARS,
  isResponseComplete,
  usefulTextLength,
  type ChallengeAnswerFormat,
  type ChallengeQuestionRow,
  type ChallengeResponse,
  type ChallengeV2State,
  type ParcoursExperience,
  type ParcoursState,
} from "@/lib/cfa/admission-challenge";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

const LABEL_COLORS = ["#6E5BFF", "#5EDCC3", "#A99BFF"];

type AccessibilityState = {
  needsAccommodation: boolean | null;
  needsDetail: string;
  rqth: "yes" | "no" | "prefer_not" | null;
};

type Props = {
  specialization: string;
  questions: ChallengeQuestionRow[];
  challenge: ChallengeV2State;
  parcours: ParcoursState;
  alternanceStatus: "" | "company_found" | "searching";
  shareCompanies: boolean;
  cvName: string;
  prerequisiteLabel?: string | null;
  accessibility: AccessibilityState;
  referentHref?: string;
  contactHref?: string;
  onChangeSpecialization: () => void;
  onChallengeChange: (next: ChallengeV2State) => void;
  onParcoursChange: (next: ParcoursState) => void;
  onAlternanceChange: (value: "company_found" | "searching") => void;
  onShareCompaniesChange: (value: boolean) => void;
  onAccessibilityChange: (next: AccessibilityState) => void;
  onUploadCv: (file: File) => Promise<void>;
  onUploadMedia: (file: File, questionId: string) => Promise<string | null>;
  onReview: () => void;
  busy?: boolean;
};

function emptyResponse(q: ChallengeQuestionRow): ChallengeResponse {
  return {
    questionId: q.id,
    versionId: q.versionId,
    slug: q.slug,
    label: q.label,
    prompt: q.prompt,
    format: "text",
    text: "",
  };
}

export function ChallengeParcoursStep(props: Props) {
  const [mobileQ, setMobileQ] = useState(0);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const responses = useMemo(() => {
    return props.questions.map((q) => {
      const found = props.challenge.responses.find((r) => r.questionId === q.id || r.slug === q.slug);
      return found ?? emptyResponse(q);
    });
  }, [props.challenge.responses, props.questions]);

  function updateResponse(questionId: string, patch: Partial<ChallengeResponse>) {
    const base = responses.map((r) => (r.questionId === questionId ? { ...r, ...patch } : r));
    props.onChallengeChange({ ...props.challenge, responses: base });
  }

  const checklist = [
    { id: "q1", label: "Question 1", done: isResponseComplete(responses[0]), target: "part-challenge" },
    { id: "q2", label: "Question 2", done: isResponseComplete(responses[1]), target: "part-challenge" },
    { id: "q3", label: "Question 3", done: isResponseComplete(responses[2]), target: "part-challenge" },
    {
      id: "diploma",
      label: "Diplôme et situation",
      done: Boolean(props.parcours.diploma && props.parcours.situation),
      target: "part-parcours",
    },
    {
      id: "alternance",
      label: "Alternance",
      done: Boolean(props.alternanceStatus),
      target: "part-alternance",
    },
    { id: "review", label: "Relecture", done: false, target: "part-submit" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const requiredReady = checklist.filter((c) => c.id !== "review").every((c) => c.done);
  const remainingMin = Math.max(1, Math.ceil((checklist.length - doneCount) * 0.6));

  const prereqWarn =
    props.prerequisiteLabel &&
    props.parcours.diploma &&
    !DIPLOMAS_MEETING_BAC.includes(props.parcours.diploma as (typeof DIPLOMAS_MEETING_BAC)[number]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleReviewClick() {
    if (!requiredReady) {
      const first = checklist.find((c) => !c.done && c.id !== "review");
      if (first) scrollTo(first.target);
      return;
    }
    props.onReview();
  }

  const visibleQuestions = narrow ? [props.questions[mobileQ]].filter(Boolean) : props.questions;

  return (
    <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-7">
        <section id="part-challenge" className="scroll-mt-28 rounded-[28px] border border-[#1F2850] bg-[#0E1430] p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#A99BFF]">Partie 1 sur 3</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Trois questions, aucune mauvaise réponse.</h2>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Réponds comme tu veux : à l’écrit, à l’oral ou en vidéo. On regarde ta façon de raisonner, pas ton orthographe.
          </p>

          <div className="mt-8 space-y-5">
            {visibleQuestions.map((q, visibleIndex) => {
              const index = narrow ? mobileQ : visibleIndex;
              const response = responses[index] ?? emptyResponse(q);
              const color = LABEL_COLORS[index % LABEL_COLORS.length];
              const len = usefulTextLength(response.text ?? "");
              return (
                <article
                  key={q.id}
                  className="rounded-[22px] border border-[#1F2850] bg-[rgba(21,28,58,0.33)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: color }}
                      >
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[#9AA3BD]">{q.label}</p>
                    </div>
                    <div className="inline-flex rounded-full border border-[#26304F] bg-[#0E1430] p-1 text-xs font-semibold">
                      {(
                        [
                          ["text", "✎ Écrire"],
                          ["audio", "🎙 Parler"],
                          ["video", "▶ Me filmer"],
                        ] as const
                      ).map(([format, label]) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => updateResponse(q.id, { format: format as ChallengeAnswerFormat })}
                          className={cn(
                            "rounded-full px-3 py-1.5 transition",
                            response.format === format
                              ? "bg-white text-[#070C1C]"
                              : "text-[#9AA3BD] hover:text-white",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold leading-snug">{q.prompt}</h3>
                  <div className="mt-4">
                    {response.format === "text" ? (
                      <>
                        <textarea
                          value={response.text ?? ""}
                          onChange={(e) =>
                            updateResponse(q.id, {
                              text: e.target.value.slice(0, TEXT_MAX_CHARS),
                            })
                          }
                          placeholder={q.starter_hint || "Ta réponse…"}
                          className="min-h-[104px] w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm text-[#F2F4FA] outline-none placeholder:text-[#6C7593] focus:border-[#6E5BFF]"
                        />
                        <p className="mt-2 text-[12.5px] text-[#6C7593]">
                          3 à 6 lignes suffisent · {len} / {TEXT_MAX_CHARS} caractères
                        </p>
                      </>
                    ) : (
                      <ChallengeMediaRecorder
                        mode={response.format}
                        busy={props.busy}
                        existingUrl={response.mediaPath ? undefined : undefined}
                        existingDurationSec={response.mediaDurationSec}
                        onRecorded={async (file, durationSec) => {
                          const path = await props.onUploadMedia(file, q.id);
                          if (!path) return false;
                          updateResponse(q.id, {
                            mediaPath: path,
                            mediaDurationSec: durationSec,
                            text: "",
                          });
                          return true;
                        }}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {narrow ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={mobileQ === 0}
                onClick={() => setMobileQ((v) => Math.max(0, v - 1))}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Précédente
              </button>
              <p className="text-xs text-[#9AA3BD]">
                {mobileQ + 1} / {props.questions.length}
              </p>
              <button
                type="button"
                disabled={mobileQ >= props.questions.length - 1}
                onClick={() => setMobileQ((v) => Math.min(props.questions.length - 1, v + 1))}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Suivante
              </button>
            </div>
          ) : null}
        </section>

        <section id="part-parcours" className="scroll-mt-28 rounded-[28px] border border-[#1F2850] bg-[#0E1430] p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#A99BFF]">Partie 2 sur 3</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Sans lettre de motivation.</h2>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Quelques infos rapides. Tu en parleras plus en détail à l’entretien.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-[#F2F4FA]/90">
              Dernier diplôme obtenu
              <select
                className="mt-2 w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
                value={props.parcours.diploma ?? ""}
                onChange={(e) =>
                  props.onParcoursChange({ ...props.parcours, diploma: e.target.value as ParcoursState["diploma"] })
                }
              >
                <option value="">Choisir</option>
                {PARCOURS_DIPLOMA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[#F2F4FA]/90">
              Année
              <input
                className="mt-2 w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="2025"
                value={props.parcours.diplomaYear ?? ""}
                onChange={(e) =>
                  props.onParcoursChange({ ...props.parcours, diplomaYear: e.target.value.slice(0, 4) })
                }
              />
            </label>
            <label className="sm:col-span-2 text-sm text-[#F2F4FA]/90">
              Établissement <span className="text-[#6C7593]">(facultatif)</span>
              <input
                className="mt-2 w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
                placeholder="Lycée Malherbe, Caen"
                value={props.parcours.school ?? ""}
                onChange={(e) => props.onParcoursChange({ ...props.parcours, school: e.target.value })}
              />
            </label>
          </div>

          {prereqWarn ? (
            <p className="mt-4 rounded-2xl border border-[#F2CF6B]/35 bg-[#F2CF6B]/10 px-4 py-3 text-sm text-[#F2CF6B]">
              Le titre visé demande en principe {props.prerequisiteLabel}. Envoie quand même ta candidature : on
              étudie chaque dossier.
            </p>
          ) : null}

          <p className="mt-8 text-sm font-semibold">Aujourd’hui, tu es…</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PARCOURS_SITUATION_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => props.onParcoursChange({ ...props.parcours, situation: o.value })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  props.parcours.situation === o.value
                    ? "border-[#6E5BFF] bg-[#6E5BFF]/20 text-white"
                    : "border-[#26304F] text-[#9AA3BD]",
                )}
              >
                {props.parcours.situation === o.value ? "✓ " : ""}
                {o.label}
              </button>
            ))}
          </div>

          <p className="mt-8 text-sm font-semibold">
            Tes expériences <span className="font-normal text-[#6C7593]">(facultatif)</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PARCOURS_EXPERIENCE_OPTIONS.map((o) => {
              const selected = (props.parcours.experiences ?? []).includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const current = new Set(props.parcours.experiences ?? []);
                    if (o.value === "rien") {
                      props.onParcoursChange({ ...props.parcours, experiences: selected ? [] : ["rien"] });
                      return;
                    }
                    current.delete("rien");
                    if (selected) current.delete(o.value);
                    else current.add(o.value);
                    props.onParcoursChange({
                      ...props.parcours,
                      experiences: [...current] as ParcoursExperience[],
                    });
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    selected
                      ? "border-[#6E5BFF] bg-[#6E5BFF]/20 text-white"
                      : "border-[#26304F] text-[#9AA3BD]",
                  )}
                >
                  {selected ? "✓ " : ""}
                  {o.label}
                </button>
              );
            })}
          </div>
          {(props.parcours.experiences ?? []).length > 0 &&
          !(props.parcours.experiences ?? []).includes("rien") ? (
            <input
              className="mt-4 w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
              placeholder="Préciser (facultatif)"
              value={props.parcours.experiencesDetail ?? ""}
              onChange={(e) =>
                props.onParcoursChange({ ...props.parcours, experiencesDetail: e.target.value })
              }
            />
          ) : null}

          <label className="mt-8 flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#26304F] bg-[#151C3A]/40 px-4 text-center">
            <Upload className="h-5 w-5 text-[#A99BFF]" />
            <span className="mt-2 text-sm font-semibold">Ajouter ton CV</span>
            <span className="mt-1 text-xs text-[#6C7593]">
              {props.cvName || "PDF ou image · 10 Mo max · facultatif"}
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void props.onUploadCv(file);
              }}
            />
          </label>
        </section>

        <section id="part-alternance" className="scroll-mt-28 rounded-[28px] border border-[#1F2850] bg-[#0E1430] p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#A99BFF]">Partie 3 sur 3</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Où en es-tu avec l’entreprise ?</h2>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Pas d’entreprise ? C’est le cas de la plupart des candidats. On t’aide à la trouver après l’admission.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "company_found",
                  "J’ai déjà une entreprise",
                  "Tu nous donneras ses coordonnées après l’admission.",
                ],
                [
                  "searching",
                  "Je recherche une entreprise",
                  "On te propose des entreprises qui recrutent dans ta spécialité.",
                ],
              ] as const
            ).map(([value, title, body]) => (
              <button
                key={value}
                type="button"
                onClick={() => props.onAlternanceChange(value)}
                className={cn(
                  "rounded-[22px] border px-5 py-5 text-left transition",
                  props.alternanceStatus === value
                    ? "border-[1.5px] border-[#6E5BFF] bg-[#6E5BFF]/12"
                    : "border-[#1F2850] bg-[#151C3A]/40",
                )}
              >
                <p className="font-semibold">
                  {props.alternanceStatus === value ? "✓ " : ""}
                  {title}
                </p>
                <p className="mt-2 text-sm text-[#9AA3BD]">{body}</p>
              </button>
            ))}
          </div>
          {props.alternanceStatus === "company_found" ? (
            <input
              className="mt-4 w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
              placeholder="Nom de l’entreprise (facultatif)"
              value={props.parcours.companyName ?? ""}
              onChange={(e) => props.onParcoursChange({ ...props.parcours, companyName: e.target.value })}
            />
          ) : null}

          <label className="mt-6 flex items-start gap-3 text-sm text-[#F2F4FA]/90">
            <input
              type="checkbox"
              checked={props.shareCompanies}
              onChange={(e) => props.onShareCompaniesChange(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              J’accepte que mon profil soit transmis aux entreprises partenaires de Byound School.
              <span className="mt-1 block text-[#6C7593]">
                Facultatif. Tu pourras changer d’avis à tout moment depuis ton espace.
              </span>
            </span>
          </label>

          <div className="mt-8 rounded-[22px] border border-[#5EDCC3]/20 bg-[#5EDCC3]/[0.05] p-5">
            <p className="text-sm font-semibold text-[#5EDCC3]">Accessibilité et aménagements</p>
            <p className="mt-4 text-sm">
              As-tu besoin d’un aménagement pour l’entretien ou la formation ? (plus de temps, un autre format de
              réponse, un lieu accessible…)
            </p>
            <div className="mt-3 flex gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() =>
                    props.onAccessibilityChange({ ...props.accessibility, needsAccommodation: value })
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    props.accessibility.needsAccommodation === value
                      ? "border-[#5EDCC3] bg-[#5EDCC3]/15"
                      : "border-[#26304F] text-[#9AA3BD]",
                  )}
                >
                  {value ? "Oui" : "Non"}
                </button>
              ))}
            </div>
            {props.accessibility.needsAccommodation ? (
              <textarea
                className="mt-3 min-h-[88px] w-full rounded-2xl border border-[#1F2850] bg-[#151C3A] px-4 py-3 text-sm outline-none"
                placeholder="Dis-nous ce qui t’aiderait"
                value={props.accessibility.needsDetail}
                onChange={(e) =>
                  props.onAccessibilityChange({ ...props.accessibility, needsDetail: e.target.value })
                }
              />
            ) : null}
            <p className="mt-1 text-xs text-[#6C7593]">Décris ton besoin, pas ta situation médicale.</p>

            <p className="mt-6 text-sm">
              Bénéficies-tu d’une RQTH (reconnaissance de la qualité de travailleur handicapé) ?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["yes", "Oui"],
                  ["no", "Non"],
                  ["prefer_not", "Je préfère ne pas répondre"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => props.onAccessibilityChange({ ...props.accessibility, rqth: value })}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    props.accessibility.rqth === value
                      ? "border-[#5EDCC3] bg-[#5EDCC3]/15"
                      : "border-[#26304F] text-[#9AA3BD]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[#9AA3BD]">
              Ces informations sont confidentielles. Elles sont transmises uniquement à notre référente handicap et
              n’ont aucun effet sur l’examen de ta candidature.
            </p>
          </div>
        </section>

        <div id="part-submit" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#9AA3BD]">Tu peux relire et modifier tes réponses avant l’envoi.</p>
          <button
            type="button"
            onClick={handleReviewClick}
            disabled={props.busy}
            title={
              requiredReady
                ? undefined
                : `Il manque : ${checklist
                    .filter((c) => !c.done && c.id !== "review")
                    .map((c) => c.label)
                    .join(", ")}`
            }
            className={cn(
              "inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition",
              requiredReady
                ? "bg-white text-[#070C1C] hover:bg-white/90"
                : "cursor-not-allowed bg-white/40 text-[#070C1C]/70",
            )}
          >
            Relire et envoyer
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {narrow ? (
          <div className="rounded-[22px] border border-[#1F2850] bg-[#0E1430] p-4">
            <p className="text-sm font-semibold">
              {doneCount} / {checklist.length}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#151C3A]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6E5BFF] to-[#A99BFF]"
                style={{ width: `${(doneCount / checklist.length) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className={cn("rounded-[22px] border border-[#1F2850] bg-[#0E1430] p-5", narrow && "hidden")}>
          <p className="text-sm font-semibold">Ta progression</p>
          <p className="mt-1 text-2xl font-bold">
            {doneCount} / {checklist.length}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#151C3A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6E5BFF] to-[#A99BFF]"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2.5">
            {checklist.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(item.target)}
                  className="flex w-full items-center gap-2.5 text-left text-sm"
                >
                  {item.done ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6BE39B] text-[#070C1C]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-dashed border-[#6C7593]" />
                  )}
                  <span className={item.done ? "text-[#F2F4FA]" : "text-[#9AA3BD]"}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#6C7593]">Environ {remainingMin} minutes restantes</p>
        </div>

        <div className={cn("rounded-[22px] border border-[#1F2850] bg-[#0E1430] p-5", narrow && "order-last")}>
          <p className="text-sm font-semibold">Ce qui compte pour nous</p>
          <p className="mt-2 text-sm leading-relaxed text-[#9AA3BD]">
            Ta curiosité, ta logique et ton envie d’apprendre. Tes réponses servent de point de départ à
            l’entretien : on en discutera ensemble.
          </p>
        </div>

        <div
          className={cn(
            "rounded-[22px] border border-[#5EDCC3]/25 bg-[#5EDCC3]/[0.06] p-5",
            narrow && "order-last",
          )}
        >
          <p className="text-sm font-semibold text-[#5EDCC3]">Besoin d’un aménagement ?</p>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Plus de temps, un autre format de réponse… Notre référente handicap t’accompagne, en toute
            confidentialité.
          </p>
          <Link
            href={props.referentHref || "mailto:handicap@byound.fr"}
            className="mt-3 inline-flex text-sm font-semibold text-[#5EDCC3] hover:underline"
          >
            Contacter la référente →
          </Link>
        </div>

        <div className={cn("rounded-[22px] border border-[#1F2850] bg-[#0E1430] p-5", narrow && "order-last")}>
          <p className="text-sm font-semibold">Une question ?</p>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Notre équipe admission répond en moins de {DELAI_REPONSE_QUESTION}.
          </p>
          <Link
            href={props.contactHref || "/contact"}
            className="mt-3 inline-flex text-sm font-semibold text-[#A99BFF] hover:underline"
          >
            Écrire à l’équipe →
          </Link>
        </div>

        <p className="text-center text-xs text-[#6C7593] lg:hidden">
          Filière : {getCfaSpecializationLabel(props.specialization)}
        </p>
      </aside>
    </div>
  );
}

export function FilierePill({
  specialization,
  onChange,
}: {
  specialization: string;
  onChange: () => void;
}) {
  return (
    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#26304F] bg-[#0E1430] px-3 py-1.5 text-sm">
      <span className="text-[#9AA3BD]">Filière :</span>
      <span className="font-semibold text-[#F2F4FA]">
        NTC {getCfaSpecializationLabel(specialization)}
      </span>
      <button type="button" onClick={onChange} className="font-semibold text-[#A99BFF] hover:underline">
        · Changer
      </button>
    </div>
  );
}
