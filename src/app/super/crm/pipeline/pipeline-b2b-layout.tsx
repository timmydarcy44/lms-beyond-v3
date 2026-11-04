"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { DataTable, type DataColumn } from "@/components/control/ui";
import { EmptyState, SegmentedFilter } from "@/components/control/chrome";
import { PipelineCollapsibleSection } from "@/components/crm/pipeline-collapsible-section";
import { PipelineFranceMap } from "@/components/crm/pipeline-france-map";
import { PipelineNafAnalytics } from "@/components/crm/pipeline-naf-analytics";
import { resolveAllDealGeoPoints } from "@/lib/crm/french-geo";
import {
  BTOB_PRIORITY_OPTIONS,
  BTOB_SECTOR_OPTIONS,
  isNextActionOverdue,
} from "@/lib/crm/pipeline-btob-commercial-options";
import { PIPELINE_BTOB_CONTACT_OWNERS, pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";
import { looksLikeTestDeal } from "@/lib/control/test-account";
import { columnIdentifiedCents, isWonRevenueStage } from "@/lib/crm/pipeline-opportunity-ca";
import { resolvePartyKind } from "@/lib/crm/pipeline-quoted-products";
import {
  BTOB_CATALOGUE_STAGE_SLUG,
  formatDealAmount,
  type PipelineDeal,
  type PipelineStage,
} from "@/lib/crm/pipeline-shared";
import { JarvisTodoCta } from "./jarvis-todo-cta";

const STAGE_COLORS = ["#6E5BFF", "#8B7BFF", "#5EDCC3", "#8DB8FF", "#F2CF6B", "#FF8A5B", "#2FD08A", "#C4BAFF", "#9AA3BD"];
const CARD_LIMIT = 30;

type SortKey = "company" | "stage" | "action" | "amount" | "owner";

function labelOf(options: ReadonlyArray<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function initials(email: string | null | undefined) {
  const parts = pipelineOwnerLabel(email).split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

function shortDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function contactLine(deal: PipelineDeal) {
  const name = [deal.contact_first_name, deal.contact_last_name].filter(Boolean).join(" ").trim();
  const city = deal.city?.trim() || deal.location?.trim() || "";
  return [name, city].filter(Boolean).join(" · ");
}

export function PipelineB2bLayout({
  stages,
  deals,
  currentUserEmail,
  onCreate,
  onCreateInStage,
  onOpen,
  onMove,
  onRename,
}: {
  stages: PipelineStage[];
  deals: PipelineDeal[];
  currentUserEmail: string | null;
  onCreate: () => void;
  onCreateInStage: (stageSlug: string) => void;
  onOpen: (deal: PipelineDeal) => void;
  onMove: (dealId: string, stageSlug: string) => void;
  onRename: (stage: PipelineStage) => void;
}) {
  const [view, setView] = useState("tableau");
  const [scope, setScope] = useState<"all" | "mine">(currentUserEmail === "jerome.picot@edgebs.fr" ? "mine" : "all");
  const [sector, setSector] = useState("all");
  const [owner, setOwner] = useState("all");
  const [lateOnly, setLateOnly] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [shown, setShown] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "company", dir: "asc" });
  const dragged = useRef(false);

  const sectors = useMemo(() => {
    const values = new Set<string>();
    for (const deal of deals) {
      if (deal.sector?.trim()) values.add(deal.sector.trim());
    }
    return [...values].sort((a, b) => a.localeCompare(b, "fr"));
  }, [deals]);

  const testDeals = deals.filter((deal) => looksLikeTestDeal(deal));
  const scoped = useMemo(() => {
    let list = showTests ? deals : deals.filter((deal) => !looksLikeTestDeal(deal));
    if (scope === "mine" && currentUserEmail) {
      list = list.filter((deal) => (deal.contact_owner_email ?? "").trim().toLowerCase() === currentUserEmail);
    }
    if (owner !== "all") {
      list = list.filter((deal) => (deal.contact_owner_email ?? "").trim().toLowerCase() === owner);
    }
    if (sector !== "all") list = list.filter((deal) => (deal.sector ?? "") === sector);
    return list;
  }, [deals, scope, currentUserEmail, owner, sector, showTests]);

  const lateCount = scoped.filter((deal) => isNextActionOverdue(deal.next_action_date)).length;
  const visible = lateOnly ? scoped.filter((deal) => isNextActionOverdue(deal.next_action_date)) : scoped;
  const identified = columnIdentifiedCents(visible);
  const stageName = (slug: string) => stages.find((stage) => stage.slug === slug)?.label ?? slug;

  const rows = useMemo(() => {
    const copy = [...visible];
    const direction = sort.dir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sort.key === "amount") return ((a.amount_cents ?? 0) - (b.amount_cents ?? 0)) * direction;
      if (sort.key === "stage") return stageName(a.stage_slug).localeCompare(stageName(b.stage_slug), "fr") * direction;
      if (sort.key === "action") return (a.next_action_date ?? "").localeCompare(b.next_action_date ?? "") * direction;
      if (sort.key === "owner") return pipelineOwnerLabel(a.contact_owner_email).localeCompare(pipelineOwnerLabel(b.contact_owner_email), "fr") * direction;
      return a.company_name.localeCompare(b.company_name, "fr") * direction;
    });
    return copy;
  }, [visible, sort, stages]);

  function toggleSort(key: SortKey) {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "asc" ? "desc" : "asc" }));
  }

  function header(label: string, key: SortKey) {
    const mark = sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
    return (
      <button type="button" onClick={() => toggleSort(key)} className="text-[13px] font-medium text-[#6C7593]">
        {label}{mark}
      </button>
    );
  }

  const columns: Array<DataColumn<PipelineDeal>> = [
    { id: "company", header: header("Entreprise", "company"), cell: (deal) => deal.company_name },
    { id: "stage", header: header("Étape", "stage"), cell: (deal) => stageName(deal.stage_slug) },
    {
      id: "action",
      header: header("Prochaine action", "action"),
      cell: (deal) => deal.next_action ? `${deal.next_action}${deal.next_action_date ? ` · ${shortDate(deal.next_action_date)}` : ""}` : "—",
    },
    {
      id: "amount",
      header: header("Montant", "amount"),
      cell: (deal) => ((deal.amount_cents ?? 0) > 0 ? formatDealAmount(deal.amount_cents) : "—"),
    },
    { id: "owner", header: header("Responsable", "owner"), cell: (deal) => pipelineOwnerLabel(deal.contact_owner_email) },
  ];

  const upcoming = [...visible]
    .filter((deal) => deal.next_action_date && deal.next_action)
    .sort((a, b) => (a.next_action_date ?? "").localeCompare(b.next_action_date ?? ""))
    .slice(0, 8);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.4px]">Pipeline B2B</h1>
          <p className="text-sm text-[#9AA3BD]">
            {visible.length} prospect{visible.length > 1 ? "s" : ""} · {identified > 0 ? `${formatDealAmount(identified)} identifiés` : "aucun montant identifié"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedFilter
            value={view}
            onChange={setView}
            items={[
              { id: "tableau", label: "Tableau" },
              { id: "liste", label: "Liste" },
              { id: "analyse", label: "Analyse" },
            ]}
          />
          <JarvisTodoCta />
          <button type="button" onClick={onCreate} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">
            + Prospect
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", "Tous"],
          ["mine", "Mes prospects"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{ background: scope === id ? "#6E5BFF" : "#111831", color: scope === id ? "#fff" : "#C9D2E8", border: "1px solid #26304F" }}
          >
            {label}
          </button>
        ))}
        <select value={sector} onChange={(event) => setSector(event.target.value)} className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-1.5 text-sm text-[#C9D2E8]">
          <option value="all">Secteur</option>
          {sectors.map((value) => (
            <option key={value} value={value}>{labelOf(BTOB_SECTOR_OPTIONS, value)}</option>
          ))}
        </select>
        <select value={owner} onChange={(event) => setOwner(event.target.value)} className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-1.5 text-sm text-[#C9D2E8]">
          <option value="all">Responsable</option>
          {PIPELINE_BTOB_CONTACT_OWNERS.map((person) => (
            <option key={person.email} value={person.email}>{person.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setLateOnly((value) => !value)}
          className="rounded-full px-3 py-1.5 text-sm font-semibold"
          style={{ background: lateOnly ? "#3A1420" : "#111831", color: "#FF5C7A", border: "1px solid #26304F" }}
        >
          ● {lateCount} {lateCount === 1 ? "action" : "actions"} en retard
        </button>
        <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
          <input type="checkbox" checked={showTests} onChange={(event) => setShowTests(event.target.checked)} />
          Afficher les comptes de test ({testDeals.length})
        </label>
      </div>

      {view === "liste" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(deal) => deal.id}
            onRow={onOpen}
            empty={<EmptyState title="Aucun prospect pour ce filtre." />}
          />
        </div>
      ) : null}

      {view === "analyse" ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-auto">
          <PipelineCollapsibleSection title="Carte France" subtitle={`${resolveAllDealGeoPoints(visible).length} entreprises géolocalisées`} defaultOpen>
            <PipelineFranceMap deals={visible} contentOnly />
          </PipelineCollapsibleSection>
          <PipelineCollapsibleSection title="Secteurs NAF" subtitle={`${visible.filter((deal) => deal.naf_code?.trim()).length} fiches avec code NAF`} defaultOpen>
            <PipelineNafAnalytics deals={visible} contentOnly />
          </PipelineCollapsibleSection>
          <PipelineCollapsibleSection title="Prochaines actions" subtitle="Basé sur la date de prochaine action" defaultOpen>
            {upcoming.length === 0 ? <p className="text-sm text-[#9AA3BD]">Aucune action planifiée.</p> : (
              <div className="grid gap-2 md:grid-cols-2">
                {upcoming.map((deal) => {
                  const late = isNextActionOverdue(deal.next_action_date);
                  return (
                    <button key={deal.id} type="button" onClick={() => onOpen(deal)} className="rounded-xl border border-[#1A2340] bg-[#0B1122] px-4 py-3 text-left">
                      <span className="block truncate text-sm font-semibold">{deal.company_name}</span>
                      <span className="mt-1 block truncate text-[12px]" style={{ color: late ? "#FF5C7A" : "#C4BAFF" }}>
                        {late ? "● " : ""}{deal.next_action}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </PipelineCollapsibleSection>
        </div>
      ) : null}

      {view === "tableau" ? (
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const column = visible.filter((deal) => deal.stage_slug === stage.slug);
            const limit = shown[stage.slug] ?? CARD_LIMIT;
            const slice = column.slice(0, limit);
            const rest = column.length - slice.length;
            const cents = columnIdentifiedCents(column);
            const sent = column.filter((deal) => deal.catalog_email_sent_at).length;
            const opened = column.filter((deal) => deal.catalog_email_sent_at && deal.catalog_email_opened_at).length;
            const subtitle = stage.slug === BTOB_CATALOGUE_STAGE_SLUG
              ? (sent > 0 ? `${opened}/${sent} ouverts` : "Aucun e-mail")
              : cents > 0
                ? `${formatDealAmount(cents)} ${isWonRevenueStage(stage.slug) ? "réalisé" : "identifiés"}`
                : "Aucun montant";
            return (
              <section
                key={stage.slug}
                className="flex h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#1A2340] bg-[#0B1122]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const dealId = event.dataTransfer.getData("dealId");
                  if (dealId) onMove(dealId, stage.slug);
                }}
              >
                <header className="border-b border-[#1A2340] px-3 py-2" style={{ boxShadow: `inset 0 3px 0 ${STAGE_COLORS[index % STAGE_COLORS.length]}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{stage.label}</p>
                      <p className="text-[12px] text-[#9AA3BD]">{column.length} · {subtitle}</p>
                    </div>
                    <button type="button" onClick={() => onRename(stage)} className="text-[#6C7593]" title="Renommer l'étape">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </header>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                  {column.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#26304F] px-3 py-6 text-center text-[12px] text-[#9AA3BD]">
                      Aucun prospect à cette étape
                    </div>
                  ) : null}
                  {slice.map((deal) => {
                    const late = isNextActionOverdue(deal.next_action_date);
                    const prescripteur = resolvePartyKind(deal) === "prescripteur";
                    return (
                      <article
                        key={deal.id}
                        draggable
                        onDragStart={(event) => {
                          dragged.current = true;
                          event.dataTransfer.setData("dealId", deal.id);
                        }}
                        onDragEnd={() => window.setTimeout(() => { dragged.current = false; }, 0)}
                        onClick={() => {
                          if (dragged.current) return;
                          onOpen(deal);
                        }}
                        className="cursor-grab rounded-xl border border-[#1A2340] bg-[#111831] px-3 py-2 active:cursor-grabbing"
                      >
                        <p className="flex items-center gap-2 truncate text-sm font-semibold">
                          <span className="truncate">{deal.company_name}</span>
                          {prescripteur ? <span className="shrink-0 rounded-full bg-[#3A2E12] px-2 py-0.5 text-[10px] font-semibold text-[#F2CF6B]">Prescripteur</span> : null}
                        </p>
                        <p className="truncate text-[12px] text-[#9AA3BD]">{contactLine(deal) || "Contact à renseigner"}</p>
                        <p className="truncate text-[12px]" style={{ color: late ? "#FF5C7A" : "#C4BAFF" }}>
                          {deal.next_action ? `${late ? "● " : ""}${deal.next_action}${deal.next_action_date ? ` · ${shortDate(deal.next_action_date)}` : ""}` : "Aucune action"}
                        </p>
                        <p className="mt-1 flex items-center gap-1">
                          {deal.sector ? <span className="truncate rounded-full bg-[#1A2340] px-2 py-0.5 text-[10px] text-[#C4BAFF]">{labelOf(BTOB_SECTOR_OPTIONS, deal.sector)}</span> : null}
                          {deal.priority ? <span className="rounded-full bg-[#1A2340] px-2 py-0.5 text-[10px] text-[#E8EDF8]">{labelOf(BTOB_PRIORITY_OPTIONS, deal.priority)}</span> : null}
                          <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6E5BFF] text-[10px] font-bold text-white">{initials(deal.contact_owner_email)}</span>
                        </p>
                      </article>
                    );
                  })}
                  {rest > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShown((current) => ({ ...current, [stage.slug]: limit + CARD_LIMIT }))}
                      className="w-full rounded-xl border border-[#26304F] py-2 text-[12px] font-semibold text-[#C4BAFF]"
                    >
                      + {rest} prospect{rest > 1 ? "s" : ""}
                    </button>
                  ) : null}
                </div>
                <button type="button" onClick={() => onCreateInStage(stage.slug)} className="border-t border-[#1A2340] py-2 text-[12px] text-[#9AA3BD]">
                  Ajouter
                </button>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
