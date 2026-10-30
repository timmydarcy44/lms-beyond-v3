"use client";

import { useState } from "react";
import { Users } from "lucide-react";

export type CompanyContact = {
  id: string;
  first_name: string;
  last_name: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  roles?: string[] | null;
};

const ROLES = [
  ["main", "Contact principal"],
  ["signatory", "Signataire"],
  ["hr", "RH"],
  ["other", "Autre"],
] as const;

type Draft = {
  contactId?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  roles: string[];
};

const EMPTY: Draft = { firstName: "", lastName: "", jobTitle: "", email: "", phone: "", roles: ["other"] };

function initials(contact: { first_name: string; last_name: string }) {
  return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase() || "•";
}

export function ContactsSection({
  companyId,
  contacts,
  onChanged,
  onMessage,
}: {
  companyId: string;
  contacts: CompanyContact[];
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [designating, setDesignating] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasSignatory = contacts.some((contact) => (contact.roles ?? []).includes("signatory"));

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      setDraft(null);
      setDesignating(false);
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  function openNew(signatory = false) {
    setDesignating(false);
    setDraft({ ...EMPTY, roles: signatory ? ["signatory"] : ["other"] });
  }

  return (
    <section id="contacts" className="scroll-mt-28 rounded-[26px] border border-[#1A2340] bg-[#111831] p-5" style={{ borderTop: "4px solid #2F7CF6" }}>
      <header className="-mx-5 -mt-5 mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#1A2340] px-5 py-4" style={{ background: "linear-gradient(90deg, #2F7CF62E, transparent 75%)" }}>
        <div className="flex gap-3">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#2F7CF6] text-white"><Users className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-extrabold text-[#9EC4FF]">2 · Contacts</p>
            <h2 className="text-xl font-extrabold">Contacts</h2>
            <p className="text-xs text-[#AEB6CC]">Principal, signataire du contrat, RH.</p>
          </div>
        </div>
        <button type="button" className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold" onClick={() => openNew()}>+ Contact</button>
      </header>

      <div id="champ-contact" className="scroll-mt-28" />
      {!hasSignatory ? (
        <div id="champ-signataire" className="mb-4 scroll-mt-28 rounded-2xl border border-dashed border-[#26304F] p-4">
          <p className="text-sm">Aucun signataire du contrat désigné. Il est obligatoire pour le CERFA.</p>
          <button type="button" className="mt-3 h-9 rounded-full bg-[#2F7CF6] px-4 text-xs font-extrabold text-white" onClick={() => (contacts.length ? setDesignating(true) : openNew(true))}>Désigner</button>
        </div>
      ) : null}

      {designating ? (
        <ul className="mb-4 space-y-2">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <button type="button" disabled={busy} className="w-full rounded-2xl border border-[#26304F] px-3 py-2 text-left text-sm" onClick={() => void send({ action: "designate_signatory", contactId: contact.id })}>
                Désigner {contact.first_name} {contact.last_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {hasSignatory ? <div id="champ-signataire" className="scroll-mt-28" /> : null}
      <ul className="space-y-3">
        {contacts.map((contact) => (
          <li key={contact.id} className="rounded-2xl bg-[#0B1122] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C3358] text-xs font-extrabold text-[#9EC4FF]">{initials(contact)}</span>
                <div>
                  <p className="font-extrabold">{contact.first_name} {contact.last_name}</p>
                  <p className="text-xs text-[#AEB6CC]">{contact.job_title || "Poste à préciser"}</p>
                </div>
              </div>
              <button type="button" className="text-xs font-semibold text-[#9EC4FF]" onClick={() => setDraft({
                contactId: contact.id,
                firstName: contact.first_name,
                lastName: contact.last_name,
                jobTitle: contact.job_title ?? "",
                email: contact.email ?? "",
                phone: contact.phone ?? "",
                roles: contact.roles?.length ? contact.roles : ["other"],
              })}>Modifier</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(contact.roles ?? []).map((role) => (
                <span key={role} className="rounded-full bg-[#14233A] px-2.5 py-1 text-[11px] font-extrabold text-[#9EC4FF]">{ROLES.find((item) => item[0] === role)?.[1] ?? role}</span>
              ))}
              {contact.phone ? <span className="text-xs text-[#AEB6CC]">{contact.phone}</span> : <span className="rounded-full bg-[#3A2A0E] px-2.5 py-1 text-[11px] font-extrabold text-[#F6D68B]">Téléphone manquant</span>}
            </div>
            {contact.email ? <a href={`mailto:${contact.email}`} className="mt-2 block text-sm text-[#9EC4FF]">{contact.email}</a> : null}
          </li>
        ))}
      </ul>

      {draft ? (
        <form className="mt-4 space-y-2" onSubmit={(event) => {
          event.preventDefault();
          void send({
            action: "save_contact",
            contactId: draft.contactId,
            firstName: draft.firstName,
            lastName: draft.lastName,
            jobTitle: draft.jobTitle,
            email: draft.email,
            phone: draft.phone,
            roles: draft.roles,
          });
        }}>
          <input required aria-label="Prénom" value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} placeholder="Prénom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="Nom" value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Poste" value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} placeholder="Poste" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="E-mail" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="E-mail" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Téléphone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="Téléphone" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <div className="flex flex-wrap gap-2">
            {ROLES.map(([value, label]) => {
              const active = draft.roles.includes(value);
              return (
                <button key={value} type="button" aria-pressed={active} onClick={() => setDraft({
                  ...draft,
                  roles: active ? draft.roles.filter((role) => role !== value) : [...draft.roles, value],
                })} className={`h-8 rounded-full px-3 text-xs font-extrabold ${active ? "bg-[#2F7CF6] text-white" : "bg-[#0B1122] text-[#AEB6CC]"}`}>{label}</button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || draft.roles.length === 0} className="h-10 rounded-full bg-[#2F7CF6] px-4 text-sm font-extrabold text-white">Enregistrer</button>
            <button type="button" className="h-10 px-4 text-sm" onClick={() => setDraft(null)}>Annuler</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
