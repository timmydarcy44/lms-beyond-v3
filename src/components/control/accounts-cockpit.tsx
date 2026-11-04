"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/control/chrome";
import { DataTable, StatusPill } from "@/components/control/ui";
import { formatEuroDelta, formatEurosHt } from "@/lib/control/policy";
import type { ControlAccount, ControlCockpit } from "@/lib/control/load";

const MODULE_LABELS: Record<string, string> = {
  beyond_care: "Byound Care",
  mental_health_tracking: "Byound Care",
  beyond_lms: "LMS",
  beyond_connect: "Connect",
  beyond_play: "Play",
  beyond_note: "Note",
  gamification: "Play",
  ai_advanced: "IA",
  analytics_pro: "Analytics",
};

const COLORS = ["#6E5BFF", "#8DB8FF", "#6BE39B", "#F2CF6B", "#FF8A9B"];

type Tab = "clients" | "trial" | "setup" | "demo" | "archived";
type SortKey = "revenue" | "activity" | "signal";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "B";
}

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash] ?? COLORS[0];
}

function relative(iso: string | null) {
  if (!iso) return "jamais";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function inTab(account: ControlAccount, tab: Tab) {
  if (tab === "trial") return account.status === "trial";
  if (tab === "setup") return account.status === "onboarding";
  if (tab === "demo") return account.kind === "demo" || account.status === "demo";
  if (tab === "archived") return account.status === "archived";
  return account.kind !== "demo" && account.status !== "demo" && account.status !== "archived";
}

function moduleLabels(keys: string[]) {
  return [...new Set(keys.map((key) => MODULE_LABELS[key] ?? key))].filter((label) => label !== "mental_health_tracking");
}

const pill: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#163228", fg: "#6BE39B", label: "Actif" },
  trial: { bg: "#1A2744", fg: "#8DB8FF", label: "En essai" },
  onboarding: { bg: "#3A3118", fg: "#F2CF6B", label: "À configurer" },
  demo: { bg: "#2A2418", fg: "#F2CF6B", label: "Démo" },
  archived: { bg: "#241820", fg: "#FF8A9B", label: "Archivé" },
  internal: { bg: "#241C3E", fg: "#C4B8FF", label: "Interne" },
};

export function AccountsCockpit({ data }: { data: ControlCockpit }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("clients");
  const [showTests, setShowTests] = useState(false);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const commercial = data.accounts.filter((account) => account.kind !== "demo" && account.status !== "demo");
  const revenue = commercial.reduce((sum, account) => sum + account.revenue12HtCents, 0);
  const previous = commercial.reduce((sum, account) => sum + account.revenuePrev12HtCents, 0);
  const outstanding = commercial.reduce((sum, account) => sum + account.outstandingHtCents, 0);
  const overdue = commercial.reduce((sum, account) => sum + account.overdueHtCents, 0);
  const modules = [...new Set(data.accounts.flatMap((account) => moduleLabels(account.modules)))];
  const managers = [...new Map(data.accounts.filter((account) => account.accountManagerId).map((account) => [account.accountManagerId, account.accountManagerName])).entries()];

  const rows = useMemo(() => {
    const filtered = data.accounts.filter((account) => {
      const demo = account.kind === "demo" || account.status === "demo";
      if (demo && !showTests) return false;
      if (tab === "demo") return demo;
      if (!inTab(account, tab)) return false;
      if (query && !`${account.name} ${account.slug}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (moduleFilter !== "all" && !moduleLabels(account.modules).includes(moduleFilter)) return false;
      if (managerFilter === "none" && account.accountManagerId) return false;
      if (managerFilter !== "all" && managerFilter !== "none" && account.accountManagerId !== managerFilter) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "activity") return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
      if (sort === "signal") return (a.signal?.rank ?? 9) - (b.signal?.rank ?? 9);
      return b.revenue12HtCents - a.revenue12HtCents;
    });
  }, [data.accounts, tab, query, moduleFilter, managerFilter, sort, showTests]);

  const counts = {
    clients: data.accounts.filter((account) => inTab(account, "clients")).length,
    trial: data.accounts.filter((account) => inTab(account, "trial")).length,
    setup: data.accounts.filter((account) => inTab(account, "setup")).length,
    demo: data.accounts.filter((account) => inTab(account, "demo")).length,
    archived: data.accounts.filter((account) => inTab(account, "archived")).length,
  };

  const duplicateIds = data.duplicates.flatMap((group) => group.ids);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-extrabold tracking-[-1.4px]">Comptes clients</h1>
          <p className="mt-1 text-sm text-[#9AA6C2]">
            {counts.clients} comptes suivis · {counts.trial} en essai · {counts.setup} à configurer
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/super/organisations/new" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "#ffffff", color: "#12141C" }}>
            + Nouveau compte
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Kpi title="CA 12 derniers mois" value={formatEurosHt(revenue)} hint={formatEuroDelta(revenue - previous)} positive={revenue - previous >= 0} />
        <Kpi title="Clients actifs" value={String(commercial.filter((account) => account.status === "active").length)} />
        <Kpi title="En essai" value={String(counts.trial)} />
        <Kpi title="À relancer" value={String(commercial.filter((account) => account.signal?.key === "inactive_21d" || account.signal?.key === "pending_invites").length)} />
        <Kpi title="À encaisser" value={formatEurosHt(outstanding)} hint={overdue ? `dont ${formatEurosHt(overdue)} en retard` : "rien en retard"} />
      </div>

      {data.duplicates.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[22px] border border-[#6A5420] bg-[#2A2412] px-4 py-3 text-sm">
          <p>
            {data.duplicates.length} nom{data.duplicates.length > 1 ? "s" : ""} en double, dont {data.duplicates.map((group) => group.name).join(", ")}.
          </p>
          <Link
            href={`/super/organisations/comparer?ids=${data.duplicates[0]?.ids.join(",") ?? ""}`}
            className="rounded-full bg-[#F2CF6B] px-3 py-1.5 text-xs font-semibold text-[#2A2412]"
          >
            Comparer et fusionner
          </Link>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(
          [
            ["clients", `Clients ${counts.clients}`],
            ["trial", `En essai ${counts.trial}`],
            ["setup", `À configurer ${counts.setup}`],
            ["demo", `Démo et test ${counts.demo}`],
            ["archived", `Archivés ${counts.archived}`],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              if (key === "demo") setShowTests(true);
            }}
            className="rounded-full px-3 py-1.5 text-sm"
            style={{ background: tab === key ? "#6E5BFF" : "#111831", color: "white" }}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher"
          className="ml-auto rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm outline-none"
        />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm">
          <option value="all">Modules</option>
          {modules.map((moduleName) => (
            <option key={moduleName} value={moduleName}>{moduleName}</option>
          ))}
        </select>
        <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)} className="rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm">
          <option value="all">Chargé de compte</option>
          <option value="none">Non assigné</option>
          {managers.map(([id, name]) => (
            <option key={id} value={id ?? ""}>{name}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm">
          <option value="revenue">CA 12 mois</option>
          <option value="activity">Dernière activité</option>
          <option value="signal">Signal</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
          <input type="checkbox" checked={showTests} onChange={(event) => setShowTests(event.target.checked)} />
          Afficher les comptes de test ({counts.demo})
        </label>
      </div>

      <DataTable
        columns={[
          {
            id: "account",
            header: "Compte",
            cell: (account) => (
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-[#0A0F1E]" style={{ background: colorFor(account.name) }}>
                  {account.logoUrl ? <img src={account.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : initials(account.name)}
                </span>
                <span>
                  <span className="block font-semibold">{account.name}</span>
                  <span className="block text-[12px] text-[#9AA3BD]">{account.kind === "internal" ? "Interne" : "Entreprise"} · {relative(account.lastActivityAt)}</span>
                </span>
              </span>
            ),
          },
          {
            id: "status",
            header: "Statut",
            cell: (account) => {
              const status = account.kind === "internal" ? pill.internal : pill[account.status] ?? pill.onboarding;
              const tone = account.status === "active" ? "success" : account.status === "archived" ? "danger" : account.status === "trial" ? "info" : "warning";
              return <StatusPill label={status.label} tone={account.kind === "internal" ? "info" : tone} />;
            },
          },
          {
            id: "modules",
            header: "Modules",
            cell: (account) => moduleLabels(account.modules).join(", ") || "—",
          },
          { id: "users", header: "Utilisateurs actifs", cell: (account) => `${account.activeUsers} / ${account.totalUsers}` },
          {
            id: "revenue",
            header: "CA 12 mois",
            cell: (account) => account.status === "trial"
              ? (account.openQuoteHtCents ? formatEurosHt(account.openQuoteHtCents) : "Devis en cours")
              : formatEurosHt(account.revenue12HtCents),
          },
          { id: "signal", header: "Signal", cell: (account) => account.signal?.label ?? "—" },
          {
            id: "open",
            header: "",
            cell: (account) => (
              <span className="relative flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded-full px-2 py-1"
                  aria-label="Actions"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenu(openMenu === account.id ? null : account.id);
                  }}
                >
                  ⋯
                </button>
                {openMenu === account.id ? (
                  <span className="absolute right-0 top-8 z-10 w-44 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-sm" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="block w-full rounded-xl px-2 py-1.5 text-left" onClick={() => { void navigator.clipboard.writeText(account.id); setCopied(account.id); }}>
                      {copied === account.id ? "Identifiant copié" : "Copier l'identifiant"}
                    </button>
                    {duplicateIds.includes(account.id) ? (
                      <Link className="block rounded-xl px-2 py-1.5" href={`/super/organisations/comparer?ids=${data.duplicates.find((group) => group.ids.includes(account.id))?.ids.join(",") ?? ""}`}>
                        Comparer
                      </Link>
                    ) : null}
                  </span>
                ) : null}
                <ChevronRight className="h-4 w-4 text-[#6C7593]" />
              </span>
            ),
          },
        ]}
        rows={rows}
        rowKey={(account) => account.id}
        onRow={(account) => router.push(`/super/organisations/${account.id}`)}
        empty={<EmptyState title="Aucun compte pour ce filtre." />}
      />
    </div>
  );
}

function Kpi({ title, value, hint, positive }: { title: string; value: string; hint?: string; positive?: boolean }) {
  return (
    <div className="rounded-[22px] border border-[#1A2340] bg-[#111831] p-4">
      <p className="text-xs text-[#9AA6C2]">{title}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-[-0.6px]">{value}</p>
      {hint ? <p className="mt-1 text-xs" style={{ color: positive === false ? "#FF8A9B" : "#6BE39B" }}>{hint}</p> : null}
    </div>
  );
}
