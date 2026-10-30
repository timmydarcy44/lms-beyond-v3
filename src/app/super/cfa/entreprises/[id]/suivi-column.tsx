"use client";

import { useState } from "react";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import type { IdentityCompany } from "./entreprise-section";
import type { CompanyContact } from "./contacts-section";
import type { CompanyTutor } from "./tutors-section";

export type TimelineItem = {
  id: string;
  type: string;
  body: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  doneAt: string | null;
  createdAt: string;
  openedAt: string | null;
  actorName: string;
};

export type NextAction = { id: string; title: string | null; at: string | null };

const TYPE_LABELS: Record<string, string> = {
  note: "Note",
  call: "Appel",
  email: "E-mail",
  meeting: "Rendez-vous",
  status_change: "Statut",
  profile_sent: "Profil envoyé",
  placement: "Rattachement",
  opco_lookup: "Recherche OPCO",
};

function relative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: "", late: false };
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (date.getTime() < Date.now()) return { label: "en retard", late: true };
  if (days <= 0) return { label: "aujourd'hui", late: false };
  if (days === 1) return { label: "demain", late: false };
  return { label: `dans ${days} jours`, late: false };
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function SuiviColumn({
  companyId,
  company,
  contacts,
  tutors,
  timeline,
  nextAction,
  onChanged,
  onMessage,
}: {
  companyId: string;
  company: IdentityCompany;
  contacts: CompanyContact[];
  tutors: CompanyTutor[];
  timeline: TimelineItem[];
  nextAction: NextAction | null;
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [postponing, setPostponing] = useState(false);
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const [busy, setBusy] = useState(false);

  const lines = [
    { href: "#champ-siret", label: "SIRET et adresse", done: isValidSiret(cleanSiret(company.siret)) && Boolean((company.address_line || company.company_address || "").trim()) },
    { href: "#champ-naf", label: "NAF et effectif", done: Boolean(company.naf_code?.trim() && company.headcount_range?.trim()) },
    { href: "#champ-opco", label: "IDCC et OPCO", done: Boolean(company.idcc?.trim() && company.opco?.trim() && ["cfadock", "idcc", "manual"].includes(company.opco_source ?? "")) },
    { href: "#champ-contact", label: "Contact principal", done: contacts.some((item) => (item.roles ?? []).includes("main")) },
    { href: "#champ-tuteur", label: "Tuteur désigné", done: tutors.length > 0 },
    { href: "#champ-signataire", label: "Signataire du contrat", done: contacts.some((item) => (item.roles ?? []).includes("signatory")) },
  ];
  const ready = lines.filter((line) => line.done).length;
  const timing = nextAction?.at ? relative(nextAction.at) : null;

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
      await onChanged();
      return true;
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Enregistrement impossible");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold">Prête pour le contrat</h2>
          <span className="text-xs font-extrabold text-[#6BE3C0]">{ready} / 6</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1A2340]"><span className="block h-full bg-[#14A37F]" style={{ width: `${(ready / 6) * 100}%` }} /></div>
        <ul className="mt-3 space-y-1">
          {lines.map((line) => (
            <li key={line.href}>
              <a href={line.href} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-[#0B1122]">
                <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${line.done ? "border-[#14A37F] bg-[#14A37F] text-[#04140C]" : "border-[#5D6785]"}`}>{line.done ? "✓" : ""}</span>
                {line.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="suivi" className="scroll-mt-28 rounded-[26px] border border-[#1A2340] bg-[#111831] p-5" style={{ borderTop: "4px solid #D9459E" }}>
        <p className="text-xs font-extrabold text-[#F3A6D4]">5 · Suivi commercial</p>
        <h2 className="text-xl font-extrabold">Suivi commercial</h2>
        <div className="mt-4 rounded-2xl bg-[#3A1430] p-4">
          <p className="text-xs font-extrabold text-[#F3A6D4]">Prochaine action</p>
          {nextAction?.title ? (
            <>
              <p className="mt-1 font-extrabold">{nextAction.title}</p>
              <p className={`mt-1 text-sm ${timing?.late ? "font-extrabold text-[#FF8A98]" : "text-[#F3A6D4]"}`}>{timing?.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} className="h-9 rounded-full bg-[#14A37F] px-3 text-xs font-extrabold text-[#04140C]" onClick={() => { void send({ action: "complete_next_action", activityId: nextAction.id }).then((ok) => { if (ok) setAsking(true); }); }}>Fait</button>
                <button type="button" className="h-9 rounded-full border border-[#F3A6D4] px-3 text-xs font-extrabold" onClick={() => setPostponing((value) => !value)}>Reporter</button>
              </div>
            </>
          ) : <p className="mt-1 text-sm text-[#F3A6D4]">Aucune action prévue.</p>}
          {postponing && nextAction ? (
            <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send({ action: "postpone_next_action", activityId: nextAction.id, at }).then((ok) => { if (ok) setPostponing(false); }); }}>
              <input required aria-label="Nouvelle date" type="datetime-local" value={at} onChange={(event) => setAt(event.target.value)} className="h-10 flex-1 rounded-xl border border-[#5A2348] bg-[#2A0E24] px-2 text-sm" />
              <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#D9459E] px-3 text-xs font-extrabold text-[#1A0C04]">OK</button>
            </form>
          ) : null}
          {asking || !nextAction ? (
            <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); void send({ action: "set_next_action", title, at }).then((ok) => { if (ok) { setAsking(false); setTitle(""); setAt(""); } }); }}>
              <input required aria-label="Prochaine action" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nouvelle action" className="h-10 w-full rounded-xl border border-[#5A2348] bg-[#2A0E24] px-3 text-sm" />
              <input required aria-label="Date de l'action" type="datetime-local" value={at} onChange={(event) => setAt(event.target.value)} className="h-10 w-full rounded-xl border border-[#5A2348] bg-[#2A0E24] px-2 text-sm" />
              <button type="submit" disabled={busy} className="h-9 rounded-full bg-[#D9459E] px-3 text-xs font-extrabold text-[#1A0C04]">Enregistrer</button>
            </form>
          ) : null}
        </div>

        <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (!note.trim()) return; void send({ action: "add_note", body: note.trim() }).then((ok) => { if (ok) setNote(""); }); }}>
          <input aria-label="Ajouter une note" value={note} onChange={(event) => setNote(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ajouter une note" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
        </form>

        <ol className="mt-4 space-y-3 border-l border-[#26304F] pl-4">
          {timeline.filter((item) => item.id !== nextAction?.id).map((item) => (
            <li key={item.id}>
              <p className="text-xs font-extrabold text-[#F3A6D4]">{TYPE_LABELS[item.type] ?? item.type}</p>
              <p className="text-sm">{item.body || item.nextAction}</p>
              {item.type === "profile_sent" && item.openedAt ? <p className="text-xs text-[#6BE3C0]">Ouvert le {when(item.openedAt)}</p> : null}
              {item.doneAt && item.nextAction ? <p className="text-xs text-[#6BE3C0]">Fait</p> : null}
              <p className="text-xs text-[#5D6785]">{item.actorName} · {when(item.createdAt)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
