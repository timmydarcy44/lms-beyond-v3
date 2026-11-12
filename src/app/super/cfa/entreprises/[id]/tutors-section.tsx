"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { GraduationCap } from "lucide-react";
import { CFA_STATUS_LABELS, getCfaSpecializationLabel, type CfaApplicationStatus } from "@/lib/cfa-applications";
import { formatPersonName } from "@/lib/cfa/format-org-name";
import type { CompanyContact } from "./contacts-section";

export type CompanyTutor = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string | null;
  invited_at?: string | null;
  last_code_sent_at?: string | null;
  activated_at?: string | null;
};

export type CompanyApprentice = {
  placementId: string;
  tutorId?: string | null;
  placementStatus: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  applicationStatus: string;
  proposedAt?: string | null;
  startedAt?: string | null;
  interviewAt?: string | null;
};

function initials(person: { first_name?: string; firstName?: string; last_name?: string; lastName?: string }) {
  const first = person.first_name ?? person.firstName ?? "";
  const last = person.last_name ?? person.lastName ?? "";
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "•";
}

function statusLabel(status: string) {
  return CFA_STATUS_LABELS[status as CfaApplicationStatus] ?? status;
}

function shortDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  status: string;
  currentCompanyId: string | null;
  currentCompanyName: string;
  alreadyHere: boolean;
};

export function TutorsSection({
  companyId,
  tutors,
  apprentices,
  contacts,
  onChanged,
  onMessage,
}: {
  companyId: string;
  tutors: CompanyTutor[];
  apprentices: CompanyApprentice[];
  contacts?: CompanyContact[];
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });
  /** applicationId de l'alternant en cours de désignation de tuteur */
  const [designating, setDesignating] = useState<string | null>(null);
  const unassigned = apprentices.filter((item) => !item.tutorId);
  const pressenti = (contacts ?? []).find((c) => /tuteur|ma[iî]tre/i.test(String(c.job_title ?? "")));

  useEffect(() => {
    if (!attachOpen) return;
    const term = query.trim();
    if (term.length < 2) {
      setCandidates([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/super-admin/crm/cfa/placements?q=${encodeURIComponent(term)}&companyId=${encodeURIComponent(companyId)}`, { cache: "no-store" })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Recherche impossible");
          setCandidates(result.candidates ?? []);
        })
        .catch((error: unknown) => onMessage(error instanceof Error ? error.message : "Recherche impossible"));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [attachOpen, query, companyId, onMessage]);

  async function createTutor(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_company_tutor",
          firstName: formatPersonName(draft.firstName),
          lastName: formatPersonName(draft.lastName),
          email: draft.email,
          jobTitle: formatPersonName(draft.jobTitle),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      setDraft({ firstName: "", lastName: "", email: "", jobTitle: "" });
      setOpen(false);
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  async function attach(applicationId: string) {
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_company", applicationId, companyId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Rattachement impossible");
      setQuery("");
      setCandidates([]);
      setConfirmId(null);
      setAttachOpen(false);
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Rattachement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function assignTutor(applicationId: string, tutorId: string) {
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_tutor", applicationId, tutorId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Désignation impossible");
      setDesignating(null);
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Désignation impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="tuteurs" className="scroll-mt-28 rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <header id="champ-tuteur" className="mb-5 flex scroll-mt-28 flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F2CF6B26] text-[#F2CF6B]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold text-[#F2F4FA]">Tuteurs et alternants</h2>
            <p className="text-xs text-[#9AA3BD]">Maîtres d&apos;apprentissage et alternants en cours.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold"
            onClick={() => {
              setOpen((value) => !value);
              setAttachOpen(false);
            }}
          >
            ＋ Tuteur
          </button>
          <button
            type="button"
            className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold"
            onClick={() => {
              setAttachOpen((value) => !value);
              setOpen(false);
            }}
          >
            ＋ Alternant
          </button>
        </div>
      </header>

      {unassigned.map((apprentice) => {
        const name = formatPersonName(`${apprentice.firstName} ${apprentice.lastName}`);
        return (
          <div
            key={`alert-${apprentice.placementId}`}
            className="mb-3 flex flex-wrap items-center gap-3 rounded-[16px] border border-[#FF8A9B40] px-4 py-3"
            style={{ background: "#FF8A9B14" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8A9B] text-sm font-extrabold text-[#0A0F1E]">!</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[#F2F4FA]">{name} n&apos;a pas de maître d&apos;apprentissage</p>
              <p className="text-xs text-[#9AA3BD]">
                Obligatoire avant la signature.
                {pressenti ? ` ${formatPersonName(`${pressenti.first_name} ${pressenti.last_name}`)} est pressenti.` : ""}
              </p>
            </div>
            <button
              type="button"
              className="h-9 rounded-full bg-[#FF8A9B] px-4 text-xs font-extrabold text-[#0A0F1E]"
              onClick={() => {
                if (!tutors.length) setOpen(true);
                else setDesignating(apprentice.applicationId);
              }}
            >
              Désigner un tuteur
            </button>
          </div>
        );
      })}

      {designating ? (
        <ul className="mb-4 space-y-2">
          {tutors.map((tutor) => (
            <li key={tutor.id}>
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-2xl border border-[#26304F] px-3 py-2 text-left text-sm"
                onClick={() => void assignTutor(designating, tutor.id)}
              >
                Désigner {formatPersonName(`${tutor.first_name} ${tutor.last_name}`)}
              </button>
            </li>
          ))}
          {!tutors.length ? <li className="text-sm text-[#9AA3BD]">Créez d&apos;abord un tuteur.</li> : null}
        </ul>
      ) : null}

      {attachOpen ? (
        <div className="mb-4 space-y-2">
          <input aria-label="Rechercher un apprenant" value={query} onChange={(event) => { setQuery(event.target.value); setConfirmId(null); }} placeholder="Prénom ou nom de l'apprenant" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <ul className="space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="rounded-2xl border border-[#26304F] px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{formatPersonName(`${candidate.firstName} ${candidate.lastName}`)}</p>
                    <p className="text-xs text-[#AEB6CC]">{[getCfaSpecializationLabel(candidate.specialization), statusLabel(candidate.status)].filter(Boolean).join(" · ")}</p>
                    {candidate.currentCompanyName && !candidate.alreadyHere ? <p className="mt-1 text-xs text-[#F6D68B]">Déjà chez {candidate.currentCompanyName}. Le rattachement en cours sera clos.</p> : null}
                  </div>
                  {candidate.alreadyHere ? (
                    <span className="text-xs font-extrabold text-[#6BE3C0]">Déjà ici</span>
                  ) : confirmId === candidate.id ? (
                    <button type="button" disabled={busy} className="h-9 rounded-full bg-[#E7A92C] px-3 text-xs font-extrabold text-[#2A1F06]" onClick={() => void attach(candidate.id)}>
                      Confirmer
                    </button>
                  ) : (
                    <button type="button" disabled={busy} className="h-9 rounded-full bg-[#E7A92C] px-3 text-xs font-extrabold text-[#2A1F06]" onClick={() => (candidate.currentCompanyId ? setConfirmId(candidate.id) : void attach(candidate.id))}>
                      Rattacher
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {query.trim().length >= 2 && !candidates.length ? <p className="text-xs text-[#AEB6CC]">Aucun apprenant trouvé.</p> : null}
        </div>
      ) : null}

      {open ? (
        <form className="mb-4 space-y-2" onSubmit={(event) => void createTutor(event)}>
          <input required aria-label="Prénom" value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} onBlur={() => setDraft({ ...draft, firstName: formatPersonName(draft.firstName) })} placeholder="Prénom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="Nom" value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} onBlur={() => setDraft({ ...draft, lastName: formatPersonName(draft.lastName) })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="E-mail professionnel" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="E-mail professionnel" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Poste" value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} placeholder="Poste" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <p className="text-xs text-[#AEB6CC]">{draft.firstName || "Le tuteur"} recevra un e-mail pour indiquer son adresse et recevoir un code.</p>
          <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white">
            Créer et prévenir
          </button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {apprentices.map((apprentice) => {
          const name = formatPersonName(`${apprentice.firstName} ${apprentice.lastName}`);
          const tutor = tutors.find((item) => item.id === apprentice.tutorId);
          const cursus = getCfaSpecializationLabel(apprentice.specialization);
          const when =
            apprentice.placementStatus === "active"
              ? apprentice.startedAt
                ? `en contrat depuis le ${shortDate(apprentice.startedAt)}`
                : "en contrat"
              : apprentice.proposedAt
                ? `candidat(e) proposé(e) le ${shortDate(apprentice.proposedAt)}`
                : "candidat(e) proposé(e)";
          return (
            <li key={apprentice.placementId} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-[#0B1122] px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A2A0E] text-xs font-extrabold text-[#F2CF6B]">{initials(apprentice)}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/super/crm/cfa/apprenants/${apprentice.applicationId}`} className="font-extrabold text-[#F2F4FA] hover:underline">
                  {name}
                </Link>
                <p className="text-xs text-[#9AA3BD]">
                  {[cursus, when].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {apprentice.interviewAt ? (
                  <span className="rounded-full bg-[#241C4A] px-2.5 py-1 text-[11px] font-extrabold text-[#C9C2FF]">Entretien le {shortDate(apprentice.interviewAt)}</span>
                ) : null}
                {tutor ? (
                  <span className="rounded-full bg-[#0E2A28] px-2.5 py-1 text-[11px] font-extrabold text-[#5EDCC3]">
                    Tuteur : {formatPersonName(`${tutor.first_name} ${tutor.last_name}`)}
                  </span>
                ) : (
                  <span className="rounded-full bg-[#3A1420] px-2.5 py-1 text-[11px] font-extrabold text-[#FF8A9B]">Sans tuteur</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {tutors.length ? (
        <ul className="mt-3 space-y-2">
          {tutors.map((tutor) => {
            const own = apprentices.filter((item) => item.tutorId === tutor.id);
            return (
              <li key={tutor.id} className="rounded-[18px] border border-[#1A2340] bg-[#0B1122] px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8782C] text-xs font-extrabold text-[#2A1305]">{initials(tutor)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-[#F2F4FA]">{formatPersonName(`${tutor.first_name} ${tutor.last_name}`)}</p>
                    <p className="text-xs text-[#9AA3BD]">{formatPersonName(tutor.job_title) || "Maître d'apprentissage"}</p>
                  </div>
                  <span className="text-xs text-[#9AA3BD]">
                    {own.length} alternant{own.length > 1 ? "s" : ""} suivi{own.length > 1 ? "s" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
