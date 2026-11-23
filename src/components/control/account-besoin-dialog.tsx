"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Field, fieldClass } from "./chrome";
import {
  BENEFICIARY_SITUATION_LABEL,
  EMPTY_NEED_ANALYSIS_DETAILS,
  EXCHANGE_MODE_LABEL,
  FUNDING_LABEL,
  NEED_ANALYSIS_SURMESURE_STORAGE_KEY,
  PLACE_MODE_LABEL,
  assessNeedAnalysisCompleteness,
  needAnalysisToSurMesureBrief,
  normalizeNeedAnalysisDetails,
  type NeedAnalysisBeneficiarySituation,
  type NeedAnalysisDetails,
  type NeedAnalysisDigitalEase,
  type NeedAnalysisExchangeMode,
  type NeedAnalysisFunding,
  type NeedAnalysisPlaceMode,
  type NeedAnalysisRecommendation,
  type NeedAnalysisRequestType,
  type OrganizationNeedAnalysis,
} from "@/lib/control/need-analyses";

type DealOption = { id: string; label: string; stage: string | null };

type StaffOption = { id: string; label: string; is_pedagogical_manager: boolean };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

type Scope =
  | { kind: "organization"; organizationId: string; dealId?: string | null }
  | { kind: "deal"; dealId: string; organizationId?: string | null };

type Draft = {
  title: string;
  deal_id: string;
  request_type: NeedAnalysisRequestType;
  exchange_date: string;
  exchange_mode: NeedAnalysisExchangeMode;
  interlocutor_name: string;
  interlocutor_role: string;
  conducted_by: string;
  accessibility_asked: boolean;
  accessibility_needed: "oui" | "non" | "";
  context_problem: string;
  expected_outcomes: string;
  disability_accommodations: string;
  decided_adaptations: string;
  validated_by: string;
  client_validated_at: string;
  client_validation_proof: string;
  details: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
};

const EMPTY_DRAFT: Draft = {
  title: "",
  deal_id: "",
  request_type: "entreprise",
  exchange_date: todayIsoDate(),
  exchange_mode: "",
  interlocutor_name: "",
  interlocutor_role: "",
  conducted_by: "",
  accessibility_asked: false,
  accessibility_needed: "",
  context_problem: "",
  expected_outcomes: "",
  disability_accommodations: "",
  decided_adaptations: "",
  validated_by: "",
  client_validated_at: "",
  client_validation_proof: "",
  details: { ...EMPTY_NEED_ANALYSIS_DETAILS },
  recommendations: [],
};

const REQUEST_TYPE_OPTIONS: { value: NeedAnalysisRequestType; label: string }[] = [
  { value: "entreprise", label: "Entreprise" },
  { value: "particulier", label: "Particulier" },
];

const EXCHANGE_MODE_OPTIONS = (
  Object.entries(EXCHANGE_MODE_LABEL) as [Exclude<NeedAnalysisExchangeMode, "">, string][]
).map(([value, label]) => ({ value, label }));

const PLACE_MODE_OPTIONS = (
  Object.entries(PLACE_MODE_LABEL) as [Exclude<NeedAnalysisPlaceMode, "">, string][]
).map(([value, label]) => ({ value, label }));

const FUNDING_ORDER_ENTREPRISE: Exclude<NeedAnalysisFunding, "">[] = [
  "entreprise",
  "opco",
  "mixte",
  "plan_dev",
  "particulier",
  "france_travail",
  "autre",
  "a_preciser",
  "inconnu",
];

const FUNDING_ORDER_PARTICULIER: Exclude<NeedAnalysisFunding, "">[] = [
  "particulier",
  "france_travail",
  "opco",
  "entreprise",
  "mixte",
  "plan_dev",
  "autre",
  "a_preciser",
  "inconnu",
];

const BENEFICIARY_SITUATION_OPTIONS = (
  Object.entries(BENEFICIARY_SITUATION_LABEL) as [
    Exclude<NeedAnalysisBeneficiarySituation, "">,
    string,
  ][]
).map(([value, label]) => ({ value, label }));

const DIGITAL_EASE_OPTIONS: { value: Exclude<NeedAnalysisDigitalEase, "">; label: string }[] = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "bonne", label: "Bonne" },
];

function analysisToDraft(analysis: OrganizationNeedAnalysis | null, prefillDealId?: string | null): Draft {
  if (!analysis) {
    return {
      ...EMPTY_DRAFT,
      exchange_date: todayIsoDate(),
      deal_id: prefillDealId ?? "",
      details: { ...EMPTY_NEED_ANALYSIS_DETAILS },
      recommendations: [],
      // Jamais préremplir la date de validation client.
      client_validated_at: "",
      client_validation_proof: "",
    };
  }
  return {
    title: analysis.title,
    deal_id: analysis.deal_id ?? "",
    request_type: analysis.request_type ?? "entreprise",
    exchange_date: analysis.exchange_date ?? "",
    exchange_mode: analysis.exchange_mode ?? "",
    interlocutor_name: analysis.interlocutor_name ?? "",
    interlocutor_role: analysis.interlocutor_role ?? "",
    conducted_by: analysis.conducted_by ?? "",
    accessibility_asked: Boolean(analysis.accessibility_asked),
    accessibility_needed: analysis.accessibility_needed ?? "",
    context_problem: analysis.context_problem,
    expected_outcomes: analysis.expected_outcomes,
    disability_accommodations: analysis.disability_accommodations,
    decided_adaptations: analysis.decided_adaptations,
    validated_by: analysis.validated_by ?? "",
    // Afficher seulement si tracée (lien ou manuel) — sinon vide.
    client_validated_at:
      analysis.client_validated_at && analysis.client_validation_source
        ? analysis.client_validated_at
        : "",
    client_validation_proof: analysis.client_validation_proof ?? "",
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

function sendClientUrl(scope: Scope, analysisId: string) {
  return `${saveUrl(scope, analysisId)}/send-client`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : d.toLocaleDateString("fr-FR");
}

function triState(value: boolean | null): "" | "oui" | "non" {
  return value === true ? "oui" : value === false ? "non" : "";
}

function fromTriState(value: string): boolean | null {
  return value === "oui" ? true : value === "non" ? false : null;
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
  onUpdated,
}: {
  scope: Scope;
  analysis: OrganizationNeedAnalysis | null;
  deals: DealOption[];
  prefillDealId?: string | null;
  surMesureHref?: string | null;
  onClose: () => void;
  onSaved: (analysis: OrganizationNeedAnalysis) => void;
  /** Mise à jour sans fermer le dialogue (ex. après envoi client). */
  onUpdated?: (analysis: OrganizationNeedAnalysis) => void;
}) {
  const [current, setCurrent] = useState<OrganizationNeedAnalysis | null>(analysis);
  const [draft, setDraft] = useState<Draft>(() => analysisToDraft(analysis, prefillDealId));
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const [currentIsRp, setCurrentIsRp] = useState(false);
  const [interlocutorEmail, setInterlocutorEmail] = useState("");

  useEffect(() => {
    setCurrent(analysis);
    setDraft(analysisToDraft(analysis, prefillDealId));
  }, [analysis, prefillDealId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/super/staff-options");
        const json = (await res.json().catch(() => null)) as {
          users?: StaffOption[];
          current_user_id?: string;
          current_is_pedagogical_manager?: boolean;
        } | null;
        if (cancelled) return;
        if (res.ok && json?.users) {
          setStaff(json.users);
          setCurrentIsRp(Boolean(json.current_is_pedagogical_manager));
          // Nouvelle analyse : l'utilisateur courant mène l'analyse par défaut.
          const me = json.current_user_id;
          if (!analysis && me && json.users.some((u) => u.id === me)) {
            setDraft((prev) => (prev.conducted_by ? prev : { ...prev, conducted_by: me }));
          }
        }
      } catch {
        /* liste vide : les sélecteurs restent utilisables en lecture */
      } finally {
        if (!cancelled) setStaffLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isParticulier = draft.request_type === "particulier";
  const locked = current?.status === "complete";
  const showDealPicker = scope.kind === "organization" && deals.length > 0;

  const exchangeMaxDate = useMemo(() => {
    const today = todayIsoDate();
    const created = current?.created_at ? current.created_at.slice(0, 10) : today;
    return created < today ? created : today;
  }, [current?.created_at]);

  const completeness = useMemo(
    () =>
      assessNeedAnalysisCompleteness({
        request_type: draft.request_type,
        exchange_date: draft.exchange_date,
        exchange_mode: draft.exchange_mode,
        interlocutor_name: draft.interlocutor_name,
        conducted_by: draft.conducted_by,
        context_problem: draft.context_problem,
        expected_outcomes: draft.expected_outcomes,
        accessibility_asked: draft.accessibility_asked,
        accessibility_needed: draft.accessibility_needed,
        disability_accommodations: draft.disability_accommodations,
        decided_adaptations: draft.decided_adaptations,
        validated_by: draft.validated_by,
        details: draft.details,
      }),
    [draft],
  );

  const staffNames = useMemo(() => new Map(staff.map((u) => [u.id, u.label])), [staff]);
  const managers = useMemo(() => staff.filter((u) => u.is_pedagogical_manager), [staff]);
  const hasFlaggedManager = managers.length > 0;
  /** Un RP ne peut pas valider une analyse qu’il a lui-même menée. */
  const validatorOptions = useMemo(
    () => managers.filter((u) => u.id !== draft.conducted_by),
    [managers, draft.conducted_by],
  );

  const missingExtra = useMemo(() => {
    const extra: string[] = [];
    if (staffLoaded && !hasFlaggedManager) {
      extra.push("Désignez un Responsable pédagogique dans Paramètres > Équipe");
    }
    return extra;
  }, [staffLoaded, hasFlaggedManager]);

  const allMissing = useMemo(
    () => [...completeness.missing, ...missingExtra],
    [completeness.missing, missingExtra],
  );
  const completeReady = completeness.ready && missingExtra.length === 0;

  const showDisabilityFields = draft.accessibility_asked && draft.accessibility_needed === "oui";
  const clientDateLocked =
    Boolean(current?.client_validated_at && current.client_validation_source === "link") ||
    !currentIsRp;

  const fundingOrder = isParticulier ? FUNDING_ORDER_PARTICULIER : FUNDING_ORDER_ENTREPRISE;

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function patchDetail<K extends keyof NeedAnalysisDetails>(key: K, value: NeedAnalysisDetails[K]) {
    setDraft((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
  }

  function buildPayload(markComplete?: boolean) {
    const needsDisability = draft.accessibility_needed === "oui";
    const payload: Record<string, unknown> = {
      title: draft.title.trim() || "Analyse du besoin",
      deal_id: scope.kind === "deal" ? scope.dealId : draft.deal_id || null,
      request_type: draft.request_type,
      exchange_date: draft.exchange_date || null,
      exchange_mode: draft.exchange_mode,
      interlocutor_name: draft.interlocutor_name,
      interlocutor_role: isParticulier ? "" : draft.interlocutor_role,
      conducted_by: draft.conducted_by || null,
      accessibility_asked: draft.accessibility_asked,
      accessibility_needed: draft.accessibility_asked ? draft.accessibility_needed : "",
      context_problem: draft.context_problem,
      expected_outcomes: draft.expected_outcomes,
      disability_accommodations: needsDisability ? draft.disability_accommodations : "",
      decided_adaptations: needsDisability ? draft.decided_adaptations : "",
      validated_by: draft.validated_by || null,
      details: draft.details,
      recommendations: draft.recommendations.filter((r) => r.label.trim()),
      ...(markComplete === undefined ? {} : { markComplete }),
    };
    // Saisie manuelle date client : uniquement RP + preuve (sinon le serveur ignore / refuse).
    if (
      currentIsRp &&
      draft.client_validated_at &&
      draft.client_validation_proof.trim() &&
      current?.client_validation_source !== "link"
    ) {
      payload.client_validated_at = draft.client_validated_at;
      payload.client_validation_proof = draft.client_validation_proof.trim();
    }
    return payload;
  }

  /** Enregistre (POST/PATCH) et renvoie l'analyse sauvegardée. */
  async function persist(markComplete?: boolean): Promise<OrganizationNeedAnalysis> {
    const res = await fetch(saveUrl(scope, current?.id), {
      method: current ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(markComplete)),
    });
    const json = (await res.json()) as { analysis?: OrganizationNeedAnalysis; error?: string };
    if (!res.ok || !json.analysis) throw new Error(json.error || "Enregistrement impossible");
    return json.analysis;
  }

  async function save(markComplete: boolean) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      onSaved(await persist(markComplete));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  async function sendToClient() {
    const email = interlocutorEmail.trim();
    if (!email) {
      setError("Renseignez l’email de l’interlocuteur pour envoyer l’analyse.");
      return;
    }
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      // On enregistre d'abord pour que le PDF envoyé reflète la saisie (statut inchangé).
      const saved = await persist();
      setCurrent(saved);
      onUpdated?.(saved);

      const res = await fetch(sendClientUrl(scope, saved.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interlocutor_email: email }),
      });
      const json = (await res.json()) as { analysis?: OrganizationNeedAnalysis; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error || "Envoi impossible");
      const sent = { ...saved, client_sent_at: json.analysis.client_sent_at };
      setCurrent(sent);
      onUpdated?.(sent);
      setNotice(`Analyse envoyée à ${email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
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
      request_type: draft.request_type,
    });
    try {
      sessionStorage.setItem(NEED_ANALYSIS_SURMESURE_STORAGE_KEY, brief);
    } catch {
      /* ignore */
    }
  }

  function staffLabel(id: string | null | undefined) {
    return id ? staffNames.get(id) : undefined;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-[28px] border border-[#1A2340] bg-[#111831] p-6 text-[#F4F7FF] shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">
              {current ? "Modifier l’analyse" : "Nouvelle analyse du besoin"}
            </h2>
            <p className="mt-1 text-sm text-[#8A93AE]">
              Prise de notes structurée — preuve Qualiopi indicateur 4. Remplissez les cases au fil
              de l’échange ; tous les blocs requis doivent être renseignés pour marquer l’analyse
              complète.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-[#8A93AE] hover:text-white">
            Fermer
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Type de demande">
            <select
              className={fieldClass}
              value={draft.request_type}
              onChange={(e) => patch("request_type", e.target.value as NeedAnalysisRequestType)}
            >
              {REQUEST_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Titre de la demande">
            <input
              className={fieldClass}
              value={draft.title}
              placeholder={
                isParticulier
                  ? "Ex. Reconversion vers la formation — projet de Marie"
                  : "Ex. Managers — recadrage et climat"
              }
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

          <SectionTitle>Échange</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={locked ? "Date de l’échange (verrouillée — analyse complète)" : "Date de l’échange"}>
              <input
                type="date"
                className={`${fieldClass} disabled:opacity-60`}
                value={draft.exchange_date}
                max={exchangeMaxDate}
                disabled={locked}
                onChange={(e) => patch("exchange_date", e.target.value)}
              />
              <p className="mt-1 text-xs text-[#6C7593]">Vérifiez la date réelle de l’échange.</p>
            </Field>
            <Field label="Mode d’échange">
              <select
                className={fieldClass}
                value={draft.exchange_mode}
                onChange={(e) =>
                  patch("exchange_mode", e.target.value as NeedAnalysisExchangeMode)
                }
              >
                <option value="">Choisir…</option>
                {EXCHANGE_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Interlocuteur (nom)">
              <input
                className={fieldClass}
                value={draft.interlocutor_name}
                placeholder={isParticulier ? "Ex. Marie Dupont" : "Ex. Sophie Martin"}
                onChange={(e) => patch("interlocutor_name", e.target.value)}
              />
            </Field>
            {!isParticulier ? (
              <Field label="Interlocuteur (fonction)">
                <input
                  className={fieldClass}
                  value={draft.interlocutor_role}
                  placeholder="Ex. DRH"
                  onChange={(e) => patch("interlocutor_role", e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Analyse menée par">
              <select
                className={fieldClass}
                value={draft.conducted_by}
                onChange={(e) => {
                  const next = e.target.value;
                  setDraft((prev) => ({
                    ...prev,
                    conducted_by: next,
                    validated_by: prev.validated_by === next ? "" : prev.validated_by,
                  }));
                }}
              >
                <option value="">{staffLoaded ? "Choisir…" : "Chargement…"}</option>
                {draft.conducted_by && !staffNames.has(draft.conducted_by) ? (
                  <option value={draft.conducted_by}>Utilisateur enregistré</option>
                ) : null}
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isParticulier ? (
            <>
              <SectionTitle>Bénéficiaire</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Situation actuelle">
                  <select
                    className={fieldClass}
                    value={draft.details.beneficiary_situation}
                    onChange={(e) =>
                      patchDetail(
                        "beneficiary_situation",
                        e.target.value as NeedAnalysisBeneficiarySituation,
                      )
                    }
                  >
                    <option value="">Choisir…</option>
                    {BENEFICIARY_SITUATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Temps disponible par semaine">
                  <input
                    className={fieldClass}
                    value={draft.details.weekly_availability}
                    placeholder="Ex. 5 h / semaine"
                    onChange={(e) => patchDetail("weekly_availability", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Projet professionnel">
                <textarea
                  className={`${fieldClass} min-h-[72px]`}
                  value={draft.details.professional_project}
                  placeholder="Ex. devenir formatrice dans les 12 prochains mois…"
                  onChange={(e) => patchDetail("professional_project", e.target.value)}
                />
              </Field>
              <Field label="Motivations et attentes">
                <textarea
                  className={`${fieldClass} min-h-[72px]`}
                  value={draft.details.motivations}
                  onChange={(e) => patchDetail("motivations", e.target.value)}
                />
              </Field>
              <Field label="Connaissances / expérience dans le domaine">
                <textarea
                  className={`${fieldClass} min-h-[64px]`}
                  value={draft.details.domain_experience}
                  onChange={(e) => patchDetail("domain_experience", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ordinateur">
                  <select
                    className={fieldClass}
                    value={triState(draft.details.has_computer)}
                    onChange={(e) => patchDetail("has_computer", fromTriState(e.target.value))}
                  >
                    <option value="">Non renseigné</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </Field>
                <Field label="Connexion internet">
                  <select
                    className={fieldClass}
                    value={triState(draft.details.has_internet)}
                    onChange={(e) => patchDetail("has_internet", fromTriState(e.target.value))}
                  >
                    <option value="">Non renseigné</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </Field>
                <Field label="Aisance numérique">
                  <select
                    className={fieldClass}
                    value={draft.details.digital_ease}
                    onChange={(e) =>
                      patchDetail("digital_ease", e.target.value as NeedAnalysisDigitalEase)
                    }
                  >
                    <option value="">Non renseignée</option>
                    {DIGITAL_EASE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6E5BFF]"
                  checked={draft.details.prerequisites_checked}
                  onChange={(e) => patchDetail("prerequisites_checked", e.target.checked)}
                />
                Prérequis de la formation vérifiés avec la personne
              </label>
              <Field label="Commentaire prérequis (optionnel)">
                <input
                  className={fieldClass}
                  value={draft.details.prerequisites_comment}
                  onChange={(e) => patchDetail("prerequisites_comment", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <>
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
            </>
          )}

          <SectionTitle>Contexte</SectionTitle>
          <Field
            label={
              isParticulier
                ? "Pourquoi cette formation, maintenant ?"
                : "Le contexte et le problème — pourquoi cette formation, maintenant ?"
            }
          >
            <textarea
              className={`${fieldClass} min-h-[88px]`}
              value={draft.context_problem}
              placeholder={
                isParticulier
                  ? "Ex. changement de poste prévu, besoin de monter en compétences…"
                  : "Ex. nos managers évitent les recadrages, le climat se dégrade…"
              }
              onChange={(e) => patch("context_problem", e.target.value)}
            />
          </Field>

          <Field
            label={
              isParticulier
                ? "Ce que la personne veut être capable de faire"
                : "Les résultats attendus — ce que l’entreprise veut voir changer"
            }
          >
            <textarea
              className={`${fieldClass} min-h-[80px]`}
              value={draft.expected_outcomes}
              onChange={(e) => patch("expected_outcomes", e.target.value)}
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
                <option value="">Non renseignée</option>
                {PLACE_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
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
            {isParticulier ? (
              <Field label="Prix annoncé (TTC)">
                <input
                  className={fieldClass}
                  value={draft.details.announced_price_ttc}
                  placeholder="Ex. 490 € TTC"
                  onChange={(e) => patchDetail("announced_price_ttc", e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Budget">
                <input
                  className={fieldClass}
                  value={draft.details.budget}
                  placeholder="Ex. 8–12 k€ HT"
                  onChange={(e) => patchDetail("budget", e.target.value)}
                />
              </Field>
            )}
            <Field label="Financement">
              <select
                className={fieldClass}
                value={draft.details.funding}
                onChange={(e) => patchDetail("funding", e.target.value as NeedAnalysisFunding)}
              >
                <option value="">Non renseigné</option>
                {fundingOrder.map((value) => (
                  <option key={value} value={value}>
                    {FUNDING_LABEL[value]}
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
          <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#6E5BFF]"
              checked={draft.accessibility_asked}
              onChange={(e) => {
                const checked = e.target.checked;
                setDraft((prev) => ({
                  ...prev,
                  accessibility_asked: checked,
                  accessibility_needed: checked ? prev.accessibility_needed : "",
                }));
              }}
            />
            La question des besoins d’aménagement (handicap) a été posée
          </label>
          {draft.accessibility_asked ? (
            <Field label="Besoin d’aménagement exprimé ?">
              <select
                className={fieldClass}
                value={draft.accessibility_needed}
                onChange={(e) =>
                  patch("accessibility_needed", e.target.value as "oui" | "non" | "")
                }
              >
                <option value="">Non renseigné</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </Field>
          ) : null}

          {showDisabilityFields ? (
            <>
              <Field label="Situations et aménagements">
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
            </>
          ) : null}

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

          <SectionTitle>Validation</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Validée par (interne — Responsable pédagogique)">
              <select
                className={fieldClass}
                value={draft.validated_by}
                disabled={!hasFlaggedManager}
                onChange={(e) => patch("validated_by", e.target.value)}
              >
                <option value="">{staffLoaded ? "Choisir…" : "Chargement…"}</option>
                {draft.validated_by &&
                !validatorOptions.some((u) => u.id === draft.validated_by) ? (
                  <option value={draft.validated_by}>
                    {staffLabel(draft.validated_by) ?? "Utilisateur enregistré (hors liste RP)"}
                  </option>
                ) : null}
                {validatorOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Validée par le client le">
              <input
                type="date"
                className={`${fieldClass} disabled:opacity-60`}
                value={draft.client_validated_at}
                disabled={clientDateLocked}
                onChange={(e) => patch("client_validated_at", e.target.value)}
              />
              {current?.client_validation_source === "link" ? (
                <p className="mt-1 text-xs text-[#6C7593]">
                  Remplie automatiquement via le lien de validation
                  {current.client_validated_by_email
                    ? ` (${current.client_validated_by_email})`
                    : ""}
                  .
                </p>
              ) : currentIsRp ? (
                <p className="mt-1 text-xs text-[#6C7593]">
                  Saisie manuelle réservée au Responsable pédagogique — preuve obligatoire.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#6C7593]">
                  Remplie quand le client clique le lien reçu par e-mail.
                </p>
              )}
            </Field>
          </div>
          {currentIsRp &&
          current?.client_validation_source !== "link" &&
          (draft.client_validated_at || draft.client_validation_proof) ? (
            <Field label="Preuve de validation (obligatoire si saisie manuelle)">
              <input
                className={fieldClass}
                value={draft.client_validation_proof}
                placeholder="Ex. mail du client du 12/03 — objet « OK analyse »"
                onChange={(e) => patch("client_validation_proof", e.target.value)}
              />
            </Field>
          ) : null}
          {staffLoaded && !hasFlaggedManager ? (
            <p className="rounded-2xl border border-[#3A1820] bg-[#2A1520] px-3 py-2 text-xs text-[#FF8A9B]">
              Désignez un Responsable pédagogique dans{" "}
              <Link href="/super/parametres" className="underline">
                Paramètres &gt; Équipe
              </Link>{" "}
              pour pouvoir valider et marquer l’analyse complète.
            </p>
          ) : null}
          {draft.conducted_by &&
          draft.validated_by &&
          draft.conducted_by === draft.validated_by ? (
            <p className="text-xs text-[#FF8A9B]">
              La personne qui mène l’analyse ne peut pas la valider — choisissez un autre Responsable
              pédagogique.
            </p>
          ) : null}
          {current?.validated_at ? (
            <p className="text-xs text-[#6C7593]">
              Validation interne enregistrée le {fmtDate(current.validated_at)}.
            </p>
          ) : null}

          <div className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
            <Field label="Email de l’interlocuteur (pour l’envoi de l’analyse)">
              <input
                type="email"
                className={fieldClass}
                value={interlocutorEmail}
                placeholder="prenom.nom@client.fr"
                onChange={(e) => setInterlocutorEmail(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving || sending}
                onClick={() => void sendToClient()}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#C9D2E8] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Envoyer au client pour validation"
                )}
              </button>
              <span className="text-xs text-[#6C7593]">
                {current?.client_sent_at
                  ? `Envoyée au client le ${fmtDate(current.client_sent_at)}`
                  : "Pas encore envoyée au client."}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#6C7593]">
              Le contenu saisi est enregistré, puis le PDF et le lien de validation sont envoyés par
              email.
            </p>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-[#6BE39B]">{notice}</p> : null}

        <div className="mt-6 space-y-3 border-t border-[#1A2340] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                disabled={saving || sending}
                onClick={() => void save(false)}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#C9D2E8] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer brouillon"}
              </button>
              <button
                type="button"
                disabled={saving || sending || !completeReady}
                title={
                  completeReady ? undefined : `Il manque : ${allMissing.join(", ")}`
                }
                onClick={() => void save(true)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marquer complète"}
              </button>
            </div>
          </div>

          {!completeReady ? (
            <div className="text-xs text-[#6C7593]">
              <p className="font-semibold text-[#8A93AE]">Pour marquer complète, il manque :</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {allMissing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {current ? (
            <p className="text-xs text-[#6C7593]">
              Créée le {fmtDate(current.created_at)}
              {staffLabel(current.created_by) ? ` par ${staffLabel(current.created_by)}` : ""} ·
              Modifiée le {fmtDate(current.updated_at)}
              {staffLabel(current.updated_by) ? ` par ${staffLabel(current.updated_by)}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
