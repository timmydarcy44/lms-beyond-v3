"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { CFA_EDUCATION_LEVELS, CFA_LEAD_SOURCES } from "@/lib/cfa/lead-sources";

const FIELD =
  "mt-1 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm text-[#EEF1F8] outline-none focus:border-[#6E5BFF]";

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  educationLevel: string;
  specialization: string;
  leadSource: string;
  notifyCandidate: boolean;
};

const EMPTY: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  educationLevel: "",
  specialization: "",
  leadSource: "",
  notifyCandidate: false,
};

export function CfaCreateProspectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const groups = useMemo(
    () => [...new Set(CFA_SPECIALIZATIONS.map((item) => item.group))],
    [],
  );

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
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
          birthDate: draft.birthDate,
          educationLevel: draft.educationLevel,
          specialization: draft.specialization,
          leadSource: draft.leadSource,
          notifyCandidate: draft.notifyCandidate,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      const id = String(result.application?.id ?? "");
      setDraft(EMPTY);
      onClose();
      if (onCreated && id) onCreated(id);
      else if (id) router.push(`/super/crm/cfa/apprenants/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <form
        onSubmit={(event) => void submit(event)}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#1A2340] bg-[#111831] p-6 text-[#EEF1F8] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#B9AFFF]">Admission</p>
            <h2 className="mt-1 text-2xl font-extrabold">Ajouter un apprenant</h2>
            <p className="mt-2 text-sm text-[#AEB6CC]">
              Mêmes infos qu’un compte solo, sans challenge. Le dossier démarre à l’étape Envoyée.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#26304F] px-3 py-1.5 text-sm font-semibold text-[#AEB6CC]"
          >
            Fermer
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Prénom
            <input
              required
              value={draft.firstName}
              onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
              className={FIELD}
            />
          </label>
          <label className="text-sm font-semibold">
            Nom
            <input
              required
              value={draft.lastName}
              onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
              className={FIELD}
            />
          </label>
          <label className="text-sm font-semibold">
            E-mail
            <input
              required
              type="email"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              className={FIELD}
            />
          </label>
          <label className="text-sm font-semibold">
            Téléphone
            <input
              type="tel"
              value={draft.phone}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              className={FIELD}
            />
          </label>
          <label className="text-sm font-semibold">
            Date de naissance
            <input
              required
              type="date"
              value={draft.birthDate}
              onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })}
              className={FIELD}
              style={{ colorScheme: "dark" }}
            />
          </label>
          <label className="text-sm font-semibold">
            Niveau scolaire actuel
            <select
              required
              value={draft.educationLevel}
              onChange={(event) => setDraft({ ...draft, educationLevel: event.target.value })}
              className={FIELD}
            >
              <option value="">Sélectionner</option>
              {CFA_EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Provenance du prospect
            <select
              required
              value={draft.leadSource}
              onChange={(event) => setDraft({ ...draft, leadSource: event.target.value })}
              className={FIELD}
            >
              <option value="">Sélectionner</option>
              {CFA_LEAD_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold">Spécialisation visée</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5D6785]">
                {group}
              </p>
              <div className="grid gap-2">
                {CFA_SPECIALIZATIONS.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, specialization: item.value })}
                    className={`min-h-10 rounded-xl border px-3 text-left text-sm font-semibold ${
                      draft.specialization === item.value
                        ? "border-[#6E5BFF] bg-[#6E5BFF]/20 text-white"
                        : "border-[#26304F] text-[#AEB6CC]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <input required value={draft.specialization} readOnly className="sr-only" tabIndex={-1} />

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4 text-sm text-[#AEB6CC]">
          <input
            type="checkbox"
            checked={draft.notifyCandidate}
            onChange={(event) => setDraft({ ...draft, notifyCandidate: event.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>Envoyer un e-mail au candidat avec le lien de son dossier</span>
        </label>

        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-[#26304F] px-4 text-sm font-semibold"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy || !draft.specialization}
            className="h-11 rounded-full bg-[#6E5BFF] px-5 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer le dossier"}
          </button>
        </div>
      </form>
    </div>
  );
}
