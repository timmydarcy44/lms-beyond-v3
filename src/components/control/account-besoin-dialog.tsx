"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Field, fieldClass } from "./chrome";
import {
  EMPTY_NEED_ANALYSIS_DETAILS,
  NEED_ANALYSIS_SURMESURE_STORAGE_KEY,
  isNeedAnalysisComplete,
  needAnalysisToSurMesureBrief,
  normalizeNeedAnalysisDetails,
  type NeedAnalysisDetails,
  type NeedAnalysisFunding,
  type NeedAnalysisPlaceMode,
  type NeedAnalysisRecommendation,
  type OrganizationNeedAnalysis,
} from "@/lib/control/need-analyses";

type DealOption = { id: string; label: string; stage: string | null };

type Scope =
  | { kind: "organization"; organizationId: string; dealId?: string | null }
  | { kind: "deal"; dealId: string; organizationId?: string | null };

type Draft = {
  title: string;
  deal_id: string;
  context_problem: string;
  expected_outcomes: string;
  disability_accommodations: string;
  decided_adaptations: string;
  details: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
};

const EMPTY_DRAFT: Draft = {
  title: "",
  deal_id: "",
  context_problem: "",
  expected_outcomes: "",
  disability_accommodations: "",
  decided_adaptations: "",
  details: { ...EMPTY_NEED_ANALYSIS_DETAILS },
  recommendations: [],
};

const PLACE_MODE_OPTIONS: { value: NeedAnalysisPlaceMode; label: string }[] = [
  { value: "", label: "À préciser" },
  { value: "presentiel", label: "Présentiel" },
  { value: "visio", label: "Visio" },
  { value: "mixte", label: "Mixte" },
];

const FUNDING_OPTIONS: { value: NeedAnalysisFunding; label: string }[] = [
  { value: "", label: "À préciser" },
  { value: "opco", label: "OPCO" },
  { value: "entreprise", label: "Entreprise" },
  { value: "mixte", label: "Mixte OPCO / entreprise" },
  { value: "inconnu", label: "Inconnu" },
];

function analysisToDraft(analysis: OrganizationNeedAnalysis | null, prefillDealId?: string | null): Draft {
  if (!analysis) {
    return { ...EMPTY_DRAFT, deal_id: prefillDealId ?? "", details: { ...EMPTY_NEED_ANALYSIS_DETAILS }, recommendations: [] };
  }
  return {
    title: analysis.title,
    deal_id: analysis.deal_id ?? "",
    context_problem: analysis.context_problem,
    expected_outcomes: analysis.expected_outcomes,
    disability_accommodations: analysis.disability_accommodations,
    decided_adaptations: analysis.decided_adaptations,
    details: normalizeNeedAnalysisDetails(analysis.details),
    recommendations: analysis.recommendations.length
      ? analysis.recommendations.map((r) => ({ ...r }))
      : [],
  };
}

function saveUrl(scope: Scope, analysisId?: string) {
  if (scope.kind === "organization") {
    return analysisId
      ? `/api/super/comptes-clients/${scope.organizationId}/besoins/${analysisId}`
      : `/api/super/comptes-clients/${scope.organizationId}/besoins`;
  }
  return analysisId
    ? `/api/super-admin/crm/pipeline/deals/${scope.dealId}/besoins/${analysisId}`
    : `/api/super-admin/crm/pipeline/deals/${scope.dealId}/besoins`;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[#7B849F]">
      {children}
    </h3>
  );
}

export function AccountBesoinDialog({
  scope,
  analysis,
  deals,
  prefillDealId,
  surMesureHref,
  onClose,
  onSaved,
}: {
  scope: Scope;
  analysis: OrganizationNeedAnalysis | null;
  deals: DealOption[];
  prefillDealId?: string | null;
  surMesureHref?: string | null;
  onClose: () => void;
  onSaved: (analysis: OrganizationNeedAnalysis) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => analysisToDraft(analysis, prefillDealId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(analysisToDraft(analysis, prefillDealId));
  }, [analysis, prefillDealId]);

  const completeReady = isNeedAnalysisComplete({
    context_problem: draft.context_problem,
    expected_outcomes: draft.expected_outcomes,
    disability_accommodations: draft.disability_accommodations,
    decided_adaptations: draft.decided_adaptations,
    details: draft.details,
  });
  const showDealPicker = scope.kind === "organization" && deals.length > 0;

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function patchDetail<K extends keyof NeedAnalysisDetails>(key: K, value: NeedAnalysisDetails[K]) {
    setDraft((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
  }

  async function save(markComplete: boolean) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: draft.title.trim() || "Analyse du besoin",
        deal_id: scope.kind === "deal" ? scope.dealId : draft.deal_id || null,
        context_problem: draft.context_problem,
        expected_outcomes: draft.expected_outcomes,
        disability_accommodations: draft.disability_accommodations,
        decided_adaptations: draft.decided_adaptations,
        details: draft.details,
        recommendations: draft.recommendations.filter((r) => r.label.trim()),
        markComplete,
      };
      const res = await fetch(saveUrl(scope, analysis?.id), {
        method: analysis ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { analysis?: OrganizationNeedAnalysis; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error || "Enregistrement impossible");
      onSaved(json.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  function openSurMesure() {
    const brief = needAnalysisToSurMesureBrief({
      title: draft.title.trim() || "Analyse du besoin",
      context_problem: draft.context_problem,
      expected_outcomes: draft.expected_outcomes,
      audience: "",
      constraints: "",
      disability_accommodations: draft.disability_accommodations,
      decided_adaptations: draft.decided_adaptations,
      details: draft.details,
      recommendations: draft.recommendations.filter((r) => r.label.trim()),
    });
    try {
      sessionStorage.setItem(NEED_ANALYSIS_SURMESURE_STORAGE_KEY, brief);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-[28px] border border-[#1A2340] bg-[#111831] p-6 text-[#F4F7FF] shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">
              {analysis ? "Modifier l’analyse" : "Nouvelle analyse du besoin"}
            </h2>
            <p className="mt-1 text-sm text-[#8A93AE]">
              Prise de notes structurée — preuve Qualiopi indicateur 4. Remplissez les cases au fil
              de l’échange ; les 6 blocs restent requis pour marquer l’analyse complète.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-[#8A93AE] hover:text-white">
            Fermer
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Titre de la demande">
            <input
              className={fieldClass}
              value={draft.title}
              placeholder="Ex. Managers — recadrage et climat"
              onChange={(e) => patch("title", e.target.value)}
            />
          </Field>

          {showDealPicker ? (
            <Field label="Deal pipeline (optionnel)">
              <select
                className={fieldClass}
                value={draft.deal_id}
                onChange={(e) => patch("deal_id", e.target.value)}
              >
                <option value="">Aucun deal lié</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.label}
                    {deal.stage ? ` · ${deal.stage}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <SectionTitle>Contexte</SectionTitle>
          <Field label="Le contexte et le problème — pourquoi cette formation, maintenant ?">
            <textarea
              className={`${fieldClass} min-h-[88px]`}
              value={draft.context_problem}
              placeholder="Ex. nos managers évitent les recadrages, le climat se dégrade…"
              onChange={(e) => patch("context_problem", e.target.value)}
            />
          </Field>

          <Field label="Les résultats attendus — ce que l’entreprise veut voir changer">
            <textarea
              className={`${fieldClass} min-h-[80px]`}
              value={draft.expected_outcomes}
              onChange={(e) => patch("expected_outcomes", e.target.value)}
            />
          </Field>

          <SectionTitle>Public</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Effectif">
              <input
                className={fieldClass}
                value={draft.details.headcount}
                placeholder="Ex. 12 personnes"
                onChange={(e) => patchDetail("headcount", e.target.value)}
              />
            </Field>
            <Field label="Postes / métiers">
              <input
                className={fieldClass}
                value={draft.details.roles}
                placeholder="Ex. managers de proximité"
                onChange={(e) => patchDetail("roles", e.target.value)}
              />
            </Field>
            <Field label="Niveau">
              <input
                className={fieldClass}
                value={draft.details.level}
                placeholder="Ex. junior / confirmé"
                onChange={(e) => patchDetail("level", e.target.value)}
              />
            </Field>
            <Field label="Expérience">
              <input
                className={fieldClass}
                value={draft.details.experience}
                placeholder="Ex. 2–5 ans d’encadrement"
                onChange={(e) => patchDetail("experience", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notes public (optionnel)">
            <textarea
              className={`${fieldClass} min-h-[64px]`}
              value={draft.details.audience_notes}
              placeholder="Précisions sur le groupe, mixité, turnover…"
              onChange={(e) => patchDetail("audience_notes", e.target.value)}
            />
          </Field>

          <SectionTitle>Cadre & contraintes</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Modalité">
              <select
                className={fieldClass}
                value={draft.details.place_mode}
                onChange={(e) =>
                  patchDetail("place_mode", e.target.value as NeedAnalysisPlaceMode)
                }
              >
                {PLACE_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lieu">
              <input
                className={fieldClass}
                value={draft.details.place}
                placeholder="Ex. Paris 8e / locaux client"
                onChange={(e) => patchDetail("place", e.target.value)}
              />
            </Field>
            <Field label="Durée">
              <input
                className={fieldClass}
                value={draft.details.duration}
                placeholder="Ex. 2 jours / 14 h"
                onChange={(e) => patchDetail("duration", e.target.value)}
              />
            </Field>
            <Field label="Dates / période">
              <input
                className={fieldClass}
                value={draft.details.dates}
                placeholder="Ex. mars 2026 / avant Q2"
                onChange={(e) => patchDetail("dates", e.target.value)}
              />
            </Field>
            <Field label="Budget">
              <input
                className={fieldClass}
                value={draft.details.budget}
                placeholder="Ex. 8–12 k€ HT"
                onChange={(e) => patchDetail("budget", e.target.value)}
              />
            </Field>
            <Field label="Financement">
              <select
                className={fieldClass}
                value={draft.details.funding}
                onChange={(e) =>
                  patchDetail("funding", e.target.value as NeedAnalysisFunding)
                }
              >
                {FUNDING_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Autres contraintes (optionnel)">
            <textarea
              className={`${fieldClass} min-h-[64px]`}
              value={draft.details.constraints_notes}
              placeholder="Planning, matériel, contraintes internes…"
              onChange={(e) => patchDetail("constraints_notes", e.target.value)}
            />
          </Field>

          <SectionTitle>Handicap & adaptations</SectionTitle>
          <Field label="Situations de handicap et aménagements éventuels">
            <textarea
              className={`${fieldClass} min-h-[72px]`}
              value={draft.disability_accommodations}
              placeholder="Décrire les besoins d’aménagement, pas la situation médicale."
              onChange={(e) => patch("disability_accommodations", e.target.value)}
            />
          </Field>

          <Field label="Adaptations décidées — cas pratiques, durée, modules retenus…">
            <textarea
              className={`${fieldClass} min-h-[80px]`}
              value={draft.decided_adaptations}
              onChange={(e) => patch("decided_adaptations", e.target.value)}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[#8A93AE]">Préconisations de formation (optionnel)</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold text-[#C9D2E8]"
                onClick={() =>
                  patch("recommendations", [
                    ...draft.recommendations,
                    { label: "", notes: "", catalog_course_id: null },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            <p className="text-xs text-[#6C7593]">
              Même si la formation n’existe pas encore au catalogue — utile pour co-construire en
              Sur-mesure.
            </p>
            {draft.recommendations.map((rec, index) => (
              <div key={index} className="flex gap-2 rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    className={fieldClass}
                    value={rec.label}
                    placeholder="Intitulé préconisé"
                    onChange={(e) => {
                      const next = [...draft.recommendations];
                      next[index] = { ...next[index], label: e.target.value };
                      patch("recommendations", next);
                    }}
                  />
                  <input
                    className={fieldClass}
                    value={rec.notes}
                    placeholder="Notes (public, durée, angle…)"
                    onChange={(e) => {
                      const next = [...draft.recommendations];
                      next[index] = { ...next[index], notes: e.target.value };
                      patch("recommendations", next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="self-start rounded-full p-2 text-[#FF8A9B] hover:bg-[#2A1520]"
                  onClick={() =>
                    patch(
                      "recommendations",
                      draft.recommendations.filter((_, i) => i !== index),
                    )
                  }
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A2340] pt-4">
          {surMesureHref ? (
            <Link
              href={surMesureHref}
              onClick={openSurMesure}
              className="text-sm font-semibold text-[#A99BFF] hover:underline"
            >
              Ouvrir Sur-mesure avec ce brief →
            </Link>
          ) : (
            <span className="text-xs text-[#6C7593]">
              Sur-mesure disponible une fois le compte client créé.
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(false)}
              className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#C9D2E8] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer brouillon"}
            </button>
            <button
              type="button"
              disabled={saving || !completeReady}
              title={
                completeReady
                  ? undefined
                  : "Renseignez les 6 blocs pour marquer l’analyse complète"
              }
              onClick={() => void save(true)}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marquer complète"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
