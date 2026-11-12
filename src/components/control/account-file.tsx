"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { MetalBadgeCard } from "@/components/openbadges/metal-badge-card";
import { REASON_CODES } from "@/lib/control/constants";
import { formatEuroDelta, formatEurosHt, summarizeRevenue, type BillingDoc } from "@/lib/control/policy";
import type { loadAccountDetail } from "@/lib/control/load";
import { roleLabel, roleTone } from "@/lib/roles";
import { DisabledTip, EmptyState, Field, KpiCard, SegmentedFilter, SidePanel, fieldClass } from "./chrome";
import { AccountFormationRequestWizard } from "./account-formation-request-wizard";
import { AccountQualiopiCoffre } from "./account-qualiopi-coffre";
import { AccountSurMesureTab } from "./account-surmesure-tab";
import { OrganizationFeaturesPanel } from "@/components/super-admin/organization-features-panel";
import { BanAddressAutocomplete } from "@/components/address/ban-address-autocomplete";

type Detail = Awaited<ReturnType<typeof loadAccountDetail>>;

/** Onglets de contenu (sous-vues comprises). */
type Tab =
  | "overview"
  | "members"
  | "courses"
  | "dossiers"
  | "surmesure"
  | "badges"
  | "revenue"
  | "funding"
  | "documents"
  | "journal"
  | "modules"
  | "tests";

type NavId = "overview" | "formations" | "saas" | "members" | "revenue" | "documents" | "journal";

const NAV_ITEMS: Array<{ id: NavId; label: string }> = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "formations", label: "Formations" },
  { id: "saas", label: "SaaS" },
  { id: "members", label: "Membres" },
  { id: "revenue", label: "Chiffre d'affaires" },
  { id: "documents", label: "Coffre Qualiopi" },
  { id: "journal", label: "Journal" },
];

const FORMATIONS_SUB: Array<{ id: Tab; label: string }> = [
  { id: "dossiers", label: "Dossiers formation" },
  { id: "surmesure", label: "Sur-mesure" },
  { id: "courses", label: "Accès LMS" },
  { id: "badges", label: "Open Badges" },
];

const REVENUE_SUB: Array<{ id: Tab; label: string }> = [
  { id: "revenue", label: "Chiffre d'affaires" },
  { id: "funding", label: "Financement" },
];

const LEGACY_TAB_IDS: Tab[] = [
  "overview",
  "members",
  "courses",
  "dossiers",
  "surmesure",
  "badges",
  "revenue",
  "funding",
  "documents",
  "journal",
  "modules",
  "tests",
];

function navFromTab(tab: Tab): NavId {
  if (tab === "dossiers" || tab === "surmesure" || tab === "courses" || tab === "badges") return "formations";
  if (tab === "modules") return "saas";
  if (tab === "revenue" || tab === "funding") return "revenue";
  if (tab === "members") return "members";
  if (tab === "documents") return "documents";
  if (tab === "journal") return "journal";
  return "overview";
}

function defaultTabForNav(nav: NavId): Tab {
  if (nav === "formations") return "dossiers";
  if (nav === "saas") return "modules";
  if (nav === "revenue") return "revenue";
  if (nav === "members") return "members";
  if (nav === "documents") return "documents";
  if (nav === "journal") return "journal";
  return "overview";
}

const ROLE_COLORS = {
  admin: { bg: "#241C3E", fg: "#C4B8FF" },
  tutor: { bg: "#1A2744", fg: "#8DB8FF" },
  invited: { bg: "#3A3118", fg: "#F2CF6B" },
  member: { bg: "#163228", fg: "#6BE39B" },
};

export function AccountFile({ detail, initialTab, embedded = false }: { detail: Detail; initialTab?: string; embedded?: boolean }) {
  const account = detail.account;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(() => {
    if (isTab(initialTab)) {
      if (initialTab === "tests") return "overview";
      return initialTab;
    }
    return "overview";
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [panel, setPanel] = useState<"invite" | "course" | "badge" | "import" | "space" | null>(null);
  const [requestWizardOpen, setRequestWizardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (!account) return null;

  const activeNav = navFromTab(tab);
  const hasAdmin = detail.members.some((member) => member.role === "admin" && member.email.includes("@"));
  const spaceReason = !detail.schemaReady
    ? "L'ouverture d'espace n'est pas encore disponible."
    : !hasAdmin
      ? "Aucun administrateur actif sur ce compte"
      : null;

  function openTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function openNav(nav: NavId) {
    openTab(defaultTabForNav(nav));
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      {embedded ? null : (
      <p className="mb-3 text-sm text-[#8A93AE]">
        <Link href="/super/organisations">Comptes clients</Link> · {account.name}
      </p>
      )}
      <header className="flex flex-wrap items-start justify-between gap-4">
        {embedded ? <div /> : (
        <div>
          <h1 className="text-[36px] font-extrabold tracking-[-1.2px]">{account.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full px-2 py-1" style={{ background: account.status === "active" ? "#163228" : "#3A3118", color: account.status === "active" ? "#6BE39B" : "#F2CF6B" }}>{account.status === "demo" ? "Démo" : account.status === "active" ? "Actif" : "À configurer"}</span>
            <span className="rounded-full bg-[#1A2340] px-2 py-1 text-[#C9D2E8]">{account.kind === "demo" ? "Démo" : account.kind === "internal" ? "Interne" : "Entreprise"}</span>
            {account.clientSince ? <span className="rounded-full bg-[#1A2340] px-2 py-1 text-[#C9D2E8]">Client depuis {new Date(account.clientSince).toLocaleDateString("fr-FR")}</span> : null}
            <span className="rounded-full bg-[#1A2340] px-2 py-1 text-[#C9D2E8]">{account.accountManagerName ?? "Chargé de compte non assigné"}</span>
            <span className="rounded-full border border-[#6E5BFF]/55 bg-[#6E5BFF]/20 px-2.5 py-1 font-semibold text-[#E8DEFF]">
              CA 12 mois · {formatEurosHt(account.revenue12HtCents)} HT
            </span>
          </div>
        </div>
        )}
        <div className="flex flex-wrap gap-2">
          {detail.members.find((member) => member.role === "admin" && member.email)?.email ? (
            <a className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]" href={`mailto:${detail.members.find((member) => member.role === "admin")?.email}`}>Contacter l&apos;admin</a>
          ) : (
            <DisabledTip label="Contacter l'admin" reason="Aucun administrateur actif sur ce compte" />
          )}
          <button
            type="button"
            onClick={() => setRequestWizardOpen(true)}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            Nouvelle demande formation
          </button>
          <span className="relative">
            <button type="button" onClick={() => setActionsOpen((value) => !value)} className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]">Plus</button>
            {actionsOpen ? (
              <span className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[#26304F] bg-[#111831] p-2 text-sm">
                <button type="button" className="block w-full rounded-xl px-2 py-1.5 text-left" onClick={() => { setActionsOpen(false); setPanel("invite"); }}>Inviter</button>
                <button type="button" className="block w-full rounded-xl px-2 py-1.5 text-left" onClick={() => { setActionsOpen(false); setPanel("course"); openTab("courses"); }}>Accès LMS</button>
                <button type="button" className="block w-full rounded-xl px-2 py-1.5 text-left" onClick={() => { setActionsOpen(false); setPanel("badge"); }}>Créer un Open Badge</button>
              </span>
            ) : null}
          </span>
          {spaceReason ? (
            <DisabledTip label="Ouvrir son espace" reason={spaceReason} />
          ) : (
            <button
              type="button"
              onClick={() => setPanel("space")}
              className="rounded-full border border-[#6E5BFF]/60 bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              Ouvrir son espace
            </button>
          )}
        </div>
      </header>

      <TabBar
        nav={activeNav}
        tab={tab}
        counts={tabCounts(detail)}
        onNavChange={openNav}
        onTabChange={openTab}
      />
      {notice ? <p className="mt-4 text-sm text-[#6BE39B]">{notice}</p> : null}

      {tab === "overview" ? (
        <Overview
          detail={detail}
          onNewRequest={() => setRequestWizardOpen(true)}
          onOpenDossiers={() => openTab("dossiers")}
          onOpenSurMesure={() => openTab("surmesure")}
          onOpenLms={() => openTab("courses")}
          onOpenRevenue={() => openTab("revenue")}
          onOpenSaas={() => openTab("modules")}
        />
      ) : null}
      {tab === "members" ? <MembersTab detail={detail} onInvite={() => setPanel("invite")} onImport={() => setPanel("import")} onNotice={setNotice} /> : null}
      {tab === "courses" ? <CoursesTab detail={detail} onAssign={() => setPanel("course")} /> : null}
      {tab === "dossiers" ? (
        <FormationDossiersTab
          organizationId={account.id}
          onNewRequest={() => setRequestWizardOpen(true)}
        />
      ) : null}
      {tab === "surmesure" ? (
        <AccountSurMesureTab organizationId={account.id} organizationName={account.name} />
      ) : null}
      {tab === "badges" ? <BadgesTab detail={detail} onCreate={() => setPanel("badge")} /> : null}
      {tab === "revenue" ? <RevenueTab detail={detail} /> : null}
      {tab === "funding" ? <EmptyState title="Aucun dossier de financement pour ce compte." /> : null}
      {tab === "documents" ? <AccountQualiopiCoffre organizationId={account.id} /> : null}
      {tab === "modules" ? <SaasOffersTab orgId={account.id} modules={account.modules} /> : null}
      {tab === "journal" ? <JournalTab detail={detail} name={account.name} /> : null}

      {panel === "invite" ? <InvitePanel orgId={account.id} courses={detail.catalogue} onClose={() => setPanel(null)} onDone={(message) => { setNotice(message); router.refresh(); }} /> : null}
      {panel === "course" ? <AssignPanel orgId={account.id} courses={detail.catalogue} people={detail.people} onClose={() => setPanel(null)} onDone={(message) => { setNotice(message); router.refresh(); }} /> : null}
      {panel === "badge" ? <BadgePanel orgId={account.id} onClose={() => setPanel(null)} onDone={(message) => { setNotice(message); router.refresh(); }} /> : null}
      {panel === "import" ? <ImportPanel orgId={account.id} onClose={() => setPanel(null)} onDone={(message) => { setNotice(message); router.refresh(); }} /> : null}
      {panel === "space" ? <SpaceDialog orgId={account.id} orgName={account.name} onClose={() => setPanel(null)} /> : null}
      {requestWizardOpen ? (
        <AccountFormationRequestWizard
          orgId={account.id}
          orgName={account.name}
          contactEmail={detail.members.find((m) => m.role === "admin" && m.email.includes("@"))?.email}
          contactName={detail.members.find((m) => m.role === "admin")?.name}
          orgAddress={{
            addressLine: account.addressLine,
            addressZip: account.addressZip,
            addressCity: account.addressCity,
            siret: account.siret,
          }}
          people={detail.people}
          onClose={() => setRequestWizardOpen(false)}
          onDone={(message) => {
            setNotice(message);
            openTab("dossiers");
            router.refresh();
          }}
          onAddressSaved={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}

function isTab(value: string | undefined): value is Tab {
  return Boolean(value && LEGACY_TAB_IDS.includes(value as Tab));
}

function tabCounts(detail: Detail): Partial<Record<Tab | NavId, number>> {
  return {
    members: detail.people.length,
    courses: detail.courses.length,
    badges: detail.badges.length || detail.assertions.length,
    formations:
      detail.courses.length + (detail.badges.length || detail.assertions.length),
  };
}

function TabBar({
  nav,
  tab,
  counts,
  onNavChange,
  onTabChange,
}: {
  nav: NavId;
  tab: Tab;
  counts: Partial<Record<Tab | NavId, number>>;
  onNavChange: (nav: NavId) => void;
  onTabChange: (tab: Tab) => void;
}) {
  const subItems = nav === "formations" ? FORMATIONS_SUB : nav === "revenue" ? REVENUE_SUB : null;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex min-w-0 flex-wrap items-end gap-1 border-b border-[#1A2340]">
        {NAV_ITEMS.map((item) => {
          const active = nav === item.id;
          const count =
            item.id === "formations"
              ? counts.formations
              : item.id === "members"
                ? counts.members
                : undefined;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              className="px-3 py-2 text-[13px] font-extrabold"
              style={{
                color: active ? "#fff" : "#8A93AE",
                boxShadow: active ? "inset 0 -2px 0 #8B7BFF" : undefined,
              }}
            >
              {item.label}
              {count != null ? (
                <span
                  className="ml-1.5 rounded-full px-1.5 text-[11px]"
                  style={{ background: active ? "#6E5BFF" : "#1A2340", color: "#fff" }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {subItems ? (
        <div className="flex flex-wrap gap-1">
          {subItems.map((item) => {
            const active = tab === item.id;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  background: active ? "#6E5BFF" : "#151C33",
                  color: active ? "#fff" : "#C9D2E8",
                  border: active ? "1px solid transparent" : "1px solid #3A4668",
                }}
              >
                {item.label}
                {count != null ? <span className="ml-1.5 opacity-80">{count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Overview({
  detail,
  onNewRequest,
  onOpenDossiers,
  onOpenSurMesure,
  onOpenLms,
  onOpenRevenue,
  onOpenSaas,
}: {
  detail: Detail;
  onNewRequest: () => void;
  onOpenDossiers: () => void;
  onOpenSurMesure: () => void;
  onOpenLms: () => void;
  onOpenRevenue: () => void;
  onOpenSaas: () => void;
}) {
  const account = detail.account;
  if (!account) return null;
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[28px] border border-[#6E5BFF]/45 bg-[#17122E] p-5 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">Formation Qualiopi</p>
          <h2 className="mt-2 text-lg font-extrabold">Nouvelle demande</h2>
          <p className="mt-2 text-sm text-[#C9D2E8]">
            Catalogue ou Sur-mesure → participants → dates / lieu → devis &amp; convention.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onNewRequest}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
            >
              Nouvelle demande
            </button>
            <button
              type="button"
              onClick={onOpenDossiers}
              className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
            >
              Voir les dossiers
            </button>
            <button
              type="button"
              onClick={onOpenSurMesure}
              className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
            >
              Sur-mesure
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93AE]">Accès LMS</p>
          <h2 className="mt-2 text-lg font-extrabold">Parcours digitaux</h2>
          <p className="mt-2 text-sm text-[#C9D2E8]">
            Assigner aux collabs ou mettre à disposition du dashboard entreprise.
          </p>
          <p className="mt-3 text-xs text-[#8A93AE]">
            {detail.courses.length} formation(s) liée(s) · {detail.catalogue.length} au catalogue
          </p>
          <button
            type="button"
            onClick={onOpenLms}
            className="mt-4 rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
          >
            Gérer les accès LMS
          </button>
        </section>

        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93AE]">SaaS</p>
          <h2 className="mt-2 text-lg font-extrabold">Accès produits</h2>
          <p className="mt-2 text-sm text-[#C9D2E8]">
            Ouvrir ou restreindre Byound Recruit, Byound LMS et Byound Care pour ce compte.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenSaas}
              className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
            >
              Gérer le SaaS
            </button>
            <button
              type="button"
              onClick={onOpenRevenue}
              className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
            >
              Voir le CA
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Utilisateurs actifs" value={`${account.activeUsers} / ${account.totalUsers}`} />
        <KpiCard label="Formations LMS" value={String(detail.courses.length)} />
        <KpiCard label="Open Badges" value={String(detail.assertions.length)} />
        <KpiCard label="CA 12 mois" value={formatEurosHt(account.revenue12HtCents)} />
      </div>

      <OrgAddressCard account={account} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
        <RevenueBlock documents={detail.documents} fallbackCents={account.revenue12HtCents} />
        <NoteForm orgId={account.id} initial={detail.note?.body ?? ""} />
      </div>
    </div>
  );
}

function OrgAddressCard({ account }: { account: NonNullable<Detail["account"]> }) {
  const router = useRouter();
  const [line, setLine] = useState(account.addressLine ?? "");
  const [zip, setZip] = useState(account.addressZip ?? "");
  const [city, setCity] = useState(account.addressCity ?? "");
  const [siret, setSiret] = useState(account.siret ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const complete = Boolean(account.addressLine && account.addressZip && account.addressCity);

  return (
    <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Adresse postale</h2>
          <p className="mt-1 text-sm text-[#8A93AE]">
            Requise pour les devis et les sessions « chez le client ».
          </p>
        </div>
        <span
          className="rounded-full px-2 py-1 text-xs font-semibold"
          style={{
            background: complete ? "#163228" : "#3A3118",
            color: complete ? "#6BE39B" : "#F2CF6B",
          }}
        >
          {complete ? "Renseignée" : "À compléter"}
        </span>
      </div>
      <form
        className="mt-4 grid gap-3 md:grid-cols-[1.4fr_100px_1fr]"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setMsg(null);
          try {
            const res = await fetch(`/api/super/comptes-clients/${account.id}/address`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address_line: line.trim(),
                address_zip: zip.trim(),
                address_city: city.trim(),
                siret: siret.replace(/\D/g, "") || undefined,
              }),
            });
            const json = (await res.json()) as { error?: string };
            if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
            setMsg("Adresse enregistrée.");
            router.refresh();
          } catch (error) {
            setMsg(error instanceof Error ? error.message : "Enregistrement impossible");
          } finally {
            setSaving(false);
          }
        }}
      >
        <Field label="Adresse">
          <BanAddressAutocomplete
            value={line}
            onChange={setLine}
            onSelect={(hit) => {
              setLine(hit.addressLine);
              setZip(hit.addressZip);
              setCity(hit.addressCity);
            }}
            className={fieldClass}
          />
        </Field>
        <Field label="CP">
          <input value={zip} onChange={(e) => setZip(e.target.value)} className={fieldClass} required />
        </Field>
        <Field label="Ville">
          <input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} required />
        </Field>
        <div className="md:col-span-3">
          <Field label="SIRET">
            <input
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className={fieldClass}
              placeholder="14 chiffres"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3 md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer l'adresse"}
          </button>
          {msg ? <p className="text-sm text-[#8A93AE]">{msg}</p> : null}
        </div>
      </form>
    </section>
  );
}

function MembersTab({ detail, onInvite, onImport, onNotice }: { detail: Detail; onInvite: () => void; onImport: () => void; onNotice: (message: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const people = detail.people.filter((person) => {
    if (filter === "admins" && roleTone(person.role) !== "admin") return false;
    if (filter === "tutors" && !person.isTutor) return false;
    if (filter === "invites" && !person.invited) return false;
    if (filter === "staff" && (person.invited || roleTone(person.role) === "admin")) return false;
    return `${person.name} ${person.email}`.toLowerCase().includes(query.toLowerCase());
  });
  const shown = expanded ? people : people.slice(0, 8);
  const pending = detail.people.filter((person) => person.invited).length;
  const inTraining = detail.people.filter((person) => person.formationsTotal > 0).length;
  const withBadge = detail.people.filter((person) => person.badges > 0).length;
  const activeKnown = detail.people.some((person) => person.lastSeenAt);
  const active = detail.people.filter((person) => person.lastSeenAt && !person.invited).length;
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter
          value={filter}
          onChange={setFilter}
          items={[
            { id: "all", label: "Tous", count: detail.people.length },
            { id: "staff", label: "Collaborateurs", count: detail.people.filter((person) => !person.invited && roleTone(person.role) === "member").length },
            { id: "admins", label: "Administrateurs", count: detail.people.filter((person) => roleTone(person.role) === "admin").length },
            { id: "tutors", label: "Tuteurs", count: detail.people.filter((person) => person.isTutor).length },
            { id: "invites", label: "Invitations", count: pending },
          ]}
        />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un membre" className="ml-auto rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm" />
        <button type="button" onClick={onImport} className="rounded-full border border-[#26304F] px-4 py-2 text-sm">Importer</button>
        <button type="button" onClick={onInvite} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">Inviter</button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Actifs ce mois" value={activeKnown ? `${active} / ${detail.people.length || 0}` : "—"} />
        <KpiCard label="Invitations en attente" value={String(pending)} />
        <KpiCard label="En formation" value={String(inTraining)} />
        <KpiCard label="Avec au moins un badge" value={String(withBadge)} />
      </div>
      {people.length === 0 ? <EmptyState title="Aucun membre pour ce filtre." action={<button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]" onClick={onInvite}>Inviter un membre</button>} /> : (
        <div className="overflow-hidden rounded-[28px] border border-[#1A2340] bg-[#111831]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,.7fr)_minmax(0,.9fr)_auto] px-4 py-3 text-[13px] text-[#6C7593]">
            <span>Membre</span><span>Rôle</span><span>Formations</span><span>Open Badges</span><span>Dernière connexion</span><span />
          </div>
          {shown.map((person) => {
            const tone = person.invited ? ROLE_COLORS.invited : ROLE_COLORS[roleTone(person.role)];
            const tutorTone = ROLE_COLORS.tutor;
            const ratio = person.formationsTotal ? Math.round((person.formationsDone / person.formationsTotal) * 100) : 0;
            return (
              <div key={person.userId} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,.7fr)_minmax(0,.9fr)_auto] items-center gap-2 border-t border-[#1A2340] px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="mr-2 inline-grid h-9 w-9 place-items-center rounded-full bg-[#6E5BFF] text-xs font-bold">{initials(person.name)}</span>
                  <span className="font-semibold">{person.name}</span>
                  <span className="block truncate pl-11 text-xs text-[#8A93AE]">{person.email}</span>
                </span>
                <span className="flex flex-wrap gap-1">
                  <span className="w-fit rounded-full px-2 py-1 text-xs" style={{ background: tone.bg, color: tone.fg }}>
                    {person.invited ? "Invité" : roleLabel(person.role)}
                  </span>
                  {person.isTutor ? (
                    <span className="w-fit rounded-full px-2 py-1 text-xs" style={{ background: tutorTone.bg, color: tutorTone.fg }}>
                      Tuteur
                    </span>
                  ) : null}
                </span>
                <span>{person.formationsTotal ? <>{person.formationsDone} / {person.formationsTotal} terminées<span className="mt-1 block h-1.5 rounded-full bg-[#1A2340]"><span className="block h-1.5 rounded-full bg-[#6E5BFF]" style={{ width: `${ratio}%` }} /></span></> : "Aucune"}</span>
                <span>{person.badges ? `${person.badges} badge${person.badges > 1 ? "s" : ""}` : "—"}</span>
                <span className="text-xs" style={{ color: person.invited ? "#F2CF6B" : "#C9D2E8" }}>{person.invited && person.createdAt ? `Invité le ${new Date(person.createdAt).toLocaleDateString("fr-FR")}` : "—"}</span>
                <span className="relative flex gap-2">
                  {person.invited ? <button type="button" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0A0F1E]" onClick={() => void memberAction(detail.account?.id, { action: "remind", email: person.email, employeeId: person.employeeId }, onNotice)}>Relancer</button> : <span className="rounded-full border border-[#26304F] px-3 py-1 text-xs">Voir</span>}
                  <button type="button" aria-label="Actions" onClick={() => setMenu(menu === person.userId ? null : person.userId)}>⋯</button>
                  {menu === person.userId ? (
                    <span className="absolute right-0 top-8 z-10 w-48 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-xs">
                      {person.userId.startsWith("employee:") ? null : (
                        <>
                          {(["admin", "learner"] as const).map((role) => (
                            <button key={role} type="button" className="block w-full rounded-xl px-2 py-1 text-left" onClick={() => void memberAction(detail.account?.id, { action: "role", userId: person.userId, role }, onNotice)}>{roleLabel(role)}</button>
                          ))}
                          <button
                            type="button"
                            className="block w-full rounded-xl px-2 py-1 text-left"
                            onClick={() =>
                              void memberAction(
                                detail.account?.id,
                                {
                                  action: "toggle_tutor",
                                  userId: person.userId,
                                  enabled: person.isTutor ? "false" : "true",
                                },
                                onNotice,
                              )
                            }
                          >
                            {person.isTutor ? "Retirer le rôle tuteur" : "Ajouter le rôle tuteur"}
                          </button>
                        </>
                      )}
                      <button type="button" className="block w-full rounded-xl px-2 py-1 text-left" onClick={() => void memberAction(detail.account?.id, { action: "deactivate", employeeId: person.employeeId }, onNotice)}>Désactiver</button>
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between border-t border-[#1A2340] px-4 py-3 text-xs text-[#8A93AE]">
            <span>{shown.length} sur {people.length} membres</span>
            {people.length > 8 && !expanded ? <button type="button" onClick={() => setExpanded(true)}>Voir tout</button> : null}
          </div>
        </div>
      )}
    </div>
  );
}

async function memberAction(
  orgId: string | undefined,
  body: Record<string, string | boolean | null>,
  onNotice: (message: string) => void,
) {
  if (!orgId) return;
  const payload = { ...body };
  if (payload.enabled === "true") payload.enabled = true;
  if (payload.enabled === "false") payload.enabled = false;
  const response = await fetch(`/api/super/comptes-clients/${orgId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await response.json()) as { error?: string };
  onNotice(response.ok ? "Membre mis à jour." : json.error || "Action impossible");
  if (response.ok && typeof window !== "undefined") {
    window.location.reload();
  }
}

function CoursesTab({ detail, onAssign }: { detail: Detail; onAssign: () => void }) {
  const [filter, setFilter] = useState("running");
  const assigned = detail.courses;
  const rows = filter === "catalog" ? detail.catalogue : assigned.filter((course) => {
    if (filter === "upcoming") return course.status === "draft";
    if (filter === "done") return course.status === "archived" || course.status === "completed";
    return course.status !== "draft" && course.status !== "archived" && course.status !== "completed";
  });
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter value={filter} onChange={setFilter} items={[
          { id: "running", label: "En cours", count: assigned.filter((course) => course.status !== "draft").length },
          { id: "upcoming", label: "À venir", count: assigned.filter((course) => course.status === "draft").length },
          { id: "done", label: "Terminées", count: assigned.filter((course) => course.status === "archived" || course.status === "completed").length },
          { id: "catalog", label: "Catalogue disponible", count: detail.catalogue.length },
        ]} />
        {detail.catalogue.length === 0 ? (
          <span className="ml-auto"><DisabledTip label="Assigner une formation" reason="Aucune formation disponible pour ce compte" /></span>
        ) : (
          <button type="button" className="ml-auto rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white" onClick={() => onAssign()}>Assigner une formation</button>
        )}
      </div>
      {rows.length === 0 ? <EmptyState title={filter === "catalog" ? "Aucune formation disponible à assigner." : "Aucune formation assignée à ce compte."} action={detail.catalogue.length ? <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]" onClick={onAssign}>Assigner une formation</button> : undefined} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((course) => {
            const enrolled = "enrolled" in course ? course.enrolled : 0;
            const badges = "badges" in course ? course.badges : 0;
            return (
              <article key={course.id} className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-4">
                <div className="mb-3 grid h-28 place-items-center rounded-3xl text-2xl font-extrabold" style={{ background: course.cover ? `center/cover url(${course.cover})` : "linear-gradient(135deg,#241C3E,#6E5BFF)" }}>{course.cover ? "" : initials(course.title)}</div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full bg-[#1A2340] px-2 py-1">{course.status === "draft" ? "À venir" : course.status === "archived" || course.status === "completed" ? "Terminée" : "En cours"}</span>
                    {course.format ? <span className="rounded-full bg-[#1A2340] px-2 py-1">{course.format}</span> : null}
                  </div>
                  {filter !== "catalog" ? (
                    <CourseMenu orgId={detail.account?.id} courseId={course.id} onAssign={onAssign} />
                  ) : null}
                </div>
                <h3 className="mt-2 font-extrabold">{course.title}</h3>
                <p className="text-xs text-[#8A93AE]">{[course.format, course.duration].filter(Boolean).join(" · ") || "Formation Byound"}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <span className="rounded-2xl bg-[#0B1122] p-2">{enrolled}<br />Inscrits</span>
                  <span className="rounded-2xl bg-[#0B1122] p-2">0 / {enrolled || 0}<br />Terminé</span>
                  <span className="rounded-2xl bg-[#0B1122] p-2">{badges}<br />Badges</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BadgesTab({ detail, onCreate }: { detail: Detail; onCreate: () => void }) {
  const [filter, setFilter] = useState("delivered");
  const cards = detail.badges.filter((badge) => {
    if (filter === "revoked") return badge.revoked > 0;
    if (filter === "fix") return badge.toFix > 0;
    if (filter === "progress") return badge.inProgress > 0;
    return true;
  });
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter value={filter} onChange={setFilter} items={[
          { id: "delivered", label: "Délivrés", count: detail.assertions.length },
          { id: "progress", label: "En évaluation", count: detail.badges.reduce((sum, badge) => sum + badge.inProgress, 0) },
          { id: "fix", label: "À corriger", count: detail.badges.reduce((sum, badge) => sum + badge.toFix, 0) },
          { id: "revoked", label: "Révoqués", count: detail.badges.reduce((sum, badge) => sum + badge.revoked, 0) },
        ]} />
        <button type="button" onClick={onCreate} className="ml-auto rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">Créer un Open Badge</button>
      </div>
      {cards.length === 0 && detail.assertions.length === 0 ? <EmptyState title="Aucun badge délivré pour l'instant." action={<button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]" onClick={onCreate}>Délivrer un premier badge</button>} /> : cards.length === 0 ? null : (
        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((badge) => (
            <article key={badge.id} className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-4">
              <div className="mx-auto max-w-[240px]"><MetalBadgeCard titre={badge.title} titulaire={detail.account?.name ?? "Byound"} date="" /></div>
              <p className="mt-3 text-sm">{badge.competencies} compétences</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <span className="rounded-2xl bg-[#163228] p-2 text-[#6BE39B]">{badge.delivered}<br />Délivrés</span>
                <span className="rounded-2xl bg-[#1A2340] p-2">{badge.inProgress}<br />En cours</span>
                <span className="rounded-2xl bg-[#3A3118] p-2 text-[#F2CF6B]">{badge.toFix}<br />À corriger</span>
              </div>
            </article>
          ))}
        </div>
      )}
      {detail.assertions.length > 0 ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="font-extrabold">Derniers badges délivrés</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {detail.assertions.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-t border-[#1A2340] pt-3">
                <span>
                  {item.holder} · {item.badge}
                  <span className="block text-xs text-[#8A93AE]">{new Date(item.issuedAt).toLocaleDateString("fr-FR")}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-[#1A2340] px-2 py-1 text-xs">{item.isPublic ? "Public" : "Privé"}</span>
                  <a className="text-xs text-[#8DB8FF]" href={`/badges/${item.id}`}>Vérifier</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RevenueTab({ detail }: { detail: Detail }) {
  const [filter, setFilter] = useState("invoice");
  const docs = detail.documents.filter((doc) => doc.doc_type === (filter === "invoice" ? "invoice" : filter === "quote" ? "quote" : "credit_note"));
  const csv = ["type,numero,date,ht,statut", ...detail.documents.map((doc) => [doc.doc_type, doc.number ?? "", doc.issued_at, (Number(doc.amount_ht_cents) / 100).toFixed(2), doc.status].join(","))].join("\n");
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter value={filter} onChange={setFilter} items={[
          { id: "invoice", label: "Factures", count: detail.documents.filter((doc) => doc.doc_type === "invoice").length },
          { id: "quote", label: "Devis", count: detail.documents.filter((doc) => doc.doc_type === "quote").length },
          { id: "credit", label: "Avoirs", count: detail.documents.filter((doc) => doc.doc_type === "credit_note").length },
        ]} />
        <a className="ml-auto rounded-full border border-[#26304F] px-4 py-2 text-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="chiffre-affaires.csv">Exporter CSV</a>
      </div>
      <RevenueBlock documents={detail.documents} fallbackCents={detail.account?.revenue12HtCents ?? 0} />
      {docs.length === 0 ? <EmptyState title="Aucune facture pour ce compte." /> : (
        <div className="overflow-hidden rounded-[28px] border border-[#1A2340] bg-[#111831]">
          <div className="grid grid-cols-[.6fr_1.4fr_.7fr_.7fr_.7fr_auto] px-4 py-3 text-[13px] text-[#6C7593]">
            <span>N°</span><span>Objet</span><span>Émise le</span><span className="text-right">Montant HT</span><span>Statut</span><span />
          </div>
          {docs.map((doc) => (
            <div key={doc.id} className="grid grid-cols-[.6fr_1.4fr_.7fr_.7fr_.7fr_auto] items-center gap-2 border-t border-[#1A2340] px-4 py-3 text-sm">
              <span>{doc.number || "—"}</span>
              <span>{doc.sale_type || doc.doc_type}</span>
              <span>{new Date(doc.issued_at).toLocaleDateString("fr-FR")}</span>
              <span className="text-right">{formatEurosHt(Number(doc.amount_ht_cents))}</span>
              <InvoiceStatus status={doc.status} paidByOpco={Number(doc.opco_ht_cents ?? 0) > 0 && Boolean(doc.paid_at)} />
              <span>{doc.doc_type === "invoice" && !doc.paid_at ? <Remind id={String(doc.id)} /> : null}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RevenueBlock({ documents, fallbackCents }: { documents: Detail["documents"]; fallbackCents: number }) {
  const [range, setRange] = useState<"3" | "12" | "all">("12");
  const summary = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    if (range === "3") from.setUTCMonth(from.getUTCMonth() - 3);
    else if (range === "12") from.setUTCMonth(from.getUTCMonth() - 12);
    else from.setUTCFullYear(from.getUTCFullYear() - 20);
    const docs: BillingDoc[] = documents.map((doc) => ({
      orgId: "current",
      docType: doc.doc_type as BillingDoc["docType"],
      status: doc.status as BillingDoc["status"],
      issuedAt: doc.issued_at,
      dueAt: doc.due_at,
      paidAt: doc.paid_at,
      amountHtCents: Number(doc.amount_ht_cents ?? 0),
      saleType: (doc.sale_type as BillingDoc["saleType"]) ?? null,
      opcoHtCents: Number(doc.opco_ht_cents ?? 0),
    }));
    return summarizeRevenue(docs, [{ id: "current", kind: "client", status: "active" }], from.toISOString(), now.toISOString(), "current", now.toISOString());
  }, [documents, range]);
  const hasInvoices = documents.some((doc) => doc.doc_type === "invoice");
  const amount = hasInvoices ? summary.periodHtCents : range === "12" ? fallbackCents : 0;
  return (
    <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-[#8A93AE]">Chiffre d'affaires HT</p>
          <p className="text-3xl font-extrabold">{formatEurosHt(amount)}</p>
          {hasInvoices ? <p className="text-sm text-[#6BE39B]">{formatEuroDelta(summary.deltaHtCents)}</p> : null}
        </div>
        <SegmentedFilter value={range} onChange={(id) => setRange(id as "3" | "12" | "all")} items={[{ id: "3", label: "3 mois" }, { id: "12", label: "12 mois" }, { id: "all", label: "Total" }]} />
      </div>
      {hasInvoices ? (
        <>
          <div className="mt-4 flex h-24 items-end gap-2">
            {summary.byMonth.map((month) => {
              const max = Math.max(...summary.byMonth.map((item) => item.htCents), 1);
              const current = month.month === new Date().toISOString().slice(0, 7);
              return <span key={month.month} className="flex-1 rounded-t-lg" style={{ height: `${Math.max(8, (month.htCents / max) * 100)}%`, background: current ? "repeating-linear-gradient(135deg,#6E5BFF,#6E5BFF 4px,#241C3E 4px,#241C3E 8px)" : "#6E5BFF" }} title={month.month} />;
            })}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <KpiCard label="Encaissé" value={formatEurosHt(summary.collectedHtCents)} />
            <KpiCard label="À encaisser" value={formatEurosHt(summary.outstandingHtCents)} />
            <KpiCard label="Devis en cours" value={formatEurosHt(summary.quotesHtCents)} />
            <KpiCard label="Financé par l'OPCO" value={formatEurosHt(summary.opcoHtCents)} />
          </div>
        </>
      ) : <p className="mt-4 text-sm text-[#8A93AE]">0 € HT. Aucune facture n'est rattachée à ce compte.</p>}
    </section>
  );
}

function SaasOffersTab({ orgId, modules }: { orgId: string; modules: string[] }) {
  const initialFeatures = ["beyond_connect", "beyond_lms", "beyond_care"].map((feature_key) => ({
    feature_key,
    is_enabled:
      feature_key === "beyond_care"
        ? modules.includes("beyond_care") || modules.includes("mental_health_tracking")
        : modules.includes(feature_key),
  }));

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-extrabold">Accès SaaS du compte</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#8A93AE]">
          Activez ou restreignez Byound Recruit, Byound LMS et Byound Care pour ce client.
          Les collaborateurs n&apos;y accèdent que si le produit est ouvert ici.
        </p>
        <div className="mt-4 [&_div]:border-[#26304F] [&_div]:bg-[#0B1122] [&_p.text-sm]:text-white [&_p.text-xs]:text-[#8A93AE]">
          <OrganizationFeaturesPanel orgId={orgId} initialFeatures={initialFeatures} />
        </div>
      </section>
    </div>
  );
}

function JournalTab({ detail, name }: { detail: Detail; name: string }) {
  const emails = detail.outboundEmails ?? [];
  const actions = detail.activity ?? [];
  if (!emails.length && !actions.length) {
    return <div className="mt-5"><EmptyState title="Aucune action ni e-mail enregistré pour ce compte." /></div>;
  }
  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-extrabold">E-mails envoyés</h2>
        <p className="mt-1 text-sm text-[#8A93AE]">
          Devis, conventions, convocations, factures, présentations… avec indicateur d&apos;ouverture.
        </p>
        <OutboundEmailList items={emails} />
      </section>
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-extrabold">Actions</h2>
        <JournalList items={actions} name={name} />
      </section>
    </div>
  );
}

function openBadge(email: NonNullable<Detail["outboundEmails"]>[number]) {
  if (email.status === "ouvert" || email.openedAt) {
    return {
      label: email.tracked ? "Ouvert" : "Lien ouvert",
      bg: "#163228",
      fg: "#6BE39B",
      detail: email.openedAt
        ? new Date(email.openedAt).toLocaleString("fr-FR")
        : null,
    };
  }
  if (email.status === "rejeté") {
    return { label: "Rejeté", bg: "#3A1820", fg: "#FF8A9B", detail: null };
  }
  if (email.status === "délivré" || email.deliveredAt) {
    return { label: "Non ouvert", bg: "#3A3118", fg: "#F2CF6B", detail: "Délivré" };
  }
  if (!email.tracked) {
    return { label: "Ouverture non suivie", bg: "#1A2340", fg: "#8A93AE", detail: null };
  }
  return { label: "Non ouvert", bg: "#3A3118", fg: "#F2CF6B", detail: "Envoyé" };
}

function OutboundEmailList({ items }: { items: NonNullable<Detail["outboundEmails"]> }) {
  if (!items.length) {
    return <p className="mt-4 text-sm text-[#8A93AE]">Aucun e-mail enregistré pour l&apos;instant.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {items.map((email) => {
        const badge = openBadge(email);
        return (
          <li
            key={email.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#26304F] bg-[#0B1122] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1A2340] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#C4B8FF]">
                  {email.label}
                </span>
                <span className="text-sm font-semibold text-white">{email.subject}</span>
              </div>
              <p className="mt-1 text-sm text-[#C9D2E8]">
                À {email.toEmail} · {new Date(email.sentAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="text-right">
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: badge.bg, color: badge.fg }}
              >
                {badge.label}
              </span>
              {badge.detail ? (
                <p className="mt-1 text-[11px] text-[#8A93AE]">{badge.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function JournalList({ items, name }: { items: Detail["activity"]; name: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-[#8A93AE]">Aucune action enregistrée.</p>;
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id}><span className="text-[#C4B8FF]">{item.actor_type === "byound_on_behalf" ? `Byound pour ${name}` : "Client"}</span> · {item.action} · {new Date(item.created_at).toLocaleString("fr-FR")}</li>
      ))}
    </ul>
  );
}

function CourseMenu({ orgId, courseId, onAssign }: { orgId: string | undefined; courseId: string; onAssign: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" aria-label="Actions de la formation" onClick={() => setOpen((value) => !value)}>⋯</button>
      {open ? (
        <span className="absolute right-0 z-10 mt-1 w-48 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-xs">
          <button type="button" className="block w-full rounded-xl px-2 py-1 text-left" onClick={onAssign}>Ajouter des participants</button>
          <span className="block px-2 py-1 text-[#8A93AE]" title="Aucune session planifiée pour cette formation">Émargements</span>
          <button type="button" className="block w-full rounded-xl px-2 py-1 text-left" onClick={() => {
            if (!orgId) return;
            void fetch(`/api/super/comptes-clients/${orgId}/assign-course`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", courseId }) }).then(() => router.refresh());
            setOpen(false);
          }}>Retirer du compte</button>
        </span>
      ) : null}
    </span>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "B";
}

function NoteForm({ orgId, initial }: { orgId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <form className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5" onSubmit={async (event) => {
      event.preventDefault();
      const response = await fetch(`/api/super/comptes-clients/${orgId}/note`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const json = (await response.json()) as { error?: string };
      setSaved(response.ok ? "Note enregistrée." : json.error || "Note impossible");
    }}>
      <h2 className="font-extrabold">Note interne</h2>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} className={`${fieldClass} mt-3 min-h-28`} />
      <button type="submit" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Enregistrer</button>
      {saved ? <p className="mt-2 text-xs text-[#8A93AE]">{saved}</p> : null}
    </form>
  );
}

function InvoiceStatus({ status, paidByOpco }: { status: string; paidByOpco: boolean }) {
  const label = paidByOpco ? "Payée par l'OPCO" : status === "paid" ? "Payée" : status === "overdue" ? "En retard" : status === "issued" ? "À échéance" : status;
  const color = paidByOpco ? "#C4B8FF" : status === "paid" ? "#6BE39B" : status === "overdue" ? "#FF8A9B" : "#F2CF6B";
  return <span style={{ color }}>{label}</span>;
}

function Remind({ id }: { id: string }) {
  const [label, setLabel] = useState("Envoyer un rappel");
  return <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-xs" onClick={async () => {
    const response = await fetch(`/api/super/comptes-clients/remind/${id}`, { method: "POST" });
    setLabel(response.ok ? "Rappel envoyé" : "Rappel impossible");
  }}>{label}</button>;
}

function InvitePanel({ orgId, courses, onClose, onDone }: { orgId: string; courses: Detail["catalogue"]; onClose: () => void; onDone: (message: string) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("learner");
  const [courseId, setCourseId] = useState("");
  return (
    <SidePanel title="Inviter" onClose={onClose}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/super/comptes-clients/${orgId}/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email, role, courseId: courseId || undefined }) });
        const json = (await response.json()) as { error?: string };
        if (!response.ok) return onDone(json.error || "Invitation impossible");
        onDone(courseId ? "Invitation envoyée. La formation est assignée si la personne a déjà un compte." : "Invitation envoyée.");
        onClose();
      }}>
        <Field label="E-mail"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></Field>
        <Field label="Prénom"><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass} /></Field>
        <Field label="Nom"><input required value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass} /></Field>
        <Field label="Rôle"><select value={role} onChange={(event) => setRole(event.target.value)} className={fieldClass}><option value="learner">Collaborateur</option><option value="admin">Administrateur</option><option value="tutor">Tuteur</option></select></Field>
        <Field label="Formation à assigner"><select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={fieldClass}><option value="">Aucune</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
        <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Envoyer l'invitation</button>
      </form>
    </SidePanel>
  );
}

function AssignPanel({ orgId, courses, people, onClose, onDone }: { orgId: string; courses: Detail["catalogue"]; people: Detail["people"]; onClose: () => void; onDone: (message: string) => void }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"members" | "company">("members");
  const [saving, setSaving] = useState(false);
  const participants = people.filter((person) => !person.invited && !person.userId.startsWith("employee:"));
  return (
    <SidePanel title="Accès LMS" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!courseId) return;
          setSaving(true);
          try {
            if (mode === "company") {
              const grantLms = await fetch(`/api/super/comptes-clients/${orgId}/grant-lms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId }),
              });
              const grantJson = (await grantLms.json().catch(() => ({}))) as { error?: string };
              if (!grantLms.ok) {
                onDone(grantJson.error || "Mise à disposition impossible");
                return;
              }
              onDone("Formation disponible dans Parcours (dashboard entreprise).");
              onClose();
              return;
            }
            const response = await fetch(`/api/super/comptes-clients/${orgId}/assign-course`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId, userIds: selected }),
            });
            const json = (await response.json()) as { error?: string; created?: number };
            onDone(response.ok ? `${json.created ?? 0} inscription(s) créée(s).` : json.error || "Assignation impossible");
            if (response.ok) onClose();
          } finally {
            setSaving(false);
          }
        }}
      >
        <Field label="Formation LMS">
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={fieldClass}>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </Field>
        <div className="mb-3 grid gap-2">
          <label className="flex items-start gap-2 rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm">
            <input type="radio" checked={mode === "members"} onChange={() => setMode("members")} className="mt-1" />
            <span>
              <span className="font-semibold">Assigner à des collaborateurs</span>
              <span className="mt-0.5 block text-xs text-[#8A93AE]">Accès immédiat pour les profils sélectionnés.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm">
            <input type="radio" checked={mode === "company"} onChange={() => setMode("company")} className="mt-1" />
            <span>
              <span className="font-semibold">Mettre à disposition du compte</span>
              <span className="mt-0.5 block text-xs text-[#8A93AE]">
                Visible dans Parcours sur le dashboard entreprise, pour assignation interne.
              </span>
            </span>
          </label>
        </div>
        {mode === "members" ? (
          <>
            <p className="mb-2 text-sm text-[#8A93AE]">Participants</p>
            <div className="mb-4 max-h-48 space-y-1 overflow-auto">
              {participants.length === 0 ? (
                <p className="text-sm text-[#8A93AE]">Aucun collaborateur actif avec compte.</p>
              ) : (
                participants.map((person) => (
                  <label key={person.userId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(person.userId)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, person.userId]
                            : current.filter((id) => id !== person.userId),
                        )
                      }
                    />
                    {person.name}
                  </label>
                ))
              )}
            </div>
          </>
        ) : null}
        <button
          type="submit"
          disabled={saving || !courseId || (mode === "members" && selected.length === 0)}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
        >
          {mode === "company" ? "Mettre à disposition" : "Assigner"}
        </button>
      </form>
    </SidePanel>
  );
}

function BadgePanel({ orgId, onClose, onDone }: { orgId: string; onClose: () => void; onDone: (message: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <SidePanel title="Créer un Open Badge" onClose={onClose}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/super/comptes-clients/${orgId}/badge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
        const json = (await response.json()) as { error?: string };
        onDone(response.ok ? "Badge créé pour ce compte." : json.error || "Création impossible");
        if (response.ok) onClose();
      }}>
        <Field label="Nom"><input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></Field>
        <Field label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} min-h-24`} /></Field>
        <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Créer le badge</button>
      </form>
    </SidePanel>
  );
}

function ImportPanel({ orgId, onClose, onDone }: { orgId: string; onClose: () => void; onDone: (message: string) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState({ firstName: "", lastName: "", email: "" });
  const [errors, setErrors] = useState<Array<{ line: number; message: string }>>([]);
  const headers = Object.keys(rows[0] ?? {});
  return (
    <SidePanel title="Importer des membres" onClose={onClose}>
      {step === 1 ? (
        <label className="grid h-40 cursor-pointer place-items-center rounded-[28px] border border-dashed border-[#26304F] text-sm text-[#8A93AE]">
          Déposer un fichier .csv ou .xlsx
          <input type="file" accept=".csv,.xlsx" className="hidden" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const sheet = book.Sheets[book.SheetNames[0] ?? ""];
            const parsed = XLSX.utils.sheet_to_json<Record<string, string>>(sheet ?? {}, { defval: "" });
            setRows(parsed);
            const keys = Object.keys(parsed[0] ?? {});
            setMapping({
              firstName: keys.find((key) => /pr[eé]nom|first/i.test(key)) ?? keys[0] ?? "",
              lastName: keys.find((key) => /nom|last/i.test(key) && !/pr[eé]nom/i.test(key)) ?? "",
              email: keys.find((key) => /mail/i.test(key)) ?? "",
            });
            setStep(2);
          }} />
        </label>
      ) : null}
      {step === 2 ? (
        <form onSubmit={(event) => { event.preventDefault(); setStep(3); }}>
          {(["firstName", "lastName", "email"] as const).map((key) => (
            <Field key={key} label={key === "email" ? "E-mail" : key === "firstName" ? "Prénom" : "Nom"}>
              <select value={mapping[key]} onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))} className={fieldClass}>{headers.map((header) => <option key={header}>{header}</option>)}</select>
            </Field>
          ))}
          <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Voir l'aperçu</button>
        </form>
      ) : null}
      {step === 3 ? (
        <form onSubmit={async (event) => {
          event.preventDefault();
          const payload = rows.map((row) => ({ firstName: row[mapping.firstName], lastName: row[mapping.lastName], email: row[mapping.email] }));
          const response = await fetch(`/api/super/comptes-clients/${orgId}/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: payload }) });
          const json = (await response.json()) as { created?: number; errors?: Array<{ line: number; message: string }>; error?: string };
          setErrors(json.errors ?? []);
          onDone(response.ok ? `${json.created ?? 0} membres importés.` : json.error || "Import impossible");
          if (response.ok && !(json.errors ?? []).length) onClose();
        }}>
          <ul className="mb-3 max-h-40 overflow-auto text-xs text-[#C9D2E8]">{rows.slice(0, 8).map((row, index) => <li key={index}>{row[mapping.firstName]} {row[mapping.lastName]} · {row[mapping.email]}</li>)}</ul>
          {errors.map((error) => <p key={`${error.line}-${error.message}`} className="text-sm text-[#FF8A9B]">Ligne {error.line} : {error.message}</p>)}
          <button type="submit" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Confirmer l'import</button>
        </form>
      ) : null}
    </SidePanel>
  );
}

function FormationDossiersTab({
  organizationId,
  onNewRequest,
}: {
  organizationId: string;
  onNewRequest?: () => void;
}) {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      course_title: string | null;
      status: string;
      amount_ht_cents: number | null;
      deal_regressed: boolean;
      pending_confirm_fields: unknown;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setLocalNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/super-admin/crm/formation-dossiers?organization_id=${encodeURIComponent(organizationId)}`,
        );
        const json = (await res.json()) as { dossiers?: typeof rows; error?: string };
        if (!cancelled) setRows(json.dossiers ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#9AA3BD]">
          Pilotez ici les demandes de formation (devis → convention → session → clôture Qualiopi).
        </p>
        <button
          type="button"
          disabled={creating}
          className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
          onClick={() => {
            if (onNewRequest) {
              onNewRequest();
              return;
            }
            void (async () => {
              setCreating(true);
              setLocalNotice(null);
              try {
                const res = await fetch("/api/super-admin/crm/formation-dossiers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ organization_id: organizationId, source: "manual" }),
                });
                const json = (await res.json()) as { dossier?: { id: string }; error?: string };
                if (!res.ok) throw new Error(json.error || "Création impossible");
                setRows((current) => [
                  {
                    id: json.dossier!.id,
                    course_title: null,
                    status: "qualification",
                    amount_ht_cents: null,
                    deal_regressed: false,
                    pending_confirm_fields: [],
                    created_at: new Date().toISOString(),
                  },
                  ...current,
                ]);
                setLocalNotice("Dossier créé en Qualification.");
              } catch (error) {
                setLocalNotice(error instanceof Error ? error.message : "Création impossible");
              } finally {
                setCreating(false);
              }
            })();
          }}
        >
          {creating ? "Création…" : "Nouvelle demande"}
        </button>
      </div>
      {notice ? <p className="text-sm text-[#C4BAFF]">{notice}</p> : null}
      {loading ? (
        <EmptyState title="Chargement des dossiers…" />
      ) : rows.length === 0 ? (
        <EmptyState title="Aucun dossier formation pour cette entreprise." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#262A4A]">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] gap-2 border-b border-[#262A4A] bg-[#141731] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#A3A8C7]">
            <span>Formation</span>
            <span>Statut</span>
            <span>Montant HT</span>
            <span>Flags</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] gap-2 border-b border-[#262A4A]/px-4 py-3 text-sm text-[#F3F4FA] last:border-b-0"
            >
              <span>{row.course_title?.trim() || "À confirmer"}</span>
              <span className="text-[#A3A8C7]">{row.status}</span>
              <span>
                {row.amount_ht_cents != null
                  ? `${(row.amount_ht_cents / 100).toLocaleString("fr-FR")} €`
                  : "—"}
              </span>
              <span className="text-[#A3A8C7]">
                {row.deal_regressed ? "Deal reculé" : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpaceDialog({ orgId, orgName, onClose }: { orgId: string; orgName: string; onClose: () => void }) {
  const [reasonCode, setReasonCode] = useState("client_request");
  const [error, setError] = useState<string | null>(null);
  return (
    <SidePanel title={`Ouvrir l'espace de ${orgName}`} onClose={onClose}>
      <p className="mb-3 text-sm text-[#C9D2E8]">L'espace s'ouvre en lecture. Votre session Byound ne change pas.</p>
      <Field label="Motif, si vous passez ensuite en modification"><select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className={fieldClass}>{REASON_CODES.map((reason) => <option key={reason.code} value={reason.code}>{reason.label}</option>)}</select></Field>
      {error ? <p className="mb-3 text-sm text-[#FF8A9B]">{error}</p> : null}
      <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]" onClick={async () => {
        const response = await fetch("/api/super/impersonation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, mode: "read", reasonCode }) });
        const json = (await response.json()) as { error?: string };
        if (!response.ok) { setError(json.error || "Ouverture impossible"); return; }
        window.location.href = "/dashboard/entreprise";
      }}>Ouvrir en lecture</button>
    </SidePanel>
  );
}
