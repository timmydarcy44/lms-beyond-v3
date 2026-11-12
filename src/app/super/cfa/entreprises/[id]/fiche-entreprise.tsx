"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Mail, UserRound } from "lucide-react";
import type { CfaCompanyStatus } from "@/lib/cfa-companies";
import { wantedLabel } from "@/lib/cfa/alternance-contract";
import { formatCompanyName, formatPersonName } from "@/lib/cfa/format-org-name";
import {
  CFA_HOST_STAGES,
  dbStatusForHostStage,
  hostStageFromStatus,
  hostStageMeta,
  type CfaHostStageId,
} from "@/lib/cfa/host-company-stages";
import { isOpcoContractReady } from "@/lib/cfa/company-opco";
import { formatSiretDisplay } from "@/lib/control/address-format";
import { ContactsSection, type CompanyContact } from "./contacts-section";
import { EntrepriseSection, type IdentityCompany } from "./entreprise-section";
import { PostesSection, type CompanyNeed, type CompanyOffer, type ProfileSend } from "./postes-section";
import { SuiviColumn, type NextAction, type TimelineItem } from "./suivi-column";
import { TutorsSection, type CompanyApprentice, type CompanyTutor } from "./tutors-section";

const AVATAR_GRADIENTS = [
  ["#6E5BFF", "#2A1E8F"],
  ["#14836E", "#0B3B36"],
  ["#2F6FD6", "#0E2A5C"],
  ["#B65BFF", "#3B1466"],
  ["#C9A227", "#5A4510"],
] as const;

type Company = IdentityCompany & {
  organization_id?: string | null;
  status: CfaCompanyStatus;
  apprentices_wanted?: number | null;
  opco_source?: string | null;
  email?: string | null;
  contact_role?: string | null;
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
  offerCount?: number;
  suggestRecruited: boolean;
};

type Suggestion = { id: string; name: string; siret?: string | null };

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function avatarGradient(id: string) {
  const [a, b] = AVATAR_GRADIENTS[hashId(id) % AVATAR_GRADIENTS.length]!;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function department(postal: string | null | undefined) {
  const code = String(postal ?? "").replace(/\s/g, "");
  if (!/^\d{5}$/.test(code)) return "";
  return code.startsWith("97") || code.startsWith("98") ? code.slice(0, 3) : code.slice(0, 2);
}

function sectionStateClass(kind: "ok" | "todo" | "info") {
  if (kind === "ok") return "text-[#6BE39B]";
  if (kind === "todo") return "text-[#FF8A9B]";
  return "text-[#5EDCC3]";
}

export function FicheEntreprise({ id, listQuery = "" }: { id: string; listQuery?: string }) {
  const router = useRouter();
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<CfaHostStageId | null>(null);
  const [editEntreprise, setEditEntreprise] = useState(false);
  const [activeSection, setActiveSection] = useState("entreprise");
  const opcoRetries = useRef(0);

  const listHref = useMemo(
    () => `/super/crm/cfa/entreprises${listQuery ? `?${listQuery}` : ""}`,
    [listQuery],
  );

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

  useEffect(() => {
    const ids = ["entreprise", "contacts", "postes", "tuteurs"] as const;
    const nodes = ids.map((sectionId) => document.getElementById(sectionId)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [company?.id, summary]);

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

  function scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
  }

  function openMail() {
    const main = contacts.find((item) => (item.roles ?? []).includes("main")) ?? contacts.find((item) => item.email);
    const params = new URLSearchParams();
    const email = main?.email || summary?.mainEmail || company?.email || "";
    if (email) params.set("to", email);
    if (main) params.set("name", formatPersonName(`${main.first_name} ${main.last_name}`));
    else if (summary?.mainContact) params.set("name", formatPersonName(summary.mainContact));
    if (company?.company_name) params.set("company", formatCompanyName(company.company_name));
    router.push(`/super/crm/emails?${params.toString()}`);
  }

  if (!company || !summary) {
    return (
      <main className="min-h-screen bg-[#0A0F1E] px-6 py-10 text-[#EEF1F8]">
        <div className="mx-auto max-w-[1240px] space-y-4">
          <div className="h-4 w-48 animate-pulse rounded bg-[#111831]" />
          <div className="h-48 animate-pulse rounded-[30px] bg-[#111831]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[#111831]" />
          <div className="grid gap-4 min-[1200px]:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-[24px] bg-[#111831]" />
            <div className="h-96 animate-pulse rounded-[24px] bg-[#111831]" />
          </div>
          {message ? <p className="text-sm text-[#F6D68B]">{message}</p> : null}
        </div>
      </main>
    );
  }

  const displayName = formatCompanyName(company.company_name);
  const dept = department(company.postal_code);
  const city = formatCompanyName(company.city);
  const place = [city, dept ? `(${dept})` : ""].filter(Boolean).join(" ");
  const siret = formatSiretDisplay(company.siret);
  const mainContact = contacts.find((item) => (item.roles ?? []).includes("main"));
  const contactLine = mainContact
    ? `${formatPersonName(`${mainContact.first_name} ${mainContact.last_name}`)}${mainContact.job_title ? `, ${formatPersonName(mainContact.job_title)}` : ""}`
    : summary.mainContact
      ? formatPersonName(summary.mainContact)
      : "";
  const stageId = hostStageFromStatus(company.status) ?? "to_contact";
  const stageMeta = hostStageMeta(stageId);
  const stageIndex = CFA_HOST_STAGES.findIndex((stage) => stage.id === stageId);
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const wanted = summary.wanted || Number(company.apprentices_wanted ?? 0) || 0;
  const opcoConfirmed = isOpcoContractReady(company);
  const fieldCount = Number(String(summary.fields).split("/")[0]?.trim() || 0);
  const hasSignatory = contacts.some((c) => (c.roles ?? []).includes("signatory"));
  const withoutTutor = apprentices.filter((a) => !a.tutorId).length;
  const offerN = Math.max(needs.length, offers.length, summary.offerCount ?? 0);

  const tiles = [
    {
      id: "entreprise",
      label: "Entreprise",
      state: `${fieldCount} / 8`,
      kind: fieldCount >= 8 ? ("ok" as const) : ("info" as const),
      color: "#6E5BFF",
    },
    {
      id: "contacts",
      label: "Contacts",
      state: hasSignatory ? `${contacts.length}` : "1 à faire",
      kind: hasSignatory ? ("ok" as const) : ("todo" as const),
      color: "#8DB8FF",
    },
    {
      id: "postes",
      label: "Postes et offres",
      state: offerN <= 1 ? `${offerN} offre` : `${offerN} offres`,
      kind: "info" as const,
      color: "#5EDCC3",
    },
    {
      id: "tuteurs",
      label: "Tuteurs et alternants",
      state: withoutTutor > 0 ? `${withoutTutor} à faire` : `${apprentices.length || tutors.length}`,
      kind: withoutTutor > 0 ? ("todo" as const) : ("ok" as const),
      color: "#F2CF6B",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0F1E] px-4 py-6 text-[#F2F4FA] sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <p className="text-sm text-[#9AA3BD]">
          <Link href={listHref} className="font-semibold text-[#B7BED3] hover:text-white">
            ‹ Entreprises d&apos;accueil
          </Link>
          <span> / {displayName}</span>
        </p>

        {migrationRequired ? (
          <p className="mt-4 rounded-2xl bg-[#3A2A0E] px-4 py-3 text-sm text-[#F6D68B]">
            Collez le script 20261026160000_cfa_company_fiche.sql pour activer la fiche.
          </p>
        ) : null}
        {message ? <p className="mt-4 text-sm text-[#F6D68B]">{message}</p> : null}

        <header
          className="mt-4 rounded-[30px] border border-[#24364A] p-[26px_28px]"
          style={{
            background: "radial-gradient(120% 140% at 0% 0%, #1E4A3F 0%, #152030 45%, #111831 100%)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 flex-1 gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-lg font-extrabold text-white"
                style={{ background: avatarGradient(company.id) }}
              >
                {initials || <Building2 className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <h1 className="text-[32px] font-extrabold leading-none tracking-tight">{displayName}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
                  <span className="rounded-full px-3 py-1 text-[#0A0F1E]" style={{ background: stageMeta.color }}>
                    {stageMeta.label}
                  </span>
                  <span className="rounded-full bg-[#0E2A28] px-3 py-1 text-[#5EDCC3]">CFA</span>
                  {wanted > 0 ? (
                    <span className="rounded-full bg-[#1A2340] px-3 py-1 text-[#B7BED3]">{wantedLabel(wanted)}</span>
                  ) : null}
                  {!opcoConfirmed ? (
                    <span className="rounded-full border border-dashed border-[#F2CF6B] px-3 py-1 text-[#F2CF6B]">OPCO à confirmer</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-[#9AA3BD]">
                  {[place, siret ? `SIRET ${siret}` : null, contactLine ? `Contact : ${contactLine}` : null].filter(Boolean).join(" · ") || "Identité à compléter"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A2340] text-[11px] font-extrabold text-[#9AA3BD]">?</span>
                <span>
                  <span className="block text-[10px] leading-none text-[#9AA3BD]">Chargé</span>
                  <span className="text-sm font-semibold text-[#9AA3BD]">Non assigné</span>
                </span>
                <span className="text-[#6C7593]">▾</span>
              </div>
              <div className="relative flex flex-wrap justify-end gap-2">
                <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#26304F] px-4 text-sm font-semibold" onClick={openMail}>
                  <Mail className="h-4 w-4" /> E-mail
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-[#0A0F1E]"
                  onClick={() => {
                    setProposal({ kind: null, id: "", title: "" });
                    scrollTo("postes");
                  }}
                >
                  <UserRound className="h-4 w-4" /> Proposer un candidat
                </button>
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#26304F] text-lg" aria-label="Plus d'actions" onClick={() => setMenuOpen((v) => !v)}>
                  ⋯
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-12 z-30 min-w-[200px] rounded-2xl border border-[#26304F] bg-[#111831] p-1 shadow-xl">
                    <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#0B1122]" onClick={() => { setMenuOpen(false); setLostOpen(true); }}>
                      Marquer perdu
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#0B1122]"
                      onClick={() => {
                        setMenuOpen(false);
                        setReason("Archivée");
                        setLostOpen(true);
                      }}
                    >
                      Archiver
                    </button>
                    <Link
                      href={company.siret ? `/super/entreprises?q=${encodeURIComponent(cleanDigits(company.siret))}` : "/super/entreprises"}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-[#0B1122]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Voir dans l&apos;annuaire
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {summary.suggestRecruited ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0E2A1D] px-4 py-3 text-sm text-[#6BE3C0]">
              <p>Un alternant de cette entreprise est en contrat.</p>
              <button type="button" disabled={busy} className="h-10 rounded-full bg-[#14A37F] px-4 text-sm font-extrabold text-[#04140C]" onClick={() => void send({ action: "status", status: "recruited" })}>
                Passer en Recrutement réussi ?
              </button>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto pb-1" role="radiogroup" aria-label="Étapes">
            <div className="flex min-w-[720px] items-start">
              {CFA_HOST_STAGES.map((stage, index) => {
                const done = stageIndex > index;
                const current = stageIndex === index;
                return (
                  <div key={stage.id} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {index > 0 ? <span className={`h-[2px] flex-1 ${done || current ? "bg-[#6BE39B]" : "bg-[#26304F]"}`} /> : <span className="flex-1" />}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={current}
                        disabled={busy}
                        onClick={() => setPendingStage(stage.id)}
                        className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                          done
                            ? "bg-[#6BE39B] text-[#04140C]"
                            : current
                              ? "bg-[#F2CF6B] text-[#0A0F1E]"
                              : "border-2 border-[#3A4566] bg-transparent text-transparent"
                        }`}
                        style={current ? { boxShadow: "0 0 0 5px #F2CF6B33" } : undefined}
                      >
                        {done ? "✓" : current ? "" : ""}
                      </button>
                      {index < CFA_HOST_STAGES.length - 1 ? <span className={`h-[2px] flex-1 ${done ? "bg-[#6BE39B]" : "bg-[#26304F]"}`} /> : <span className="flex-1" />}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPendingStage(stage.id)}
                      className={`mt-2 px-1 text-center text-[12.5px] font-extrabold leading-tight ${
                        current ? "text-white" : done ? "text-[#B7BED3]" : "text-[#6C7593]"
                      }`}
                    >
                      {stage.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {!company.organization_id && suggestions.length ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#26304F] p-4">
              <p className="text-sm font-extrabold">Comptes Byound Business au même nom</p>
              <ul className="mt-2 space-y-2">
                {suggestions.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{formatCompanyName(item.name)}</span>
                    <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold" onClick={() => setPendingOrg(item)}>
                      Rattacher
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </header>

        <nav aria-label="Sommaire" className="sticky top-0 z-20 -mx-1 mt-4 bg-[#0A0F1E]/95 px-1 py-2 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto rounded-[16px] border border-[#1A2340] bg-[#111831] p-2">
            {tiles.map((tile) => {
              const active = activeSection === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => scrollTo(tile.id)}
                  className="flex min-w-[160px] flex-1 items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition"
                  style={{
                    background: active ? "#0B1122" : "transparent",
                    boxShadow: active ? "inset 0 0 0 1px #26304F" : undefined,
                  }}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tile.color }} />
                  <span className="font-extrabold text-[#F2F4FA]">{tile.label}</span>
                  <span className={`ml-auto text-xs font-semibold ${sectionStateClass(tile.kind)}`}>{tile.state}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 grid items-start gap-4 min-[1200px]:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <EntrepriseSection
              company={company}
              onCompany={(next) => setCompany({ ...company, ...next })}
              onMessage={setMessage}
              editing={editEntreprise}
              onEditing={setEditEntreprise}
            />
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
            <TutorsSection companyId={company.id} tutors={tutors} apprentices={apprentices} contacts={contacts} onChanged={load} onMessage={setMessage} />
          </div>
          <aside className="min-[1200px]:sticky min-[1200px]:top-24">
            <SuiviColumn
              companyId={company.id}
              company={company}
              contacts={contacts}
              tutors={tutors}
              apprentices={apprentices}
              timeline={timeline}
              nextAction={nextAction}
              onChanged={load}
              onMessage={setMessage}
              onScrollTo={(sectionId) => {
                if (sectionId === "entreprise") setEditEntreprise(true);
                scrollTo(sectionId);
              }}
            />
          </aside>
        </div>
      </div>

      {lostOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            className="w-full max-w-md rounded-[26px] bg-[#111831] p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void send({ action: "mark_lost", reason }).then(() => {
                setLostOpen(false);
                setReason("");
              });
            }}
          >
            <h2 className="text-xl font-extrabold">{reason === "Archivée" ? "Archiver" : "Marquer perdu"}</h2>
            <label className="mt-4 block text-sm">
              Motif
              <textarea required value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-10 px-4 text-sm" onClick={() => { setLostOpen(false); setReason(""); }}>
                Annuler
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#FF8A98] px-4 text-sm font-extrabold text-[#2A0C12]">
                Confirmer
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingStage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-[#111831] p-6">
            <h2 className="text-xl font-extrabold">Passer à « {hostStageMeta(pendingStage).label} » ?</h2>
            <p className="mt-2 text-sm text-[#9AA3BD]">Le changement sera inscrit au journal.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-10 px-4 text-sm" onClick={() => setPendingStage(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white"
                onClick={() => {
                  const status = dbStatusForHostStage(pendingStage);
                  void send({ action: "status", status }).then(() => setPendingStage(null));
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingOrg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-[#111831] p-6">
            <h2 className="text-xl font-extrabold">Rattacher {formatCompanyName(pendingOrg.name)} ?</h2>
            <p className="mt-2 text-sm text-[#AEB6CC]">Le rattachement est confirmé à la main. Il sera journalisé.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-10 px-4 text-sm" onClick={() => setPendingOrg(null)}>
                Annuler
              </button>
              <button type="button" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => void send({ action: "link_organization", organizationId: pendingOrg.id }).then(() => setPendingOrg(null))}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function cleanDigits(value: string) {
  return String(value ?? "").replace(/\D/g, "");
}
