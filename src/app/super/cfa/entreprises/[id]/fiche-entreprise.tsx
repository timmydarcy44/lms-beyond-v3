"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, Mail, UserRound } from "lucide-react";
import { CFA_COMPANY_STATUS_LABELS, type CfaCompanyStatus } from "@/lib/cfa-companies";
import { ContactsSection, type CompanyContact } from "./contacts-section";
import { EntrepriseSection, type IdentityCompany } from "./entreprise-section";
import { PostesSection, type CompanyNeed, type CompanyOffer, type ProfileSend } from "./postes-section";
import { SuiviColumn, type NextAction, type TimelineItem } from "./suivi-column";
import { TutorsSection, type CompanyApprentice, type CompanyTutor } from "./tutors-section";

const FRIEZE = ["creating_offer", "to_contact", "email_sent", "appointment", "pending_decision", "recruiting", "recruited"] as const;

const STRUCTURE: Record<string, string> = {
  independent: "Indépendant",
  franchise: "Franchisé",
  group: "Groupe / réseau",
  association: "Association",
  public: "Employeur public",
};

type Company = IdentityCompany & {
  organization_id?: string | null;
  status: CfaCompanyStatus;
  apprentices_wanted?: number | null;
  opco_source?: string | null;
};

type Summary = {
  fields: string;
  contacts: string;
  posts: string;
  tutors: string;
  follow: string;
  mainContact: string;
  mainEmail: string;
  wanted: number;
  placed: number;
  suggestRecruited: boolean;
};

type Suggestion = { id: string; name: string; siret?: string | null };

function department(postal: string | null | undefined) {
  const code = String(postal ?? "").replace(/\s/g, "");
  if (!/^\d{5}$/.test(code)) return "";
  return code.startsWith("97") || code.startsWith("98") ? code.slice(0, 3) : code.slice(0, 2);
}

function followLabel(value: string) {
  if (!value) return "Aucune relance";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aucune relance";
  return `Relance le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

export function FicheEntreprise({ id }: { id: string }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingOrg, setPendingOrg] = useState<Suggestion | null>(null);
  const [opcoLookupPending, setOpcoLookupPending] = useState(false);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [tutors, setTutors] = useState<CompanyTutor[]>([]);
  const [apprentices, setApprentices] = useState<CompanyApprentice[]>([]);
  const [needs, setNeeds] = useState<CompanyNeed[]>([]);
  const [offers, setOffers] = useState<CompanyOffer[]>([]);
  const [profileSends, setProfileSends] = useState<ProfileSend[]>([]);
  const [proposal, setProposal] = useState<{ kind: "need" | "offer" | null; id: string; title: string } | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const opcoRetries = useRef(0);

  async function load() {
    const response = await fetch(`/api/super-admin/crm/cfa/companies/${id}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Chargement impossible");
      return;
    }
    setCompany(result.company);
    setSummary(result.summary);
    setSuggestions(result.suggestions ?? []);
    setMigrationRequired(Boolean(result.migrationRequired));
    setOpcoLookupPending(Boolean(result.opcoLookupPending));
    setContacts(result.contacts ?? []);
    setTutors(result.tutors ?? []);
    setApprentices(result.apprentices ?? []);
    setNeeds(result.needs ?? []);
    setOffers(result.offers ?? []);
    setProfileSends(result.profileSends ?? []);
    setTimeline(result.timeline ?? []);
    setNextAction(result.nextAction ?? null);
  }

  useEffect(() => {
    opcoRetries.current = 0;
    void load();
  }, [id]);

  useEffect(() => {
    if (!opcoLookupPending || opcoRetries.current >= 2) return;
    opcoRetries.current += 1;
    const timer = window.setTimeout(() => void load(), 2500);
    return () => window.clearTimeout(timer);
  }, [opcoLookupPending, company?.opco_checked_at]);

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  if (!company || !summary) {
    return <main className="min-h-screen bg-[#0A0F1E] px-6 py-10 text-[#EEF1F8]">{message || "Chargement…"}</main>;
  }

  const dept = department(company.postal_code);
  const place = [company.city, dept ? `(${dept})` : ""].filter(Boolean).join(" ");
  const structure = STRUCTURE[company.structure_type ?? ""] ?? "";
  const stepIndex = FRIEZE.indexOf(company.status as (typeof FRIEZE)[number]);
  const initials = company.company_name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  const tiles = [
    { id: "entreprise", label: "Entreprise", state: summary.fields, color: "#6E5BFF" },
    { id: "contacts", label: "Contacts", state: summary.contacts, color: "#2F7CF6" },
    { id: "postes", label: "Postes et offres", state: summary.posts, color: "#14A37F" },
    { id: "tuteurs", label: "Tuteurs et alternants", state: summary.tutors, color: "#E7A92C" },
    { id: "suivi", label: "Suivi", state: followLabel(summary.follow), color: "#D9459E" },
  ];

  return (
    <main className="min-h-screen bg-[#0A0F1E] px-4 py-6 text-[#EEF1F8] sm:px-6">
      <Link href="/super/crm/cfa/entreprises" className="text-sm font-semibold text-[#AEB6CC]">CRM Entreprise</Link>
      {migrationRequired ? <p className="mt-4 rounded-2xl bg-[#3A2A0E] px-4 py-3 text-sm text-[#F6D68B]">Collez le script 20261026160000_cfa_company_fiche.sql pour activer la fiche.</p> : null}
      {message ? <p className="mt-4 text-sm text-[#F6D68B]">{message}</p> : null}

      <header className="mt-4 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#241C4A] text-lg font-extrabold text-[#B9AFFF]">{initials || <Building2 className="h-6 w-6" />}</span>
            <div>
              <h1 className="text-[32px] font-extrabold leading-none tracking-tight">{company.company_name}</h1>
              <p className="mt-2 text-sm text-[#AEB6CC]">
                {[place, structure, summary.mainContact ? `contact : ${summary.mainContact}` : ""].filter(Boolean).join(" · ") || "Identité à compléter"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
                <span className="rounded-full bg-[#0B1122] px-3 py-1">{company.siret || "SIRET à préciser"}</span>
                <span className="rounded-full bg-[#0B1122] px-3 py-1">{summary.wanted || 0} alternants souhaités · {summary.placed} placés</span>
                {company.opco && (company.opco_source === "cfadock" || company.opco_source === "idcc" || company.opco_source === "manual") ? <span className="rounded-full bg-[#0B1122] px-3 py-1">{company.opco}</span> : <span className="rounded-full bg-[#3A2A0E] px-3 py-1 text-[#F6D68B]">OPCO à confirmer</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={summary.mainEmail ? `mailto:${summary.mainEmail}` : undefined} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#26304F] px-4 text-sm font-semibold"><Mail className="h-4 w-4" />Envoyer un email</a>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => { setProposal({ kind: null, id: "", title: "" }); document.getElementById("postes")?.scrollIntoView({ behavior: "smooth" }); }}><UserRound className="h-4 w-4" />Proposer un candidat</button>
          </div>
        </div>

        {summary.suggestRecruited ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0E2A1D] px-4 py-3 text-sm text-[#6BE3C0]">
            <p>Un alternant de cette entreprise est en contrat.</p>
            <button type="button" disabled={busy} className="h-10 rounded-full bg-[#14A37F] px-4 text-sm font-extrabold text-[#04140C]" onClick={() => void send({ action: "status", status: "recruited" })}>Passer en Recrutement réussi ?</button>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Statut commercial" className="flex min-w-0 flex-1 items-center overflow-x-auto pb-1 max-[900px]:w-full">
            {FRIEZE.map((status, index) => {
              const active = company.status === status;
              const done = stepIndex >= index && stepIndex >= 0;
              return (
                <div key={status} className="flex min-w-[108px] flex-1 items-center">
                  {index > 0 ? <span className={`mx-1 h-1 min-w-3 flex-1 rounded-full ${done ? "bg-[#22B8CF]" : "bg-[#1A2340]"}`} /> : null}
                  <button type="button" role="radio" aria-checked={active} disabled={busy} onClick={() => void send({ action: "status", status })} className={`h-9 shrink-0 rounded-full px-3 text-[11px] font-extrabold ${active ? "bg-[#1597AB] text-[#04140C]" : done ? "bg-[#22B8CF] text-[#04140C]" : "bg-[#0B1122] text-[#5D6785]"}`}>
                    {CFA_COMPANY_STATUS_LABELS[status]}
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className="h-9 rounded-full border border-[#FF8A98] px-4 text-xs font-semibold text-[#FF8A98]" onClick={() => setLostOpen(true)}>Marquer perdu</button>
        </div>

        {!company.organization_id && suggestions.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#26304F] p-4">
            <p className="text-sm font-extrabold">Comptes Byound Business au même nom</p>
            <ul className="mt-2 space-y-2">
              {suggestions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold" onClick={() => setPendingOrg(item)}>Rattacher</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <nav aria-label="Sommaire" className="sticky top-3 z-20 mt-4 flex gap-2 overflow-x-auto min-[900px]:grid min-[900px]:grid-cols-5">
        {tiles.map((tile) => (
          <a key={tile.id} href={`#${tile.id}`} className="min-w-[180px] rounded-[20px] border border-[#1A2340] bg-[#111831] px-3 py-3 text-sm min-[900px]:min-w-0">
            <span className="flex items-center gap-2 font-extrabold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tile.color }} />{tile.label}</span>
            <span className="mt-1 block text-xs text-[#AEB6CC]">{tile.state}</span>
          </a>
        ))}
      </nav>

      <div className="mt-4 grid items-start gap-4 min-[1200px]:grid-cols-[minmax(0,1.4fr)_320px]">
        <div className="space-y-4">
          <EntrepriseSection company={company} onCompany={(next) => setCompany({ ...company, ...next })} onMessage={setMessage} />
          <ContactsSection companyId={company.id} contacts={contacts} onChanged={load} onMessage={setMessage} />
          <PostesSection
            companyId={company.id}
            linked={Boolean(company.organization_id)}
            needs={needs}
            offers={offers}
            sends={profileSends}
            apprentices={apprentices}
            contacts={contacts}
            proposal={proposal}
            onProposal={setProposal}
            onChanged={load}
            onMessage={setMessage}
          />
          <TutorsSection companyId={company.id} tutors={tutors} apprentices={apprentices} onChanged={load} onMessage={setMessage} />
        </div>
        <aside className="min-[1200px]:sticky min-[1200px]:top-24">
          <SuiviColumn
            companyId={company.id}
            company={company}
            contacts={contacts}
            tutors={tutors}
            timeline={timeline}
            nextAction={nextAction}
            onChanged={load}
            onMessage={setMessage}
          />
        </aside>
      </div>

      {lostOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-md rounded-[26px] bg-[#111831] p-6" onSubmit={(event) => { event.preventDefault(); void send({ action: "mark_lost", reason }).then(() => setLostOpen(false)); }}>
            <h2 className="text-xl font-extrabold">Marquer perdu</h2>
            <label className="mt-4 block text-sm">Motif
              <textarea required value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-10 px-4 text-sm" onClick={() => setLostOpen(false)}>Annuler</button>
              <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#FF8A98] px-4 text-sm font-extrabold text-[#2A0C12]">Confirmer</button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingOrg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-[#111831] p-6">
            <h2 className="text-xl font-extrabold">Rattacher {pendingOrg.name} ?</h2>
            <p className="mt-2 text-sm text-[#AEB6CC]">Le rattachement est confirmé à la main. Il sera journalisé.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-10 px-4 text-sm" onClick={() => setPendingOrg(null)}>Annuler</button>
              <button type="button" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => void send({ action: "link_organization", organizationId: pendingOrg.id }).then(() => setPendingOrg(null))}>Confirmer</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
