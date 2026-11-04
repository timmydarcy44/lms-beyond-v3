"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState, SegmentedFilter } from "@/components/control/chrome";
import { DataTable, PageHeader, StatusPill } from "@/components/control/ui";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import { formatCrmRoleLabel, type CrmUserListItem } from "@/lib/crm/crm-shared";

const COLORS = ["#6E5BFF", "#8DB8FF", "#5EDCC3", "#F2CF6B", "#FF8A9B"];

const GROUPS = [
  { id: "all", label: "Tous", roles: null },
  { id: "learner", label: "Apprenants", roles: ["learner", "student", "apprenant"] },
  { id: "btoc", label: "Particuliers", roles: ["btoc", "particulier", "PARTICULIER"] },
  { id: "instructor", label: "Formateurs", roles: ["instructor", "formateur"] },
  { id: "tutor", label: "Tuteurs", roles: ["tutor"] },
  { id: "expert", label: "Experts", roles: ["expert"] },
] as const;

function modeOf(role: string) {
  if (["btoc", "particulier", "PARTICULIER"].includes(role)) return "particuliers";
  if (["learner", "student", "apprenant"].includes(role)) return "apprenants";
  if (role === "tutor") return "tuteurs";
  return "contacts";
}

function personName(user: CrmUserListItem) {
  const name = [user.firstName, user.lastName].filter((part) => part && part !== "—").join(" ").trim();
  return name || user.fullName || user.email;
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

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

export function UsersPageClient({ initialUsers, initialRole = "all" }: { initialUsers: CrmUserListItem[]; initialRole?: string }) {
  const router = useRouter();
  const mode = modeOf(initialRole);
  const locked = mode !== "contacts";
  const [group, setGroup] = useState(locked ? initialRole : "all");
  const [search, setSearch] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [page, setPage] = useState(1);
  const tests = initialUsers.filter((user) => looksLikeTestAccount({ email: user.email, name: personName(user), role: user.role }));
  const pool = showTests ? initialUsers : initialUsers.filter((user) => !tests.some((item) => item.id === user.id));
  const query = search.trim().toLowerCase();
  const rows = useMemo(() => {
    const roles = GROUPS.find((item) => item.id === group)?.roles ?? (group === "all" ? null : [group]);
    return pool.filter((user) => {
      if (roles && !(roles as readonly string[]).includes(user.role)) return false;
      if (!query) return true;
      return [personName(user), user.email, ...(user.organizations ?? []).map((org) => org.name)].join(" ").toLowerCase().includes(query);
    });
  }, [pool, group, query]);
  const pageCount = Math.max(1, Math.ceil(rows.length / 40));
  const visible = rows.slice((page - 1) * 40, page * 40);
  const title = mode === "particuliers" ? "Particuliers" : mode === "apprenants" ? "Apprenants" : mode === "tuteurs" ? "Tuteurs" : "Contacts";
  const noun = mode === "particuliers" ? "particulier" : mode === "apprenants" ? "apprenant" : mode === "tuteurs" ? "tuteur" : "contact";
  const counts = Object.fromEntries(GROUPS.map((item) => [item.id, item.roles ? pool.filter((user) => (item.roles as readonly string[]).includes(user.role)).length : pool.length]));

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8">
      <PageHeader
        title={title}
        subtitle={`${rows.length} ${noun}${rows.length > 1 ? "s" : ""}`}
        actions={
          <a href="/super/utilisateurs/new" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">
            + Nouveau contact
          </a>
        }
      />
      {locked ? null : (
        <SegmentedFilter
          value={GROUPS.some((item) => item.id === group) ? group : "all"}
          onChange={(id) => { setGroup(id); setPage(1); }}
          items={GROUPS.map((item) => ({ id: item.id, label: item.label, count: counts[item.id] ?? 0 }))}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Rechercher"
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
            id: "person",
            header: "Profil",
            cell: (user) => {
              const name = personName(user);
              return (
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-[#0A0F1E]" style={{ background: colorFor(name) }}>{initials(name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{name}</span>
                    <span className="block max-w-[260px] truncate text-[12px] text-[#9AA3BD]">{user.email}</span>
                  </span>
                </span>
              );
            },
          },
          { id: "role", header: "Rôle", cell: (user) => <StatusPill label={formatCrmRoleLabel(user.role)} tone="info" /> },
          {
            id: "org",
            header: "Organisation",
            cell: (user) => <span className="block max-w-[200px] truncate">{(user.organizations ?? []).map((org) => org.name).join(", ") || "—"}</span>,
          },
          { id: "created", header: "Inscrit le", cell: (user) => formatDate(user.createdAt) },
          { id: "seen", header: "Dernière connexion", cell: (user) => formatDate(user.lastSignInAt) },
          { id: "open", header: "", cell: () => <ChevronRight className="h-4 w-4 text-[#6C7593]" /> },
        ]}
        rows={visible}
        rowKey={(user) => user.id}
        onRow={(user) => router.push(`/super/utilisateurs/${user.id}`)}
        empty={<EmptyState title="Aucun contact pour ce filtre." />}
        page={page}
        pageCount={pageCount}
        onPage={setPage}
      />
    </div>
  );
}
