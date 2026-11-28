"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/control/chrome";
import { DataTable, PageHeader, StatusPill } from "@/components/control/ui";
import type { CareProspectRow } from "@/lib/control/care-prospects";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import { isCareDemoEmail } from "@/lib/care/demo-profiles";

const SOURCE_LABEL: Record<CareProspectRow["source"], string> = {
  rdv: "Rendez-vous",
  suivi: "Suivi coach",
  profil: "Profil",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

export function CareProspectsClient({ prospects }: { prospects: CareProspectRow[] }) {
  const [search, setSearch] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [page, setPage] = useState(1);
  const tests = prospects.filter(
    (row) => looksLikeTestAccount({ email: row.email, name: row.name }) && !isCareDemoEmail(row.email),
  );
  const pool = showTests
    ? prospects
    : prospects.filter((row) => !tests.some((item) => item.id === row.id));
  const query = search.trim().toLowerCase();
  const rows = useMemo(() => {
    if (!query) return pool;
    return pool.filter((row) =>
      [row.name, row.email, row.coachName ?? "", SOURCE_LABEL[row.source]].join(" ").toLowerCase().includes(query),
    );
  }, [pool, query]);
  const pageCount = Math.max(1, Math.ceil(rows.length / 40));
  const visible = rows.slice((page - 1) * 40, page * 40);

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8">
      <PageHeader
        title="Prospects"
        subtitle={`${rows.length} prospect${rows.length > 1 ? "s" : ""} Byound Care`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Rechercher"
          className="h-10 min-w-[240px] flex-1 rounded-full border border-[#26304F] bg-[#0B1122] px-4 text-sm text-white outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
          <input
            type="checkbox"
            checked={showTests}
            onChange={(event) => {
              setShowTests(event.target.checked);
              setPage(1);
            }}
          />
          Afficher les comptes de test ({tests.length})
        </label>
      </div>
      <DataTable
        columns={[
          {
            id: "person",
            header: "Prospect",
            cell: (row) => (
              <span className="min-w-0">
                <span className="block truncate font-semibold">{row.name}</span>
                <span className="block max-w-[260px] truncate text-[12px] text-[#9AA3BD]">{row.email}</span>
              </span>
            ),
          },
          {
            id: "source",
            header: "Source",
            cell: (row) => <StatusPill label={SOURCE_LABEL[row.source]} tone="info" />,
          },
          {
            id: "coach",
            header: "Coach",
            cell: (row) => row.coachName || "—",
          },
          {
            id: "phone",
            header: "Téléphone",
            cell: (row) => row.phone || "—",
          },
          {
            id: "created",
            header: "Depuis le",
            cell: (row) => formatDate(row.createdAt),
          },
        ]}
        rows={visible}
        rowKey={(row) => `${row.source}-${row.id}`}
        empty={<EmptyState title="Aucun prospect Care pour le moment." />}
        page={page}
        pageCount={pageCount}
        onPage={setPage}
      />
    </div>
  );
}
