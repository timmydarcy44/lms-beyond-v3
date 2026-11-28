"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CFA_SPECIALIZATIONS, getCfaSpecializationFullLabel } from "@/lib/cfa-applications";
import {
  CFA_HUMAN_CHANNELS,
  CFA_PRESCRIBER_TYPES,
  CFA_CHANNEL_META,
} from "@/lib/cfa/person-origin";

const FIELD =
  "mt-1 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm text-[#EEF1F8] outline-none focus:border-[#6E5BFF]";

type Duplicate = {
  id: string;
  stage: "prospect" | "candidate";
  stageLabel: string;
  name: string;
  channelLabel: string;
  createdAt: string | null;
};

type JpoEvent = { id: string; name: string; held_on: string | null };

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  sourceChannel: (typeof CFA_HUMAN_CHANNELS)[number] | "";
  sourceDetail: string;
  prescriberType: string;
  prescriberOrg: string;
  prescriberContact: string;
  placement: "prospect" | "candidate";
  notifyCandidate: boolean;
  contactConsent: boolean;
};

const EMPTY: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialization: "",
  sourceChannel: "",
  sourceDetail: "",
  prescriberType: "",
  prescriberOrg: "",
  prescriberContact: "",
  placement: "candidate",
  notifyCandidate: true,
  contactConsent: false,
};

export function CfaCreateProspectModal({
  open,
  onClose,
  onCreated,
  defaultPlacement = "candidate",
  actorLabel = "l’équipe",
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string, placement: "prospect" | "candidate") => void;
  defaultPlacement?: "prospect" | "candidate";
  actorLabel?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, placement: defaultPlacement });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const [jpoEvents, setJpoEvents] = useState<JpoEvent[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...EMPTY, placement: defaultPlacement });
    setError("");
    setDuplicate(null);
    void fetch("/api/super-admin/crm/cfa/prospects", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.jpoEvents)) setJpoEvents(json.jpoEvents);
        if (json.actor?.label) {
          /* actorLabel prop wins */
        }
      })
      .catch(() => undefined);
  }, [open, defaultPlacement]);

  useEffect(() => {
    const email = draft.email.trim().toLowerCase();
    if (!email.includes("@") || email.length < 6) {
      setDuplicate(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/super-admin/crm/cfa/lookup?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.exists) {
            setDuplicate({
              id: json.id,
              stage: json.stage,
              stageLabel: json.stageLabel,
              name: json.name,
              channelLabel: json.channelLabel,
              createdAt: json.createdAt,
            });
          } else setDuplicate(null);
        })
        .catch(() => setDuplicate(null));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [draft.email]);

  const groups = useMemo(
    () => [...new Set(CFA_SPECIALIZATIONS.map((item) => item.group))],
    [],
  );

  if (!open) return null;

  function openExisting() {
    if (!duplicate) return;
    onClose();
    if (duplicate.stage === "prospect") router.push(`/super/crm/cfa/prospects?id=${duplicate.id}`);
    else router.push(`/super/crm/cfa/apprenants/${duplicate.id}`);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (duplicate) {
      openExisting();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_manual",
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
          phone: draft.phone || undefined,
          specialization: draft.specialization,
          placement: draft.placement,
          sourceChannel: draft.sourceChannel,
          sourceDetail: draft.sourceDetail || undefined,
          prescriberType: draft.prescriberType || undefined,
          prescriberOrg: draft.prescriberOrg || undefined,
          prescriberContact: draft.prescriberContact || undefined,
          contactConsent: true,
          notifyCandidate: draft.placement === "candidate" && draft.notifyCandidate,
        }),
      });
      const result = await response.json();
      if (response.status === 409 && result.application?.id) {
        setDuplicate({
          id: result.application.id,
          stage: result.stage,
          stageLabel: result.stage === "prospect" ? "Futurs candidats" : "Admissions",
          name: `${result.application.first_name} ${result.application.last_name}`,
          channelLabel: "",
          createdAt: result.application.created_at ?? null,
        });
        return;
      }
      if (!response.ok) throw new Error(result.error || "Création impossible");
      const id = String(result.application?.id ?? "");
      onClose();
      if (onCreated && id) onCreated(id, draft.placement);
      else if (id && draft.placement === "prospect") router.push(`/super/crm/cfa/prospects?id=${id}`);
      else if (id) router.push(`/super/crm/cfa/apprenants/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  const submitLabel =
    draft.placement === "prospect" ? "Ajouter aux futurs candidats →" : "Ajouter aux admissions →";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <form
        onSubmit={(event) => void submit(event)}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#1A2340] bg-[#111831] p-6 text-[#EEF1F8] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Ajouter un candidat</h2>
            <p className="mt-1 text-sm text-[#AEB6CC]">
              Saisie manuelle · les pré-inscriptions et plaquettes du site arrivent toutes seules
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-lg text-[#AEB6CC]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Prénom *
            <input required value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} className={FIELD} />
          </label>
          <label className="text-sm font-semibold">
            Nom *
            <input required value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} className={FIELD} />
          </label>
          <label className="text-sm font-semibold">
            E-mail *
            <input required type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={FIELD} />
          </label>
          <label className="text-sm font-semibold">
            Téléphone
            <input type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={FIELD} />
          </label>
        </div>

        {duplicate ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2CF6B55] bg-[#F2CF6B14] px-4 py-3 text-sm text-[#F2CF6B]">
            <span>
              {duplicate.name} existe déjà dans {duplicate.stageLabel}
              {duplicate.channelLabel ? ` (${duplicate.channelLabel}` : ""}
              {duplicate.createdAt
                ? `${duplicate.channelLabel ? ", " : " ("}${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(duplicate.createdAt))})`
                : duplicate.channelLabel
                  ? ")"
                  : ""}
            </span>
            <button type="button" onClick={openExisting} className="font-extrabold text-[#F2CF6B]">
              Compléter sa fiche →
            </button>
          </div>
        ) : null}

        <label className="mt-5 block text-sm font-semibold">
          Formation visée *
          <select
            required
            value={draft.specialization}
            onChange={(e) => setDraft({ ...draft, specialization: e.target.value })}
            className={FIELD}
          >
            <option value="">Choisir</option>
            {groups.map((group) => (
              <optgroup key={group} label={group}>
                {CFA_SPECIALIZATIONS.filter((item) => item.group === group).map((item) => (
                  <option key={item.value} value={item.value}>
                    {getCfaSpecializationFullLabel(item.value)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <p className="mb-2 mt-6 text-sm font-semibold">Comment l&apos;as-tu rencontré ? *</p>
        <div className="flex flex-wrap gap-2">
          {CFA_HUMAN_CHANNELS.map((channel) => {
            const meta = CFA_CHANNEL_META[channel];
            const active = draft.sourceChannel === channel;
            return (
              <button
                key={channel}
                type="button"
                onClick={() => setDraft({ ...draft, sourceChannel: channel, sourceDetail: "", prescriberType: "" })}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                style={{
                  borderColor: active ? meta.color : "#26304F",
                  background: active ? `${meta.color}22` : "#0B1122",
                  color: active ? meta.color : "#C9D2E8",
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {draft.sourceChannel === "prescriber" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Prescripteur *
              <select
                required
                value={draft.prescriberType}
                onChange={(e) => setDraft({ ...draft, prescriberType: e.target.value })}
                className={FIELD}
              >
                <option value="">Choisir</option>
                {CFA_PRESCRIBER_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Structure
              <input value={draft.prescriberOrg} onChange={(e) => setDraft({ ...draft, prescriberOrg: e.target.value })} className={FIELD} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Conseiller ou conseillère
              <input value={draft.prescriberContact} onChange={(e) => setDraft({ ...draft, prescriberContact: e.target.value })} className={FIELD} />
            </label>
          </div>
        ) : null}

        {draft.sourceChannel === "jpo" ? (
          <label className="mt-4 block text-sm font-semibold">
            Quelle JPO *
            <select
              required
              value={draft.sourceDetail}
              onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })}
              className={FIELD}
            >
              <option value="">Choisir</option>
              {jpoEvents.map((event) => (
                <option key={event.id} value={event.name}>
                  {event.name}
                  {event.held_on
                    ? ` · ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(event.held_on))}`
                    : ""}
                </option>
              ))}
              <option value="Autre">Autre / date libre</option>
            </select>
          </label>
        ) : null}

        {draft.sourceChannel === "direct_meeting" ? (
          <label className="mt-4 block text-sm font-semibold">
            Où *
            <input
              required
              value={draft.sourceDetail}
              onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })}
              className={FIELD}
              placeholder="Lieu de la rencontre"
            />
          </label>
        ) : null}

        {draft.sourceChannel === "phone" ? (
          <label className="mt-4 block text-sm font-semibold">
            Appel *
            <select
              required
              value={draft.sourceDetail}
              onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })}
              className={FIELD}
            >
              <option value="">Choisir</option>
              <option value="entrant">Entrant</option>
              <option value="sortant">Sortant</option>
            </select>
          </label>
        ) : null}

        <p className="mb-2 mt-6 text-sm font-semibold">Où le placer ?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["prospect", "Futur candidat", "Intéressé, à recontacter. Va dans Futurs candidats."],
              ["candidate", "Candidat", "Il veut candidater. Va dans Admissions, étape Profil."],
            ] as const
          ).map(([id, title, help]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDraft({ ...draft, placement: id })}
              className="rounded-[22px] border p-4 text-left"
              style={{
                borderColor: draft.placement === id ? "#6E5BFF" : "#1A2340",
                background: draft.placement === id ? "#6E5BFF14" : "#0B1122",
              }}
            >
              <span className="flex items-center gap-2 text-sm font-extrabold">
                <span
                  className="grid h-4 w-4 place-items-center rounded-full border"
                  style={{ borderColor: draft.placement === id ? "#6E5BFF" : "#26304F" }}
                >
                  {draft.placement === id ? <span className="h-2 w-2 rounded-full bg-[#6E5BFF]" /> : null}
                </span>
                {title}
              </span>
              <span className="mt-2 block text-xs text-[#9AA3BD]">{help}</span>
            </button>
          ))}
        </div>

        {draft.placement === "candidate" ? (
          <label className="mt-4 flex items-start gap-3 text-sm text-[#AEB6CC]">
            <input
              type="checkbox"
              checked={draft.notifyCandidate}
              onChange={(e) => setDraft({ ...draft, notifyCandidate: e.target.checked })}
              className="mt-0.5"
            />
            Lui envoyer le lien pour compléter son dossier de candidature
          </label>
        ) : null}

        <label className="mt-3 flex items-start gap-3 text-sm text-[#AEB6CC]">
          <input
            required
            type="checkbox"
            checked={draft.contactConsent}
            onChange={(e) => setDraft({ ...draft, contactConsent: e.target.checked })}
            className="mt-0.5"
          />
          Cette personne a accepté d&apos;être recontactée par Byound School *
        </label>

        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#6C7593]">Saisi par {actorLabel} · aujourd&apos;hui</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-11 rounded-full px-4 text-sm font-semibold text-[#AEB6CC]">
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !draft.specialization || !draft.sourceChannel || !draft.contactConsent || Boolean(duplicate)}
              className="h-11 rounded-full bg-white px-5 text-sm font-extrabold text-[#0A0F1E] disabled:opacity-50"
            >
              {busy ? "Enregistrement…" : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
