"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  BPF_FUNDER_TYPES,
  BPF_LEARNER_STATUSES,
  FORMATION_DOSSIER_STATUSES,
  FORMATION_DOSSIER_STATUS_LABELS,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";

type DocRow = {
  id: string;
  kind: string;
  title: string;
  status: string;
  file_url: string | null;
  access_token?: string | null;
  sent_at: string | null;
  opened_at: string | null;
  signed_at: string | null;
  generated_at?: string | null;
};

type EventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  motif: string | null;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  name: string;
  email: string | null;
  job_title: string | null;
  bpf_learner_status: string | null;
  needs_specific_support: boolean;
  attendance_method_pref: string | null;
  attendance?: { planned: number; attended: number };
  assessments?: {
    positionnement: { status: string; score_pct: number | null } | null;
    eval_chaud: { status: string; score_pct: number | null } | null;
    eval_froid: { status: string; score_pct: number | null } | null;
  };
};

type DossierDetail = {
  id: string;
  course_title: string | null;
  status: FormationDossierStatus;
  organization_id: string;
  amount_ht_cents: number | null;
  amount_tva_cents: number | null;
  amount_ttc_cents: number | null;
  funding_type: string | null;
  opco_name?: string | null;
  bpf_funder_type: string | null;
  subcontracting: string;
  partner_of_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  pending_confirm_fields: string[] | null;
  deal_regressed: boolean;
  identity_check_first_attendance: boolean;
  formation_documents?: DocRow[];
  formation_events?: EventRow[];
};

const DOC_STATUS_LABEL: Record<string, string> = {
  to_generate: "À générer",
  sent: "Envoyé",
  opened: "Ouvert",
  signed: "Signé",
};

const LOT4_KINDS = new Set([
  "devis",
  "convention",
  "cgv",
  "reglement",
  "programme",
  "convocation",
  "livret",
  "certificat",
  "attestation",
]);

function docStatusLabel(doc: DocRow): string {
  if (doc.status === "to_generate" && (doc.file_url || doc.generated_at)) return "Prêt";
  return DOC_STATUS_LABEL[doc.status] ?? doc.status;
}

function docStatusBadgeClass(doc: DocRow): string {
  const status = String(doc.status ?? "");
  if (status === "signed" || Boolean(doc.signed_at)) {
    return "rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[11px] font-bold text-white";
  }
  if (status === "sent" || status === "opened" || Boolean(doc.sent_at)) {
    return "rounded-full bg-[#15803D] px-2.5 py-0.5 text-[11px] font-bold text-white";
  }
  return "rounded-full bg-[#0A0C1B] px-2.5 py-0.5 text-[11px] text-[#B7AEFF]";
}

const LOCK_HINTS: Partial<Record<FormationDossierStatus, string>> = {
  mise_en_place: "Convention signée + BPF requis.",
  session: "Formateur requis.",
  fin: "Tous les créneaux doivent être clôturés.",
  cloture: "Facture émise + pièces Qualiopi requises.",
};

type Lot5Meta = {
  locks: {
    convention_signed: boolean;
    trainer_assigned: boolean;
    trainer_user_id: string | null;
    trainer_cv_ready?: boolean;
    slots_total: number;
    slots_closed: number;
    attendance_complete: boolean;
    invoice_validated: boolean;
  };
  invoice: { number: string; amount_ttc_cents: number | null } | null;
  trainers: Array<{ id: string; name: string }>;
  catalog?: {
    training_course_id: string | null;
    suggested_ht_cents: number | null;
    label: string | null;
  };
  organization?: {
    id: string | null;
    name: string | null;
    siret: string | null;
    siret_ok: boolean;
  };
};

export function FormationDossierSheet({
  dossierId,
  onClose,
  onChanged,
}: {
  dossierId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [orgName, setOrgName] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [tab, setTab] = useState<"docs" | "coffre" | "participants" | "bpf" | "historique">(
    "docs",
  );
  const [coffre, setCoffre] = useState<{
    items: Array<{
      key: string;
      label: string;
      status: "ready" | "partial" | "missing" | "not_due";
      detail?: string | null;
    }>;
    ready_count: number;
    total_count: number;
  } | null>(null);
  const [coffreBusy, setCoffreBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    job_title: "",
    bpf_learner_status: "salarie_prive",
  });
  const [meta, setMeta] = useState<Lot5Meta | null>(null);
  const [trainerId, setTrainerId] = useState("");
  const [devisDraft, setDevisDraft] = useState({
    course_title: "",
    contact_name: "",
    contact_email: "",
    amount_ht_euros: "",
    funding_type: "direct" as "direct" | "opco" | "subrogation",
    opco_name: "",
    notes: "",
  });
  const [devisBusy, setDevisBusy] = useState(false);
  const [readyLink, setReadyLink] = useState<{
    id: string;
    status: string;
    expires_at: string | null;
    submitted_at: string | null;
    opened_at: string | null;
    progress_ready: number;
    progress_total: number;
    recipient_email: string;
  } | null>(null);
  const [readyBusy, setReadyBusy] = useState(false);

  const loadReady = useCallback(async () => {
    if (!dossierId) return;
    try {
      const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/ready`);
      const json = await parseFetchJson<{
        link?: {
          id: string;
          status: string;
          expires_at: string | null;
          submitted_at: string | null;
          opened_at: string | null;
          progress_ready: number;
          progress_total: number;
          recipient_email: string;
        } | null;
      }>(res);
      if (res.ok) setReadyLink(json.link ?? null);
    } catch {
      /* ignore */
    }
  }, [dossierId]);

  const load = useCallback(async () => {
    if (!dossierId) return;
    setLoading(true);
    try {
      const [dRes, pRes, mRes] = await Promise.all([
        fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}`),
        fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/participants`),
        fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/meta`),
      ]);
      const dJson = await parseFetchJson<{ dossier?: DossierDetail; error?: string }>(dRes);
      const pJson = await parseFetchJson<{ participants?: ParticipantRow[]; error?: string }>(pRes);
      const mJson = await parseFetchJson<Lot5Meta & { error?: string }>(mRes);
      if (!dRes.ok) throw new Error(dJson.error);
      setDossier(dJson.dossier ?? null);
      const catalogHt =
        mRes.ok && mJson.catalog?.suggested_ht_cents != null && mJson.catalog.suggested_ht_cents > 0
          ? mJson.catalog.suggested_ht_cents
          : null;
      if (dJson.dossier) {
        const ht = dJson.dossier.amount_ht_cents;
        const funding = String(dJson.dossier.funding_type ?? "direct");
        const resolvedHt =
          ht != null && ht > 0 ? ht : catalogHt;
        setDevisDraft({
          course_title: dJson.dossier.course_title ?? "",
          contact_name: dJson.dossier.contact_name ?? "",
          contact_email: dJson.dossier.contact_email ?? "",
          amount_ht_euros: resolvedHt != null ? String(resolvedHt / 100) : "",
          funding_type:
            funding === "opco" || funding === "subrogation" ? funding : "direct",
          opco_name: String(dJson.dossier.opco_name ?? "").trim(),
          notes: dJson.dossier.notes ?? "",
        });
      }
      setParticipants(pJson.participants ?? []);
      if (mRes.ok) {
        setMeta(mJson);
        if (mJson.locks?.trainer_user_id) setTrainerId(String(mJson.locks.trainer_user_id));
      }
      if (dJson.dossier?.organization_id) {
        const listRes = await fetch(
          `/api/super-admin/crm/formation-dossiers?organization_id=${dJson.dossier.organization_id}&enriched=1`,
        );
        const listJson = await parseFetchJson<{
          dossiers?: Array<{ id: string; organization_name?: string }>;
        }>(listRes);
        const hit = (listJson.dossiers ?? []).find((d) => d.id === dossierId);
        setOrgName(hit?.organization_name ?? "Entreprise");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dossier indisponible");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [dossierId, onClose]);

  useEffect(() => {
    if (dossierId) {
      void load();
      void loadReady();
    } else {
      setDossier(null);
      setParticipants([]);
      setCoffre(null);
      setReadyLink(null);
    }
  }, [dossierId, load, loadReady]);

  const loadCoffre = useCallback(async () => {
    if (!dossierId) return;
    try {
      const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/coffre`);
      const json = await parseFetchJson<{
        items?: Array<{
          key: string;
          label: string;
          status: "ready" | "partial" | "missing" | "not_due";
          detail?: string | null;
        }>;
        ready_count?: number;
        total_count?: number;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(json.error);
      setCoffre({
        items: json.items ?? [],
        ready_count: json.ready_count ?? 0,
        total_count: json.total_count ?? 0,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coffre indisponible");
    }
  }, [dossierId]);

  useEffect(() => {
    if (tab === "coffre" && dossierId) void loadCoffre();
  }, [tab, dossierId, loadCoffre]);

  const exportCoffreZip = async () => {
    if (!dossierId) return;
    setCoffreBusy(true);
    try {
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers/${dossierId}/coffre?format=zip`,
      );
      if (!res.ok) {
        const json = await parseFetchJson<{ error?: string }>(res);
        throw new Error(json.error || "Export impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coffre-qualiopi-${dossierId.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Coffre exporté");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export refusé");
    } finally {
      setCoffreBusy(false);
    }
  };

  if (!dossierId) return null;

  const statusIdx = dossier
    ? FORMATION_DOSSIER_STATUSES.indexOf(dossier.status)
    : -1;

  const saveBpf = async (patch: Record<string, unknown>) => {
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error ?? "Enregistrement impossible");
      return;
    }
    toast.success("Enregistré");
    await load();
    onChanged();
  };

  const previewDoc = (doc: DocRow) => {
    // Toujours passer par l'API (token ou admin) — jamais d'URL storage publique
    if (doc.access_token) {
      window.open(
        `/api/formation-documents/${encodeURIComponent(doc.access_token)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    if (!LOT4_KINDS.has(doc.kind) && doc.kind !== "facture") {
      toast.message("Prévisualisation bientôt");
      return;
    }
    window.open(
      `/api/super-admin/crm/formation-dossiers/${dossierId}/documents/${doc.kind}/pdf`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const sendDoc = async (doc: DocRow) => {
    if (!LOT4_KINDS.has(doc.kind)) {
      toast.message("Envoi bientôt");
      return;
    }
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/documents/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: doc.kind }),
    });
    const json = await parseFetchJson<{ error?: string; sent_to?: string[] }>(res);
    if (!res.ok) {
      toast.error(json.error || "Envoi impossible");
      return;
    }
    toast.success(
      json.sent_to?.length
        ? `Envoyé à ${json.sent_to.join(", ")}`
        : "Document envoyé",
    );
    await load();
    if (doc.kind === "devis") await loadReady();
    onChanged();
  };

  const saveDevisDraft = async (opts?: { requireAmount?: boolean }): Promise<boolean> => {
    const raw = String(devisDraft.amount_ht_euros ?? "").trim().replace(",", ".");
    // Champ vide → ne jamais écrire 0 € (Number("") === 0).
    if (!raw) {
      if (opts?.requireAmount) {
        toast.error("Indiquez le montant HT du devis (catalogue ou négocié).");
        return false;
      }
      const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_title: devisDraft.course_title.trim() || null,
          contact_name: devisDraft.contact_name.trim() || null,
          contact_email: devisDraft.contact_email.trim().toLowerCase() || null,
          notes: devisDraft.notes.trim() || null,
          funding_type: devisDraft.funding_type,
          opco_name:
            devisDraft.funding_type === "opco" || devisDraft.funding_type === "subrogation"
              ? devisDraft.opco_name.trim() || null
              : null,
        }),
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) {
        toast.error(json.error ?? "Enregistrement du devis impossible");
        return false;
      }
      return true;
    }
    const htEuros = Number(raw);
    if (!Number.isFinite(htEuros) || htEuros <= 0) {
      toast.error("Montant HT invalide — saisissez un montant supérieur à 0 €.");
      return false;
    }
    const htCents = Math.round(htEuros * 100);
    const tvaCents = Math.round(htCents * 0.2);
    const ttcCents = htCents + tvaCents;
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_title: devisDraft.course_title.trim() || null,
        contact_name: devisDraft.contact_name.trim() || null,
        contact_email: devisDraft.contact_email.trim().toLowerCase() || null,
        notes: devisDraft.notes.trim() || null,
        funding_type: devisDraft.funding_type,
        opco_name:
          devisDraft.funding_type === "opco" || devisDraft.funding_type === "subrogation"
            ? devisDraft.opco_name.trim() || null
            : null,
        amount_ht_cents: htCents,
        amount_tva_cents: tvaCents,
        amount_ttc_cents: ttcCents,
      }),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error ?? "Enregistrement du devis impossible");
      return false;
    }
    return true;
  };

  const previewDevis = async () => {
    // Ouvrir l'onglet synchrone (sinon le navigateur bloque après les await).
    const pdfUrl = `/api/super-admin/crm/formation-dossiers/${dossierId}/documents/devis/pdf`;
    const previewTab = window.open("about:blank", "_blank");
    setDevisBusy(true);
    try {
      const ok = await saveDevisDraft({ requireAmount: true });
      if (!ok) {
        previewTab?.close();
        return;
      }
      if (previewTab) {
        previewTab.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        toast.message("Autorisez les pop-ups pour prévisualiser le PDF.");
      }
    } catch (error) {
      previewTab?.close();
      toast.error(error instanceof Error ? error.message : "Prévisualisation impossible");
    } finally {
      setDevisBusy(false);
    }
  };

  const sendDevis = async () => {
    setDevisBusy(true);
    try {
      if (meta?.organization && !meta.organization.siret_ok) {
        toast.error(
          "SIRET client manquant ou invalide — renseignez-le sur le compte client avant d'envoyer le devis.",
        );
        return;
      }
      const ok = await saveDevisDraft({ requireAmount: true });
      if (!ok) return;
      if (!devisDraft.contact_email.includes("@")) {
        toast.error("E-mail destinataire du devis requis");
        return;
      }
      const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "devis" }),
      });
      const json = await parseFetchJson<{ error?: string; sent_to?: string[]; code?: string }>(res);
      if (!res.ok) {
        toast.error(json.error || "Envoi du devis impossible");
        return;
      }
      toast.success(
        json.sent_to?.length ? `Devis envoyé à ${json.sent_to.join(", ")}` : "Devis envoyé",
      );
      await load();
      onChanged();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("formation-incoming-changed"));
      }
    } finally {
      setDevisBusy(false);
    }
  };

  const assignTrainer = async () => {
    if (!trainerId) {
      toast.error("Sélectionnez un formateur");
      return;
    }
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "formateur", trainer_user_id: trainerId }),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Affectation impossible");
      return;
    }
    toast.success("Formateur enregistré");
    await load();
    onChanged();
  };

  const passToSession = async () => {
    if (!dossierId) return;
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_status: "session" }),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Passage en Session impossible");
      return;
    }
    toast.success("Dossier passé en Session");
    await load();
    onChanged();
  };

  const validateInvoice = async () => {
    const res = await fetch(`/api/super-admin/crm/formation-dossiers/${dossierId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "facture" }),
    });
    const json = await parseFetchJson<{
      error?: string;
      invoice?: { number: string; amount_ttc_cents: number };
    }>(res);
    if (!res.ok) {
      toast.error(json.error || "Facture refusée");
      return;
    }
    toast.success(
      json.invoice?.number
        ? `Facture ${json.invoice.number} émise`
        : "Facture émise",
    );
    await load();
    onChanged();
  };

  const openEmargement = async () => {
    try {
      const slotRes = await fetch("/api/super-admin/crm/formation-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier_id: dossierId }),
      });
      const slotJson = await parseFetchJson<{ slot?: { id: string }; error?: string }>(slotRes);
      if (!slotRes.ok || !slotJson.slot?.id) {
        throw new Error(slotJson.error || "Créneau impossible");
      }
      window.open(
        `/super/crm/programmation/emarger/${slotJson.slot.id}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Émargement impossible");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <button type="button" className="flex-1 cursor-default" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-[#262A4A] bg-[#0A0C1B] text-[#F3F4FA] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#262A4A] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#A3A8C7]">{orgName}</p>
            <h2 className="truncate text-xl font-semibold">
              {dossier?.course_title?.trim() || "Formation à confirmer"}
            </h2>
            <p className="mt-1 text-sm text-[#A3A8C7]">
              {dossier ? FORMATION_DOSSIER_STATUS_LABELS[dossier.status] : "…"}
              {dossier?.amount_ht_cents != null
                ? ` · ${(dossier.amount_ht_cents / 100).toLocaleString("fr-FR")} € HT`
                : ""}
              {dossier?.funding_type ? ` · ${dossier.funding_type}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#A3A8C7] hover:bg-[#141731] hover:text-white"
            aria-label="Fermer le panneau"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {loading || !dossier ? (
          <p className="p-5 text-sm text-[#A3A8C7]">Chargement…</p>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Frise */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {FORMATION_DOSSIER_STATUSES.map((status, index) => {
                const active = index === statusIdx;
                const done = index < statusIdx;
                const locked = Boolean(LOCK_HINTS[status]) && index > statusIdx;
                return (
                  <div
                    key={status}
                    title={locked ? LOCK_HINTS[status] : undefined}
                    className={`min-w-[88px] rounded-xl border px-2 py-2 text-center text-[11px] ${
                      active
                        ? "border-[#6C5CF5] bg-[#6C5CF5]/20 text-[#B7AEFF]"
                        : done
                          ? "border-[#262A4A] bg-[#141731] text-[#F3F4FA]"
                          : "border-[#262A4A] text-[#A3A8C7]"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {locked ? <Lock className="h-3 w-3" /> : null}
                      <span className="font-semibold">{FORMATION_DOSSIER_STATUS_LABELS[status]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {meta ? (
              <div className="rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-2 text-[11px] text-[#A3A8C7]">
                Convention {meta.locks.convention_signed ? "signée" : "en attente"}
                {" · "}
                Formateur {meta.locks.trainer_assigned ? "ok" : "à choisir"}
                {" · "}
                CV{" "}
                {meta.locks.trainer_cv_ready
                  ? "ok"
                  : meta.locks.trainer_assigned
                    ? "manquant"
                    : "—"}
                {" · "}
                Émargements {meta.locks.slots_closed}/{meta.locks.slots_total}
                {" · "}
                Facture{" "}
                {meta.locks.invoice_validated
                  ? meta.invoice?.number || "émise"
                  : "à valider"}
              </div>
            ) : null}

            {/* Devis : voir / modifier puis envoyer */}
            {dossier.status === "devis" || dossier.status === "qualification" ? (
              <div className="space-y-3 rounded-xl border border-[#6C5CF5]/40 bg-[#141731] p-3">
                <div>
                  <p className="text-sm font-semibold text-[#F3F4FA]">Devis</p>
                  <p className="mt-0.5 text-[11px] text-[#A3A8C7]">
                    Ajustez le contenu, prévisualisez le PDF, puis envoyez.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">Formation</Label>
                    <Input
                      value={devisDraft.course_title}
                      onChange={(e) =>
                        setDevisDraft((d) => ({ ...d, course_title: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">Contact devis</Label>
                    <Input
                      value={devisDraft.contact_name}
                      onChange={(e) =>
                        setDevisDraft((d) => ({ ...d, contact_name: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">E-mail devis</Label>
                    <Input
                      type="email"
                      value={devisDraft.contact_email}
                      onChange={(e) =>
                        setDevisDraft((d) => ({ ...d, contact_email: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">Montant HT (€)</Label>
                    <Input
                      inputMode="decimal"
                      value={devisDraft.amount_ht_euros}
                      onChange={(e) =>
                        setDevisDraft((d) => ({ ...d, amount_ht_euros: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                      placeholder="1890"
                    />
                    {meta?.catalog?.suggested_ht_cents != null &&
                    meta.catalog.suggested_ht_cents > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <p className="text-[11px] text-[#A3A8C7]">
                          Catalogue :{" "}
                          <span className="font-semibold text-[#B7AEFF]">
                            {(meta.catalog.suggested_ht_cents / 100).toLocaleString("fr-FR")} € HT
                          </span>
                        </p>
                        <button
                          type="button"
                          className="rounded-full border border-[#6C5CF5]/50 px-2.5 py-0.5 text-[11px] font-semibold text-[#B7AEFF]"
                          onClick={() =>
                            setDevisDraft((d) => ({
                              ...d,
                              amount_ht_euros: String(meta.catalog!.suggested_ht_cents! / 100),
                            }))
                          }
                        >
                          Appliquer le prix catalogue
                        </button>
                      </div>
                    ) : (
                      <p className="pt-1 text-[11px] text-[#A3A8C7]">
                        Aucun prix catalogue lié — renseignez le montant ou associez une formation CMS.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">Financement</Label>
                    <select
                      value={devisDraft.funding_type}
                      onChange={(e) =>
                        setDevisDraft((d) => ({
                          ...d,
                          funding_type: e.target.value as "direct" | "opco" | "subrogation",
                        }))
                      }
                      className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
                    >
                      <option value="direct">Fonds propres</option>
                      <option value="opco">OPCO</option>
                      <option value="subrogation">Subrogation</option>
                    </select>
                  </div>
                  {devisDraft.funding_type === "opco" ||
                  devisDraft.funding_type === "subrogation" ? (
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[11px] text-[#A3A8C7]">Nom de l’OPCO</Label>
                      <Input
                        value={devisDraft.opco_name}
                        onChange={(e) =>
                          setDevisDraft((d) => ({ ...d, opco_name: e.target.value }))
                        }
                        placeholder="ex. Akto, Atlas, Opco EP…"
                        className="border-[#262A4A] bg-[#0A0C1B]"
                      />
                      <p className="text-[11px] text-[#A3A8C7]">
                        Détecté via SIRET à la demande — modifiable avant génération du devis.
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">TTC estimé (TVA 20 %)</Label>
                    <p className="rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#B7AEFF]">
                      {(() => {
                        const ht = Number(String(devisDraft.amount_ht_euros).replace(",", "."));
                        if (!Number.isFinite(ht) || ht < 0) return "—";
                        return `${(ht * 1.2).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}`;
                      })()}
                    </p>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-[#A3A8C7]">Notes internes</Label>
                    <textarea
                      value={devisDraft.notes}
                      onChange={(e) => setDevisDraft((d) => ({ ...d, notes: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#F3F4FA]"
                    />
                  </div>
                </div>
                {meta?.organization && !meta.organization.siret_ok ? (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    SIRET client manquant — l&apos;envoi du devis est bloqué. Complétez le SIRET
                    sur le compte entreprise
                    {meta.organization.id ? (
                      <>
                        {" "}
                        (
                        <a
                          href={`/super/organisations/${meta.organization.id}`}
                          className="underline underline-offset-2"
                        >
                          ouvrir le compte
                        </a>
                        )
                      </>
                    ) : null}
                    .
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
                    disabled={devisBusy}
                    onClick={() => void previewDevis()}
                  >
                    {devisBusy ? "Préparation…" : "Voir le devis (PDF)"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#262A4A] bg-transparent text-[#A3A8C7]"
                    disabled={devisBusy}
                    onClick={() =>
                      void saveDevisDraft().then(async (ok) => {
                        if (!ok) return;
                        toast.success("Devis enregistré");
                        await load();
                        onChanged();
                      })
                    }
                  >
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
                    disabled={devisBusy || Boolean(meta?.organization && !meta.organization.siret_ok)}
                    onClick={() => void sendDevis()}
                  >
                    {devisBusy ? "Envoi…" : "Valider et envoyer le devis"}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Validations humaines Lot 5 */}
            <div className="flex flex-wrap gap-2">
              {dossier.status === "convention" || dossier.status === "devis" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
                  onClick={() =>
                    void sendDoc({
                      id: "",
                      kind: "convention",
                      title: "Convention",
                      status: "to_generate",
                      file_url: null,
                      sent_at: null,
                      opened_at: null,
                      signed_at: null,
                    })
                  }
                >
                  Envoyer la convention
                </Button>
              ) : null}
              {["mise_en_place", "session"].includes(dossier.status) ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
                  disabled={meta ? !meta.locks.convention_signed : false}
                  title={
                    meta && !meta.locks.convention_signed
                      ? "Convention non signée"
                      : undefined
                  }
                  onClick={() =>
                    void sendDoc({
                      id: "",
                      kind: "convocation",
                      title: "Convocation",
                      status: "to_generate",
                      file_url: null,
                      sent_at: null,
                      opened_at: null,
                      signed_at: null,
                    })
                  }
                >
                  Envoyer les convocations
                </Button>
              ) : null}
              {["mise_en_place", "session", "fin"].includes(dossier.status) ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
                  onClick={() => void openEmargement()}
                >
                  Lancer l&apos;émargement
                </Button>
              ) : null}
            </div>

            {dossier.status === "convention" || dossier.status === "mise_en_place" ? (
              <div className="space-y-2 rounded-xl border border-[#262A4A] bg-[#141731] p-3">
                <p className="text-sm font-semibold">Choisir le formateur</p>
                <p className="text-xs text-[#A3A8C7]">
                  CV obligatoire (espace expert). Sans CV, l&apos;affectation et le passage en
                  Session sont bloqués.
                </p>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full rounded-xl border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner…</option>
                  {(meta?.trainers ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="w-full bg-[#6C5CF5] text-white"
                  onClick={() => void assignTrainer()}
                >
                  {meta?.locks.trainer_assigned ? "Mettre à jour le formateur" : "Valider le formateur"}
                </Button>
              </div>
            ) : null}

            {dossier.status === "mise_en_place" ? (
              <div className="space-y-2 rounded-xl border border-[#262A4A] bg-[#141731] p-3">
                <p className="text-sm font-semibold">Passer en Session</p>
                <p className="text-xs text-[#A3A8C7]">
                  Requis : convention signée + formateur choisi. Ou glissez la carte vers Session sur
                  le board.
                </p>
                <Button
                  type="button"
                  className="w-full bg-[#6C5CF5] text-white"
                  disabled={
                    meta
                      ? !(meta.locks.convention_signed && meta.locks.trainer_assigned)
                      : true
                  }
                  title={
                    meta && !(meta.locks.convention_signed && meta.locks.trainer_assigned)
                      ? "Convention signée et formateur requis"
                      : undefined
                  }
                  onClick={() => void passToSession()}
                >
                  Passer en Session
                </Button>
              </div>
            ) : null}

            {dossier.status === "fin" || dossier.status === "session" ? (
              <div className="space-y-2 rounded-xl border border-[#262A4A] bg-[#141731] p-3">
                <p className="text-sm font-semibold">Valider la facture</p>
                <p className="text-xs text-[#A3A8C7]">
                  {dossier.amount_ht_cents != null
                    ? `${(dossier.amount_ht_cents / 100).toLocaleString("fr-FR")} € HT`
                    : "Montant HT manquant"}
                  {meta?.locks.attendance_complete
                    ? " · émargements OK"
                    : ` · émargements ${meta?.locks.slots_closed ?? 0}/${meta?.locks.slots_total ?? 0}`}
                </p>
                <Button
                  type="button"
                  className="w-full bg-[#6C5CF5] text-white"
                  disabled={Boolean(meta?.locks.invoice_validated)}
                  onClick={() => void validateInvoice()}
                >
                  {meta?.locks.invoice_validated
                    ? `Facture ${meta.invoice?.number || "émise"}`
                    : "Émettre la facture"}
                </Button>
              </div>
            ) : null}

            <div className="flex gap-1 rounded-xl border border-[#262A4A] bg-[#141731] p-1">
              {(
                [
                  ["docs", "Documents"],
                  ["coffre", "Coffre"],
                  ["participants", "Participants"],
                  ["bpf", "Données BPF"],
                  ["historique", "Historique"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                    tab === id ? "bg-[#6C5CF5] text-white" : "text-[#A3A8C7] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "coffre" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[#A3A8C7]">
                    {coffre
                      ? `${coffre.ready_count}/${coffre.total_count} preuves prêtes`
                      : "Chargement du coffre Qualiopi…"}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#6C5CF5] text-white"
                    disabled={coffreBusy}
                    onClick={() => void exportCoffreZip()}
                  >
                    {coffreBusy ? "Export…" : "Exporter ZIP"}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(coffre?.items ?? []).map((item) => {
                    const tone =
                      item.status === "ready"
                        ? "bg-[#16A34A] text-white"
                        : item.status === "partial"
                          ? "bg-[#CA8A04] text-white"
                          : item.status === "not_due"
                            ? "bg-[#0A0C1B] text-[#A3A8C7]"
                            : "bg-[#7F1D1D] text-white";
                    const label =
                      item.status === "ready"
                        ? "Prêt"
                        : item.status === "partial"
                          ? "Partiel"
                          : item.status === "not_due"
                            ? "Pas dû"
                            : "Manquant";
                    return (
                      <li
                        key={item.key}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.detail ? (
                            <p className="truncate text-[11px] text-[#A3A8C7]">{item.detail}</p>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone}`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {tab === "docs" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Byound Ready</p>
                      {readyLink ? (
                        <p className="mt-1 text-[11px] text-[#A3A8C7]">
                          {readyLink.status === "submitted"
                            ? "Demande déposée"
                            : readyLink.opened_at
                              ? `Ouvert · ${readyLink.progress_ready}/${readyLink.progress_total} champs`
                              : readyLink.status === "revoked"
                                ? "Révoqué"
                                : readyLink.status === "expired"
                                  ? "Expiré"
                                  : "Envoyé à la signature du devis"}
                          {readyLink.expires_at
                            ? ` · expire ${new Date(readyLink.expires_at).toLocaleDateString("fr-FR")}`
                            : ""}
                          {readyLink.recipient_email
                            ? ` · ${readyLink.recipient_email}`
                            : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#A3A8C7]">
                          Le lien naît à l’acceptation du devis (mail « Merci » + Ready).
                        </p>
                      )}
                    </div>
                    {readyLink &&
                    ["active", "blocked", "submitted"].includes(readyLink.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={readyBusy}
                        className="border-[#5A2030] bg-transparent text-[#FF8FA3]"
                        onClick={async () => {
                          if (!confirm("Révoquer le lien Byound Ready ?")) return;
                          setReadyBusy(true);
                          try {
                            const res = await fetch(
                              `/api/super-admin/crm/formation-dossiers/${dossierId}/ready`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "revoke",
                                  link_id: readyLink.id,
                                }),
                              },
                            );
                            const json = await parseFetchJson<{ error?: string }>(res);
                            if (!res.ok) {
                              toast.error(json.error || "Révocation impossible");
                              return;
                            }
                            toast.success("Lien Byound Ready révoqué");
                            await loadReady();
                          } finally {
                            setReadyBusy(false);
                          }
                        }}
                      >
                        Révoquer
                      </Button>
                    ) : null}
                  </div>
                </div>
                <ul className="space-y-2">
                  {(dossier.formation_documents ?? []).map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-[11px] text-[#A3A8C7]">
                          {doc.signed_at
                            ? `Signé ${new Date(doc.signed_at).toLocaleString("fr-FR")}`
                            : doc.opened_at
                              ? `Ouvert ${new Date(doc.opened_at).toLocaleString("fr-FR")}`
                              : doc.sent_at
                                ? `Envoyé ${new Date(doc.sent_at).toLocaleString("fr-FR")}`
                                : doc.generated_at
                                  ? `Généré ${new Date(doc.generated_at).toLocaleString("fr-FR")}`
                                  : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={docStatusBadgeClass(doc)}>
                          {docStatusLabel(doc)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#262A4A] bg-transparent text-[#A3A8C7]"
                          onClick={() => previewDoc(doc)}
                        >
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#262A4A] bg-transparent text-[#A3A8C7]"
                          onClick={() => void sendDoc(doc)}
                        >
                          {doc.sent_at ? "Renvoyer" : "Envoyer"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tab === "participants" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["positionnement", "Envoyer positionnement"],
                      ["eval_chaud", "Envoyer éval. à chaud"],
                      ["eval_froid", "Envoyer éval. à froid"],
                      ["questionnaire_entreprise", "Questionnaire entreprise"],
                    ] as const
                  ).map(([kind, label]) => (
                    <Button
                      key={kind}
                      size="sm"
                      variant="outline"
                      className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
                      onClick={async () => {
                        const res = await fetch(
                          `/api/super-admin/crm/formation-dossiers/${dossierId}/assessments`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ kind }),
                          },
                        );
                        const json = await parseFetchJson<{
                          error?: string;
                          sent?: number;
                        }>(res);
                        if (!res.ok) {
                          toast.error(json.error || "Envoi impossible");
                          return;
                        }
                        toast.success(`${json.sent ?? 0} invitation(s) envoyée(s)`);
                        await load();
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <ul className="space-y-2">
                  {participants.length === 0 ? (
                    <p className="text-sm text-[#A3A8C7]">Aucun participant.</p>
                  ) : (
                    participants.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-2 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-[#A3A8C7]">
                              {p.email}
                              {p.job_title ? ` · ${p.job_title}` : ""}
                              {p.bpf_learner_status ? ` · ${p.bpf_learner_status}` : ""}
                            </p>
                            <p className="mt-1 text-[11px] text-[#A3A8C7]">
                              Émarg. {p.attendance?.attended ?? 0}/{p.attendance?.planned ?? 0}
                              {" · "}
                              Pos.{" "}
                              {p.assessments?.positionnement?.status === "completed"
                                ? `${p.assessments.positionnement.score_pct ?? "—"}%`
                                : p.assessments?.positionnement
                                  ? "en cours"
                                  : "—"}
                              {" · "}
                              Chaud{" "}
                              {p.assessments?.eval_chaud?.status === "completed"
                                ? `${p.assessments.eval_chaud.score_pct ?? "—"}%`
                                : p.assessments?.eval_chaud
                                  ? "en cours"
                                  : "—"}
                              {" · "}
                              Froid{" "}
                              {p.assessments?.eval_froid?.status === "completed"
                                ? `${p.assessments.eval_froid.score_pct ?? "—"}%`
                                : p.assessments?.eval_froid
                                  ? "en cours"
                                  : "—"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#262A4A] bg-transparent text-[#A3A8C7]"
                            onClick={async () => {
                              const res = await fetch(
                                `/api/super-admin/crm/formation-dossiers/${dossierId}/participants?participant_id=${p.id}`,
                                { method: "DELETE" },
                              );
                              if (!res.ok) {
                                toast.error("Suppression impossible");
                                return;
                              }
                              await load();
                              onChanged();
                            }}
                          >
                            Retirer
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <form
                  className="space-y-2 rounded-xl border border-[#262A4A] bg-[#141731] p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (async () => {
                      const res = await fetch(
                        `/api/super-admin/crm/formation-dossiers/${dossierId}/participants`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(participantForm),
                        },
                      );
                      const json = await parseFetchJson<{ error?: string }>(res);
                      if (!res.ok) {
                        toast.error(json.error ?? "Ajout impossible");
                        return;
                      }
                      setParticipantForm({
                        first_name: "",
                        last_name: "",
                        email: "",
                        job_title: "",
                        bpf_learner_status: "salarie_prive",
                      });
                      await load();
                      onChanged();
                    })();
                  }}
                >
                  <p className="text-xs font-semibold uppercase text-[#A3A8C7]">Ajouter</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Prénom"
                      value={participantForm.first_name}
                      onChange={(e) =>
                        setParticipantForm((c) => ({ ...c, first_name: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                    <Input
                      placeholder="Nom"
                      value={participantForm.last_name}
                      onChange={(e) =>
                        setParticipantForm((c) => ({ ...c, last_name: e.target.value }))
                      }
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                  </div>
                  <Input
                    placeholder="Email de référence"
                    type="email"
                    required
                    value={participantForm.email}
                    onChange={(e) =>
                      setParticipantForm((c) => ({ ...c, email: e.target.value }))
                    }
                    className="border-[#262A4A] bg-[#0A0C1B]"
                  />
                  <Input
                    placeholder="Poste"
                    value={participantForm.job_title}
                    onChange={(e) =>
                      setParticipantForm((c) => ({ ...c, job_title: e.target.value }))
                    }
                    className="border-[#262A4A] bg-[#0A0C1B]"
                  />
                  <select
                    value={participantForm.bpf_learner_status}
                    onChange={(e) =>
                      setParticipantForm((c) => ({
                        ...c,
                        bpf_learner_status: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
                  >
                    {BPF_LEARNER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" className="w-full bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]">
                    Ajouter le participant
                  </Button>
                </form>
              </div>
            ) : null}

            {tab === "bpf" ? (
              <div className="space-y-3 rounded-xl border border-[#262A4A] bg-[#141731] p-4">
                <div className="space-y-1.5">
                  <Label className="text-[#A3A8C7]">Financeur BPF</Label>
                  <select
                    value={dossier.bpf_funder_type ?? ""}
                    disabled={dossier.subcontracting === "recue"}
                    onChange={(e) =>
                      void saveBpf({ bpf_funder_type: e.target.value || null })
                    }
                    className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {BPF_FUNDER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#A3A8C7]">Sous-traitance</Label>
                  <select
                    value={dossier.subcontracting}
                    onChange={(e) =>
                      void saveBpf({
                        subcontracting: e.target.value,
                        bpf_funder_type:
                          e.target.value === "recue" ? "autres_of" : dossier.bpf_funder_type,
                      })
                    }
                    className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm"
                  >
                    <option value="aucune">Aucune</option>
                    <option value="recue">Reçue d&apos;un OF</option>
                    <option value="confiee">Confiée à un OF</option>
                  </select>
                </div>
                {dossier.subcontracting !== "aucune" ? (
                  <div className="space-y-1.5">
                    <Label className="text-[#A3A8C7]">OF partenaire</Label>
                    <Input
                      defaultValue={dossier.partner_of_name ?? ""}
                      onBlur={(e) => void saveBpf({ partner_of_name: e.target.value || null })}
                      className="border-[#262A4A] bg-[#0A0C1B]"
                    />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-sm text-[#A3A8C7]">
                  <input
                    type="checkbox"
                    checked={dossier.identity_check_first_attendance}
                    onChange={(e) =>
                      void saveBpf({ identity_check_first_attendance: e.target.checked })
                    }
                  />
                  Vérification d&apos;identité au 1er émargement
                </label>
                {Array.isArray(dossier.pending_confirm_fields) &&
                dossier.pending_confirm_fields.length > 0 ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                    Champs à confirmer : {dossier.pending_confirm_fields.join(", ")}
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 bg-[#6C5CF5] text-white"
                      onClick={() => void saveBpf({ confirm_fields: true })}
                    >
                      Marquer confirmés
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "historique" ? (
              <ul className="space-y-2">
                {(dossier.formation_events ?? [])
                  .slice()
                  .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                  .map((event) => (
                    <li
                      key={event.id}
                      className="rounded-xl border border-[#262A4A] bg-[#141731] px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{event.event_type}</p>
                      <p className="text-xs text-[#A3A8C7]">
                        {new Date(event.created_at).toLocaleString("fr-FR")}
                        {event.from_status || event.to_status
                          ? ` · ${event.from_status ?? "—"} → ${event.to_status ?? "—"}`
                          : ""}
                        {event.motif ? ` · ${event.motif}` : ""}
                      </p>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}
