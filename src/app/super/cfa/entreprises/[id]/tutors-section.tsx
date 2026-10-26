"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GraduationCap } from "lucide-react";
import { CFA_STATUS_LABELS, getCfaSpecializationLabel, type CfaApplicationStatus } from "@/lib/cfa-applications";

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
};

function initials(person: { first_name?: string; firstName?: string; last_name?: string; lastName?: string }) {
  const first = person.first_name ?? person.firstName ?? "";
  const last = person.last_name ?? person.lastName ?? "";
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "•";
}

function tutorPill(tutor: CompanyTutor) {
  if (tutor.activated_at) return { label: "Compte actif", className: "bg-[#143226] text-[#6BE3C0]" };
  if (tutor.invited_at || tutor.last_code_sent_at) return { label: "Code envoyé", className: "bg-[#241C4A] text-[#C9C1FF]" };
  return { label: "Pas encore invité", className: "bg-[#1A2340] text-[#AEB6CC]" };
}

function statusLabel(status: string) {
  return CFA_STATUS_LABELS[status as CfaApplicationStatus] ?? status;
}

export function TutorsSection({
  companyId,
  tutors,
  apprentices,
  onChanged,
  onMessage,
}: {
  companyId: string;
  tutors: CompanyTutor[];
  apprentices: CompanyApprentice[];
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });
  const unassigned = apprentices.filter((item) => !item.tutorId);

  async function createTutor(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_company_tutor", ...draft }),
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

  return (
    <section id="tuteurs" className="scroll-mt-28 rounded-[26px] border border-[#1A2340] bg-[#111831] p-5" style={{ borderTop: "4px solid #E7A92C" }}>
      <header id="champ-tuteur" className="-mx-5 -mt-5 mb-5 flex scroll-mt-28 flex-wrap items-start justify-between gap-3 border-b border-[#1A2340] px-5 py-4" style={{ background: "linear-gradient(90deg, #E7A92C2E, transparent 75%)" }}>
        <div className="flex gap-3">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#E7A92C] text-[#2A1F06]"><GraduationCap className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-extrabold text-[#F6D68B]">4 · Tuteurs et alternants</p>
            <h2 className="text-xl font-extrabold">Tuteurs et alternants</h2>
            <p className="text-xs text-[#AEB6CC]">Maîtres d'apprentissage et alternants en cours.</p>
          </div>
        </div>
        <button type="button" className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold" onClick={() => setOpen((value) => !value)}>+ Tuteur</button>
      </header>

      {open ? (
        <form className="mb-4 space-y-2" onSubmit={(event) => void createTutor(event)}>
          <input required aria-label="Prénom" value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} placeholder="Prénom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="Nom" value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="E-mail professionnel" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="E-mail professionnel" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Poste" value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} placeholder="Poste" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <p className="text-xs text-[#AEB6CC]">{draft.firstName || "Le tuteur"} recevra un e-mail pour indiquer son adresse et recevoir un code. Aucun alternant n'est rattaché.</p>
          <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white">Créer et prévenir</button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {tutors.map((tutor) => {
          const pill = tutorPill(tutor);
          const own = apprentices.filter((item) => item.tutorId === tutor.id);
          return (
            <li key={tutor.id} className="rounded-2xl bg-[#0B1122] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8782C] text-xs font-extrabold text-[#2A1305]">{initials(tutor)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold">{tutor.first_name} {tutor.last_name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${pill.className}`}>{pill.label}</span>
                  </div>
                  <p className="text-xs text-[#AEB6CC]">{tutor.job_title || "Maître d'apprentissage"}</p>
                </div>
              </div>
              {own.length ? (
                <ul className="mt-3 space-y-2 border-t border-[#1A2340] pt-3">
                  {own.map((apprentice) => (
                    <li key={apprentice.placementId}>
                      <Link href={`/super/crm/cfa/apprenants/${apprentice.applicationId}`} className="block rounded-xl px-2 py-1.5 text-sm hover:bg-[#111831]">
                        <span className="font-extrabold">{apprentice.firstName} {apprentice.lastName}</span>
                        <span className="mt-0.5 block text-xs text-[#AEB6CC]">{[getCfaSpecializationLabel(apprentice.specialization), statusLabel(apprentice.applicationStatus)].filter(Boolean).join(" · ")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-xs text-[#5D6785]">Aucun alternant pour le moment.</p>}
            </li>
          );
        })}
      </ul>

      {unassigned.length ? (
        <div className="mt-4">
          <p className="text-sm font-extrabold">Sans tuteur</p>
          <ul className="mt-2 space-y-2">
            {unassigned.map((apprentice) => (
              <li key={apprentice.placementId}>
                <Link href={`/super/crm/cfa/apprenants/${apprentice.applicationId}`} className="block rounded-xl bg-[#0B1122] px-3 py-2 text-sm">
                  <span className="font-extrabold">{apprentice.firstName} {apprentice.lastName}</span>
                  <span className="mt-0.5 block text-xs text-[#AEB6CC]">{[getCfaSpecializationLabel(apprentice.specialization), statusLabel(apprentice.applicationStatus)].filter(Boolean).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
