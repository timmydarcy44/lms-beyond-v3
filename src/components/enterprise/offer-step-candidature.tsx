"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Segmented } from "@/components/builder/fiche-builder-chrome";
import {
  DEMAND_OPTIONS,
  DOCUMENT_ROWS,
  linkedinShareText,
  publicOfferUrl,
  type DocumentDemand,
  type OfferDiffusion,
  type RecruitmentStep,
  type RequestedDocuments,
  type ScreeningQuestion,
} from "@/lib/entreprise/offer-candidature";
import type { OfferPoste } from "@/lib/entreprise/offer-poste";

const fieldClass =
  "h-14 w-full rounded-2xl border border-[#E3E0D8] bg-white px-4 text-[17px] font-bold text-[#07080B] outline-none focus:border-[#07080B]";

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF] disabled:cursor-not-allowed disabled:opacity-40 ${checked && !disabled ? "bg-[#6E5BFF]" : "bg-[#E3E0D8]"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white ${checked && !disabled ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

async function copyText(value: string, success: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(success);
  } catch {
    toast.error("Copie impossible");
  }
}

export function OfferStepCandidature({
  offerId,
  draft,
  onChange,
}: {
  offerId: string;
  draft: OfferPoste;
  onChange: (patch: Partial<OfferPoste>) => void;
}) {
  const steps = Array.isArray(draft.recruitment_steps) ? draft.recruitment_steps : [];
  const documents: RequestedDocuments = draft.requested_documents ?? {
    cv: "required",
    cover_letter: "optional",
    portfolio: "optional",
  };
  const questions = Array.isArray(draft.screening_questions) ? draft.screening_questions : [];
  const diffusion: OfferDiffusion = draft.diffusion ?? { byound: true, linkedin: false };
  const published = draft.status === "active";
  const url = publicOfferUrl(offerId);
  const shareText = linkedinShareText({
    title: String(draft.title ?? ""),
    contract: draft.contract_type,
    city: draft.city,
    url: published ? url : null,
  });

  const updateStep = (id: string, patch: Partial<RecruitmentStep>) => {
    onChange({
      recruitment_steps: steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    });
  };

  const moveStep = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange({ recruitment_steps: next });
  };

  return (
    <div className="mt-8 space-y-8">
      <div id="offer-steps" tabIndex={-1}>
        <p className="text-sm font-semibold">Étapes du recrutement <span className="font-medium text-[#6B6F7A]">· affichées au candidat</span></p>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <span className="mt-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07080B] text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                <input
                  aria-label={`Titre de l'étape ${index + 1}`}
                  maxLength={80}
                  value={step.title}
                  onChange={(event) => updateStep(step.id, { title: event.target.value })}
                  className="h-12 rounded-2xl border border-[#E3E0D8] bg-white px-4 text-sm font-bold outline-none focus:border-[#07080B]"
                />
                <input
                  aria-label={`Détail de l'étape ${index + 1}`}
                  maxLength={160}
                  value={step.detail}
                  onChange={(event) => updateStep(step.id, { detail: event.target.value })}
                  className="h-12 rounded-2xl border border-[#E3E0D8] bg-white px-4 text-sm font-semibold text-[#3A3D45] outline-none focus:border-[#07080B]"
                />
                <div className="flex gap-1">
                  <button type="button" aria-label="Monter l'étape" onClick={() => moveStep(index, -1)} disabled={index === 0} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E0D8] disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Descendre l'étape" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E0D8] disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Retirer l'étape" onClick={() => onChange({ recruitment_steps: steps.filter((item) => item.id !== step.id) })} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E0D8]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => onChange({
            recruitment_steps: [...steps, { id: crypto.randomUUID().slice(0, 36), title: "Nouvelle étape", detail: "" }],
          })}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-[#E3E0D8] px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Ajouter une étape
        </button>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Pièces demandées</p>
        <div className="space-y-3">
          {DOCUMENT_ROWS.map((row) => (
            <div key={row.key} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[#F4F4F1] px-4 py-3">
              <p className="text-sm font-semibold">{row.label}</p>
              <Segmented
                label={row.label}
                value={DEMAND_OPTIONS.find((option) => option.value === documents[row.key])?.label ?? "Facultative"}
                options={DEMAND_OPTIONS.map((option) => option.label)}
                onChange={(label) => {
                  const next = DEMAND_OPTIONS.find((option) => option.label === label)?.value ?? "optional";
                  onChange({ requested_documents: { ...documents, [row.key]: next as DocumentDemand } });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Questions de présélection</p>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={question.id} className="rounded-[20px] bg-[#F4F4F1] p-4">
              <label className="block text-sm font-semibold">
                Question {index + 1}
                <input
                  aria-label={`Question ${index + 1}`}
                  maxLength={240}
                  value={question.prompt}
                  onChange={(event) => onChange({
                    screening_questions: questions.map((item) => item.id === question.id ? { ...item, prompt: event.target.value } : item),
                  })}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <Segmented
                  label={`Type de la question ${index + 1}`}
                  value={question.kind === "short" ? "Réponse courte" : "Oui / non"}
                  options={["Oui / non", "Réponse courte"]}
                  onChange={(value) => onChange({
                    screening_questions: questions.map((item) => item.id === question.id ? { ...item, kind: value === "Réponse courte" ? "short" : "yes_no" } : item),
                  })}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Éliminatoire</span>
                  <Switch
                    checked={question.eliminatory}
                    label={`Question ${index + 1} éliminatoire`}
                    onChange={(eliminatory) => onChange({
                      screening_questions: questions.map((item) => item.id === question.id ? { ...item, eliminatory } : item),
                    })}
                  />
                  <button
                    type="button"
                    aria-label="Retirer la question"
                    onClick={() => onChange({ screening_questions: questions.filter((item) => item.id !== question.id) })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E0D8] bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {questions.length < 3 ? (
          <button
            type="button"
            onClick={() => onChange({
              screening_questions: [...questions, { id: crypto.randomUUID().slice(0, 36), prompt: "", kind: "yes_no", eliminatory: false } satisfies ScreeningQuestion],
            })}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-[#E3E0D8] px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Ajouter une question
          </button>
        ) : (
          <p className="mt-3 text-sm text-[#6B6F7A]">3 questions au maximum.</p>
        )}
      </div>

      <label className="block text-sm font-semibold">
        Date limite de candidature <span className="font-medium text-[#6B6F7A]">facultative</span>
        <input
          type="date"
          aria-label="Date limite de candidature"
          value={draft.application_deadline ?? ""}
          onChange={(event) => onChange({ application_deadline: event.target.value || null })}
          className={`${fieldClass} mt-2 max-w-xs`}
        />
      </label>

      <div id="offer-channels" tabIndex={-1}>
        <p className="mb-3 text-sm font-semibold">Diffusion</p>
        <div className="space-y-2">
          <Channel
            mark="BY"
            markClass="bg-[#07080B] text-white"
            name="Publier sur byound.fr (offre anonyme)"
            detail="Votre nom n'apparaît pas. Les candidats postulent via Byound."
            checked={diffusion.byound}
            onChange={(byound) => onChange({ diffusion: { ...diffusion, byound } })}
          />
          <Channel
            mark="FT"
            markClass="bg-[#12315A] text-white"
            name="France Travail"
            detail="Diffusion non connectée"
            checked={false}
            disabled
            soon
          />
          <Channel
            mark="in"
            markClass="bg-[#E8F1FB] text-[#0A66C2]"
            name="LinkedIn"
            detail="Lien de partage, publication manuelle"
            checked={diffusion.linkedin}
            onChange={(linkedin) => onChange({ diffusion: { ...diffusion, linkedin } })}
          />
          {diffusion.linkedin ? (
            <div className="rounded-[20px] border border-[#E3E0D8] p-4">
              <p className="text-sm font-semibold">Texte à copier</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#3A3D45]">{shareText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyText(shareText, "Texte copié")} className="h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white">
                  Copier le texte
                </button>
                <button
                  type="button"
                  disabled={!published}
                  onClick={() => void copyText(url, "Lien copié")}
                  className="h-10 rounded-full border border-[#E3E0D8] px-4 text-sm font-semibold disabled:opacity-40"
                >
                  Copier le lien
                </button>
              </div>
              {published ? null : <p className="mt-2 text-sm text-[#6B6F7A]">Le lien public sera copiable une fois l'offre publiée.</p>}
            </div>
          ) : null}
          <Channel
            mark="ID"
            markClass="bg-[#F4F4F1] text-[#3A3D45]"
            name="Indeed"
            detail="Diffusion non connectée"
            checked={false}
            disabled
            soon
          />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold">Lien public</p>
          {published ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input readOnly aria-label="Lien public de l'offre" value={url} className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E3E0D8] bg-[#F4F4F1] px-4 text-sm font-semibold" />
              <button type="button" onClick={() => void copyText(url, "Lien copié")} className="h-12 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white">
                Copier
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#6B6F7A]">Le lien public sera copiable une fois l'offre publiée.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Channel({
  mark,
  markClass,
  name,
  detail,
  checked,
  disabled,
  soon,
  onChange,
}: {
  mark: string;
  markClass: string;
  name: string;
  detail: string;
  checked: boolean;
  disabled?: boolean;
  soon?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-[#E3E0D8] px-4 py-3">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${markClass}`}>{mark}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-sm text-[#6B6F7A]">{detail}</p>
      </div>
      {soon ? <span className="rounded-full bg-[#F4F4F1] px-3 py-1 text-xs font-semibold text-[#3A3D45]">Bientôt</span> : null}
      <Switch checked={checked} disabled={disabled} label={name} onChange={(value) => onChange?.(value)} />
    </div>
  );
}
