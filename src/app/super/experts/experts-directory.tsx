"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AddExpertDialog } from "@/components/admin/experts/add-expert-dialog";
import { EmptyState, SegmentedFilter } from "@/components/control/chrome";
import { DataTable, PageHeader, RolePill, StatusPill } from "@/components/control/ui";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { parseContributorProfile } from "@/lib/expert/contributor-profile";

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "pending_review", label: "En attente" },
  { id: "approved", label: "Validés" },
  { id: "rejected", label: "Refusés" },
  { id: "needs_info", label: "Infos demandées" },
] as const;

const COLORS = ["#6E5BFF", "#8DB8FF", "#5EDCC3", "#F2CF6B", "#FF8A9B"];

function displayName(expert: AdminExpertRow) {
  return [expert.first_name, expert.last_name].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ") || "Profil sans nom";
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "B";
}

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash] ?? COLORS[0];
}

function filieres(specialties: string[] | null) {
  const found = new Set<string>();
  for (const specialty of specialties ?? []) {
    const match = CFA_SPECIALIZATIONS.find((item) => item.value === specialty || item.label === specialty);
    const group = match?.group.split("·")[0]?.trim();
    if (group) found.add(group);
  }
  return [...found];
}

function statusOf(status: string | null) {
  if (status === "approved") return { label: "Validé", tone: "success" as const };
  if (status === "rejected") return { label: "Refusé", tone: "danger" as const };
  if (status === "needs_info") return { label: "Infos demandées", tone: "warning" as const };
  return { label: "À valider", tone: "warning" as const };
}

export function ExpertsDirectory({
  experts,
  activeFilter,
  startAdd = false,
}: {
  experts: AdminExpertRow[];
  activeFilter: string;
  startAdd?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [page, setPage] = useState(1);
  const tests = experts.filter((expert) => looksLikeTestAccount({ email: expert.email, name: displayName(expert) }));
  const base = showTests ? experts : experts.filter((expert) => !tests.some((item) => item.id === expert.id));
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: base.length };
    for (const expert of base) {
      const key = expert.review_status || "pending_review";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [base]);
  const pending = (counts.pending_review ?? 0);
  const query = search.trim().toLowerCase();
  const rows = base.filter((expert) => {
    if (activeFilter !== "all" && (expert.review_status || "pending_review") !== activeFilter) return false;
    if (!query) return true;
    const profile = parseContributorProfile(expert.references, expert.headline);
    return [displayName(expert), expert.email, profile.jobTitle, ...(expert.specialties ?? [])].join(" ").toLowerCase().includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / 40));
  const visible = rows.slice((page - 1) * 40, page * 40);

  function choose(id: string) {
    setPage(1);
    router.replace(id === "all" ? "/super/experts" : `/super/experts?status=${id}`);
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8">
      <PageHeader
        title="Formateurs et experts"
        subtitle={`${base.length} profil${base.length > 1 ? "s" : ""} · ${pending} en attente de validation`}
        actions={
          <>
            <a href="/super/open-badges/badgeclasses/new" className="rounded-full border border-[#6E5BFF] px-4 py-2 text-sm font-semibold text-[#C4BAFF]">
              Créer un Open Badge
            </a>
            <AddExpertDialog initialOpen={startAdd} label="Ajouter un profil" />
          </>
        }
      />
      <a href="/super/experts/appartenances" className="inline-block text-sm text-[#C4BAFF]">Appartenances par pôle</a>
      <SegmentedFilter
        value={activeFilter}
        onChange={choose}
        items={FILTERS.map((filter) => ({ ...filter, count: counts[filter.id] ?? 0 }))}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Rechercher un profil"
          className="h-10 min-w-[240px] flex-1 rounded-full border border-[#26304F] bg-[#0B1122] px-4 text-sm text-white outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
          <input type="checkbox" checked={showTests} onChange={(event) => { setShowTests(event.target.checked); setPage(1); }} />
          Afficher les comptes de test ({tests.length})
        </label>
      </div>
      <DataTable
        columns={[
          {
            id: "profile",
            header: "Profil",
            cell: (expert) => {
              const name = displayName(expert);
              const title = parseContributorProfile(expert.references, expert.headline).jobTitle;
              const photo = expert.photo_url || expert.avatar_url;
              return (
                <span className="flex items-center gap-3">
                  {photo ? (
                    <img src={photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-[#0A0F1E]" style={{ background: colorFor(name) }}>{initials(name)}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{name}</span>
                    <span className="block max-w-[280px] truncate text-[12px] text-[#9AA3BD]">{title || "—"}</span>
                  </span>
                </span>
              );
            },
          },
          {
            id: "roles",
            header: "Rôle et filière",
            cell: (expert) => {
              const roles = parseContributorProfile(expert.references, expert.headline).roles;
              const groups = filieres(expert.specialties);
              return (
                <span className="flex flex-wrap gap-1">
                  {roles.map((role) => <RolePill key={role} role={role} />)}
                  {groups.map((group) => <StatusPill key={group} label={group} tone="info" />)}
                  {expert.is_care_expert ? <StatusPill label="Care" tone="success" /> : null}
                  {roles.length === 0 && groups.length === 0 && !expert.is_care_expert ? <span className="text-[#6C7593]">—</span> : null}
                </span>
              );
            },
          },
          {
            id: "specialties",
            header: "Spécialités",
            cell: (expert) => <span className="block max-w-[240px] truncate text-[#C9D2E8]">{(expert.specialties ?? []).slice(0, 3).join(", ") || "—"}</span>,
          },
          {
            id: "status",
            header: "Statut",
            cell: (expert) => {
              const status = statusOf(expert.review_status);
              return <StatusPill label={status.label} tone={status.tone} />;
            },
          },
          {
            id: "date",
            header: "Inscrit le",
            cell: (expert) => expert.created_at ? new Date(expert.created_at).toLocaleDateString("fr-FR") : "—",
          },
          { id: "open", header: "", cell: () => <ChevronRight className="h-4 w-4 text-[#6C7593]" /> },
        ]}
        rows={visible}
        rowKey={(expert) => expert.id}
        onRow={(expert) => router.push(`/super/experts/${expert.id}`)}
        empty={<EmptyState title="Aucun profil pour ce filtre." />}
        page={page}
        pageCount={pageCount}
        onPage={setPage}
      />
    </div>
  );
}
