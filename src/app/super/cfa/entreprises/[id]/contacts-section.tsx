"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { formatPersonName } from "@/lib/cfa/format-org-name";

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
  ["main", "Contact principal", "bg-[#14233A] text-[#8DB8FF]"],
  ["signatory", "Signataire", "bg-[#143226] text-[#6BE39B]"],
  ["hr", "RH", "bg-[#1A2340] text-[#B7BED3]"],
  ["other", "Autre", "bg-[#1A2340] text-[#9AA3BD]"],
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

function rolePills(contact: CompanyContact) {
  const roles = contact.roles ?? [];
  const pills: Array<{ key: string; label: string; className: string }> = [];
  for (const [value, label, className] of ROLES) {
    if (value === "other") continue;
    if (roles.includes(value)) pills.push({ key: value, label, className });
  }
  const job = String(contact.job_title ?? "");
  if (/gérant|gerant|président|president|représentant|representant|légal|legal/i.test(job)) {
    pills.push({ key: "legal", label: "Représentant légal", className: "bg-[#1A2340] text-[#B7BED3]" });
  }
  if (/tuteur|ma[iî]tre/i.test(job)) {
    pills.push({ key: "tutor", label: "Tuteur pressenti", className: "bg-[#0E2A28] text-[#5EDCC3]" });
  }
  return pills;
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
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [designating, setDesignating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
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

  function openMail(contact: CompanyContact) {
    if (!contact.email) return;
    const params = new URLSearchParams();
    params.set("to", contact.email);
    params.set("name", formatPersonName(`${contact.first_name} ${contact.last_name}`));
    router.push(`/super/crm/emails?${params.toString()}`);
  }

  return (
    <section id="contacts" className="scroll-mt-28 rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#8DB8FF26] text-[#8DB8FF]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold text-[#F2F4FA]">Contacts</h2>
            <p className="text-xs text-[#9AA3BD]">Principal, signataire du contrat, RH.</p>
          </div>
        </div>
        <button type="button" className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold" onClick={() => openNew()}>
          ＋ Contact
        </button>
      </header>

      <div id="champ-contact" className="scroll-mt-28" />
      {!hasSignatory ? (
        <div
          id="champ-signataire"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-[#FF8A9B40] px-4 py-3"
          style={{ background: "#FF8A9B14" }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8A9B] text-sm font-extrabold text-[#0A0F1E]">!</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#F2F4FA]">Aucun signataire du contrat</p>
            <p className="text-xs text-[#9AA3BD]">Obligatoire pour le CERFA. Souvent le gérant ou le représentant légal.</p>
          </div>
          <button
            type="button"
            className="h-9 rounded-full bg-[#FF8A9B] px-4 text-xs font-extrabold text-[#0A0F1E]"
            onClick={() => (contacts.length ? setDesignating(true) : openNew(true))}
          >
            Désigner
          </button>
        </div>
      ) : (
        <div id="champ-signataire" className="scroll-mt-28" />
      )}

      {designating ? (
        <ul className="mb-4 space-y-2">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-2xl border border-[#26304F] px-3 py-2 text-left text-sm"
                onClick={() => void send({ action: "designate_signatory", contactId: contact.id })}
              >
                Désigner {formatPersonName(`${contact.first_name} ${contact.last_name}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="grid gap-3 min-[900px]:grid-cols-2">
        {contacts.map((contact) => {
          const name = formatPersonName(`${contact.first_name} ${contact.last_name}`);
          const pills = rolePills(contact);
          return (
            <li key={contact.id} className="relative rounded-[18px] bg-[#0B1122] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C3358] text-xs font-extrabold text-[#9EC4FF]">
                    {initials(contact)}
                  </span>
                  <div>
                    <p className="font-extrabold text-[#F2F4FA]">{name}</p>
                    <p className="text-xs text-[#9AA3BD]">{formatPersonName(contact.job_title) || "Poste à préciser"}</p>
                  </div>
                </div>
                <button type="button" className="text-[#9AA3BD]" aria-label="Menu contact" onClick={() => setMenuId(menuId === contact.id ? null : contact.id)}>
                  ⋯
                </button>
              </div>
              {menuId === contact.id ? (
                <div className="absolute right-3 top-12 z-10 min-w-[140px] rounded-2xl border border-[#26304F] bg-[#111831] p-1 shadow-xl">
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#0B1122]"
                    onClick={() => {
                      setMenuId(null);
                      setDraft({
                        contactId: contact.id,
                        firstName: contact.first_name,
                        lastName: contact.last_name,
                        jobTitle: contact.job_title ?? "",
                        email: contact.email ?? "",
                        phone: contact.phone ?? "",
                        roles: contact.roles?.length ? contact.roles : ["other"],
                      });
                    }}
                  >
                    Modifier
                  </button>
                </div>
              ) : null}
              {pills.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pills.map((pill) => (
                    <span key={pill.key} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${pill.className}`}>
                      {pill.label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {contact.email ? (
                  <button type="button" className="h-8 rounded-full border border-[#26304F] px-3 text-xs font-semibold group" onClick={() => openMail(contact)} title={contact.email}>
                    ✉ E-mail
                    <span className="sr-only group-hover:not-sr-only group-hover:ml-1">{contact.email}</span>
                  </button>
                ) : null}
                {contact.phone ? (
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex h-8 items-center rounded-full border border-[#26304F] px-3 text-xs font-semibold" title={contact.phone}>
                    ✆ Appeler
                  </a>
                ) : null}
                {!hasSignatory ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="h-8 rounded-full border border-[#6BE39B55] px-3 text-xs font-semibold text-[#6BE39B]"
                    onClick={() => void send({ action: "designate_signatory", contactId: contact.id })}
                  >
                    Désigner signataire
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {draft ? (
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              action: "save_contact",
              contactId: draft.contactId,
              firstName: formatPersonName(draft.firstName),
              lastName: formatPersonName(draft.lastName),
              jobTitle: formatPersonName(draft.jobTitle),
              email: draft.email,
              phone: draft.phone,
              roles: draft.roles,
            });
          }}
        >
          <input required aria-label="Prénom" value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} onBlur={() => setDraft({ ...draft, firstName: formatPersonName(draft.firstName) })} placeholder="Prénom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input required aria-label="Nom" value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} onBlur={() => setDraft({ ...draft, lastName: formatPersonName(draft.lastName) })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Poste" value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} placeholder="Poste" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="E-mail" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="E-mail" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <input aria-label="Téléphone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="Téléphone" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
          <div className="flex flex-wrap gap-2">
            {ROLES.map(([value, label]) => {
              const active = draft.roles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      roles: active ? draft.roles.filter((role) => role !== value) : [...draft.roles, value],
                    })
                  }
                  className={`h-8 rounded-full px-3 text-xs font-extrabold ${active ? "bg-[#2F7CF6] text-white" : "bg-[#0B1122] text-[#AEB6CC]"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || draft.roles.length === 0} className="h-10 rounded-full bg-[#2F7CF6] px-4 text-sm font-extrabold text-white">
              Enregistrer
            </button>
            <button type="button" className="h-10 px-4 text-sm" onClick={() => setDraft(null)}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
