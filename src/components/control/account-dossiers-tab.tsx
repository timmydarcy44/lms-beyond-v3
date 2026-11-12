"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormationDossierSheet } from "@/components/super-admin/formation-dossier-sheet";
import type { AccountDossierCard } from "@/lib/formation-dossier/board";
import {
  DOSSIER_STAGE_COLORS,
  DOSSIER_STAGE_COUNT_LABELS,
  DOSSIER_STAGE_LABELS,
  DOSSIER_STAGES,
  formatHtFr,
  getDossierStage,
  pickDossierAlert,
  stageIndex,
  type DossierStage,
} from "@/lib/formation-dossier/stages";

const VIEW_STORAGE_KEY = "byound.account.dossiers.view";
const COVER_PALETTES = [
  ["#6E5BFF", "#2A1E8F"],
  ["#14836E", "#0B3B36"],
  ["#F28B5B", "#7A2E1C"],
  ["#2F6FD6", "#0E2A5C"],
  ["#B65BFF", "#3B1466"],
  ["#C9A227", "#5A4510"],
] as const;

type SortKey = "action" | "session" | "amount" | "recent";
type ViewMode = "grid" | "list";
type StageFilter = "all" | DossierStage;

function shortDate(value: string | null | undefined) {
  if (!value || value === "signed") return null;
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function modalityLabel(value: string | null) {
  if (value === "presentiel") return "Présentiel";
  if (value === "distanciel") return "Distanciel";
  if (value === "hybride") return "Hybride";
  return null;
}

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function coverMeta(seed: string) {
  const h = hashId(seed || "x");
  return {
    palette: COVER_PALETTES[h % COVER_PALETTES.length]!,
    shape: h % 5,
  };
}

function CoverShape({ shape }: { shape: number }) {
  const common = "absolute opacity-[0.12]";
  if (shape === 0) {
    return <span className={`${common} -bottom-10 -right-10 h-44 w-44 rounded-full bg-white`} />;
  }
  if (shape === 1) {
    return (
      <span
        className={`${common} -bottom-8 -right-6 h-40 w-40 bg-white`}
        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
      />
    );
  }
  if (shape === 2) {
    return (
      <span
        className={`${common} -bottom-4 -right-2 h-40 w-40 bg-white`}
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    );
  }
  if (shape === 3) {
    return (
      <span
        className={`${common} -bottom-6 -right-4 h-40 w-40 bg-white`}
        style={{
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        }}
      />
    );
  }
  return (
    <span
      className={`${common} -bottom-8 -right-8 h-44 w-44`}
      style={{
        backgroundImage:
          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        opacity: 0.12,
      }}
    />
  );
}

function metaLine(card: AccountDossierCard) {
  const parts: string[] = [];
  if (card.participants_count != null && card.participants_count > 0) {
    parts.push(
      `${card.participants_count} participant${card.participants_count > 1 ? "s" : ""}`,
    );
  }
  if (card.duration_hours != null) {
    parts.push(`${card.duration_hours} h`);
  }
  const modality = modalityLabel(card.modality_presence);
  if (modality && card.location_label) parts.push(`${modality}, ${card.location_label}`);
  else if (modality) parts.push(modality);
  else if (card.location_label) parts.push(card.location_label);
  return parts.join(" · ");
}

function coverDateLabel(card: AccountDossierCard, stage: DossierStage | null) {
  if (stage === "devis") {
    if (!card.devis_sent_at) return "Devis à envoyer";
    const d = shortDate(card.devis_sent_at);
    return d ? `Devis envoyé le ${d}` : "Devis envoyé";
  }
  if (stage === "convention") {
    const d = shortDate(card.next_slot_date);
    return d ? `Session prévue le ${d}` : null;
  }
  if (stage === "session") {
    const start = shortDate(card.next_slot_date);
    const end = shortDate(card.last_slot_date);
    if (start && end && start !== end) return `Session · ${start} → ${end}`;
    if (start) return `Session · ${start}`;
    if (end) return `Session · ${end}`;
    return null;
  }
  if (stage === "cloture") {
    const d = shortDate(card.updated_at);
    return d ? `Clôturé le ${d}` : "Clôturé";
  }
  return null;
}

function primaryAction(card: AccountDossierCard, stage: DossierStage | null, alertKind: string | null) {
  if (stage === "devis") {
    if (!card.devis_sent_at) return { label: "Envoyer le devis", kind: "send_devis" as const };
    return { label: "Relancer le devis", kind: "send_devis" as const };
  }
  if (stage === "convention") {
    if (!card.convention_sent_at) return { label: "Envoyer la convention", kind: "send_convention" as const };
    if (alertKind === "convention_unsigned") {
      return { label: "Relancer", kind: "send_convention" as const };
    }
    return { label: "Voir la convention", kind: "view_convention" as const };
  }
  if (stage === "session") return { label: "Émargements", kind: "attendance" as const };
  if (stage === "cloture") return { label: "Voir le dossier", kind: "open" as const };
  return { label: "Voir le dossier", kind: "open" as const };
}

function actionSortRank(card: AccountDossierCard) {
  const stage = getDossierStage(card.status);
  const alert = pickDossierAlert({
    status: card.status,
    stage,
    devisSentAt: card.devis_sent_at,
    devisSignedAt: card.devis_signed_at,
    conventionSentAt: card.convention_sent_at,
    conventionSignedAt: card.convention_signed_at,
    nextSlotDate: card.next_slot_date,
    lastSlotDate: card.last_slot_date,
    attendanceComplete: card.attendance_complete,
    updatedAt: card.updated_at,
  });
  return (alert?.urgency ?? 0) * 10 + (4 - Math.max(stageIndex(stage), 0));
}

export function AccountDossiersTab({
  organizationId,
  invoicedHtCents,
  onNewRequest,
}: {
  organizationId: string;
  invoicedHtCents: number;
  onNewRequest: () => void;
}) {
  const [rows, setRows] = useState<AccountDossierCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    card: AccountDossierCard;
    kind: "devis" | "convention";
    label: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("action");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "grid" || stored === "list") setView(stored);
      const url = new URL(window.location.href);
      const etape = url.searchParams.get("etape");
      const tri = url.searchParams.get("tri");
      if (etape === "devis" || etape === "convention" || etape === "session" || etape === "cloture") {
        setStageFilter(etape);
      }
      if (tri === "session" || tri === "amount" || tri === "recent" || tri === "action") {
        setSortKey(tri);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setViewSafe = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const patchQuery = useCallback((patch: { etape?: StageFilter; tri?: SortKey }) => {
    if (patch.etape) setStageFilter(patch.etape);
    if (patch.tri) setSortKey(patch.tri);
    try {
      const url = new URL(window.location.href);
      const etape = patch.etape ?? stageFilter;
      const tri = patch.tri ?? sortKey;
      if (!etape || etape === "all") url.searchParams.delete("etape");
      else url.searchParams.set("etape", etape);
      if (!tri || tri === "action") url.searchParams.delete("tri");
      else url.searchParams.set("tri", tri);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    } catch {
      /* ignore */
    }
  }, [stageFilter, sortKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers?organization_id=${encodeURIComponent(organizationId)}&enriched=1&account_view=1`,
      );
      const json = (await res.json()) as { dossiers?: AccountDossierCard[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setRows(json.dossiers ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const staged = useMemo(
    () =>
      rows.map((card) => {
        const stage = getDossierStage(card.status);
        const alert = pickDossierAlert({
          status: card.status,
          stage,
          devisSentAt: card.devis_sent_at,
          devisSignedAt: card.devis_signed_at,
          conventionSentAt: card.convention_sent_at,
          conventionSignedAt: card.convention_signed_at,
          nextSlotDate: card.next_slot_date,
          lastSlotDate: card.last_slot_date,
          attendanceComplete: card.attendance_complete,
          updatedAt: card.updated_at,
        });
        return { card, stage, alert };
      }),
    [rows],
  );

  const summary = useMemo(() => {
    const byStage = Object.fromEntries(
      DOSSIER_STAGES.map((stage) => [stage, { count: 0, amount: 0 }]),
    ) as Record<DossierStage, { count: number; amount: number }>;
    let engaged = 0;
    for (const item of staged) {
      if (!item.stage) continue;
      byStage[item.stage].count += 1;
      byStage[item.stage].amount += item.card.amount_ht_cents ?? 0;
      engaged += item.card.amount_ht_cents ?? 0;
    }
    return { byStage, engaged, total: staged.filter((item) => item.stage).length };
  }, [staged]);

  const filtered = useMemo(() => {
    let list = staged.filter((item) => item.stage);
    if (stageFilter !== "all") list = list.filter((item) => item.stage === stageFilter);
    list = [...list].sort((a, b) => {
      if (sortKey === "amount") return (b.card.amount_ht_cents ?? 0) - (a.card.amount_ht_cents ?? 0);
      if (sortKey === "recent") return String(b.card.updated_at).localeCompare(String(a.card.updated_at));
      if (sortKey === "session") {
        return String(a.card.next_slot_date ?? "9999").localeCompare(String(b.card.next_slot_date ?? "9999"));
      }
      return actionSortRank(b.card) - actionSortRank(a.card);
    });
    return list;
  }, [staged, stageFilter, sortKey]);

  const runAction = async (
    card: AccountDossierCard,
    kind: ReturnType<typeof primaryAction>["kind"],
  ) => {
    if (kind === "open" || kind === "view_convention") {
      if (kind === "view_convention") {
        window.open(
          `/api/super-admin/crm/formation-dossiers/${card.id}/documents/convention/pdf`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      setSelectedId(card.id);
      return;
    }
    if (kind === "attendance") {
      setSelectedId(card.id);
      return;
    }
    if (kind === "send_devis" || kind === "send_convention") {
      const docKind = kind === "send_devis" ? "devis" : "convention";
      setConfirm({
        card,
        kind: docKind,
        label: kind === "send_devis" ? "le devis" : "la convention",
      });
    }
  };

  const confirmSend = async () => {
    if (!confirm) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers/${confirm.card.id}/documents/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: confirm.kind }),
        },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setConfirm(null);
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-5 space-y-5">
        <div className="h-36 animate-pulse rounded-[24px] bg-[#111831]" />
        <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[24px] bg-[#111831]" />
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-5 grid place-items-center rounded-[24px] border border-[#1A2340] bg-[#111831] px-6 py-16 text-center">
        <p className="text-lg font-extrabold text-[#F2F4FA]">Aucune formation pour ce compte</p>
        <button
          type="button"
          onClick={onNewRequest}
          className="mt-4 rounded-full bg-[#6E5BFF]/15 px-4 py-2 text-sm font-semibold text-[#C9C2FF]"
        >
          ＋ Demande de formation
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] px-6 py-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#F2F4FA]">
              Où en sont les {summary.total} dossier{summary.total > 1 ? "s" : ""}
            </h2>
            <p className="mt-1 text-sm text-[#9AA3BD]">Devis → convention → session → clôture Qualiopi</p>
          </div>
          <div className="text-right">
            <p className="text-[26px] font-extrabold leading-none text-[#F2F4FA]">
              {formatHtFr(summary.engaged)}
            </p>
            <p className="mt-1 text-xs text-[#6C7593]">
              engagés, dont {formatHtFr(invoicedHtCents).replace(/\s*€.*/, "")} € facturé
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          {DOSSIER_STAGES.map((stage) => {
            const data = summary.byStage[stage];
            const flex = Math.max(data.count, 1);
            const color = data.count ? DOSSIER_STAGE_COLORS[stage] : "#26304F";
            return (
              <div key={stage} className="min-w-0" style={{ flex }}>
                <div className="h-2.5 rounded-full" style={{ background: color }} />
                <p className="mt-3 text-[22px] font-extrabold leading-none text-[#F2F4FA]">
                  {data.count}{" "}
                  <span className="text-sm font-semibold text-[#9AA3BD]">
                    {DOSSIER_STAGE_COUNT_LABELS[stage]}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[#6C7593]">
                  {data.amount > 0 ? formatHtFr(data.amount) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `Tous (${summary.total})`],
              ...DOSSIER_STAGES.map((stage) => [
                stage,
                `${DOSSIER_STAGE_LABELS[stage]}${stage === "cloture" ? "s" : ""} (${summary.byStage[stage].count})`,
              ]),
            ] as Array<[StageFilter, string]>
          ).map(([id, label]) => {
            const active = stageFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => patchQuery({ etape: id as StageFilter })}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: active ? "#FFFFFF" : "#111831",
                  color: active ? "#0A0F1E" : "#9AA3BD",
                  border: active ? "1px solid transparent" : "1px solid #1A2340",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="rounded-full border border-[#1A2340] bg-[#111831] px-3 py-1.5 text-xs text-[#9AA3BD]">
            Trier :{" "}
            <select
              className="bg-transparent font-semibold text-[#F2F4FA] outline-none"
              value={sortKey}
              onChange={(event) => patchQuery({ tri: event.target.value as SortKey })}
            >
              <option value="action">prochaine action</option>
              <option value="session">date de session</option>
              <option value="amount">montant</option>
              <option value="recent">plus récent</option>
            </select>
            {" ▾"}
          </label>
          <div className="flex overflow-hidden rounded-full border border-[#1A2340] bg-[#111831]">
            <button
              type="button"
              aria-label="Vue cartes"
              onClick={() => setViewSafe("grid")}
              className="px-3 py-1.5 text-sm"
              style={{ background: view === "grid" ? "#1A2340" : "transparent", color: view === "grid" ? "#F2F4FA" : "#6C7593" }}
            >
              ▦
            </button>
            <button
              type="button"
              aria-label="Vue liste"
              onClick={() => setViewSafe("list")}
              className="px-3 py-1.5 text-sm"
              style={{ background: view === "list" ? "#1A2340" : "transparent", color: view === "list" ? "#F2F4FA" : "#6C7593" }}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-[#1A2340] bg-[#111831] px-6 py-10 text-center">
          <p className="text-[#F2F4FA]">
            Aucun dossier à l&apos;étape{" "}
            {stageFilter === "all" ? "" : DOSSIER_STAGE_LABELS[stageFilter as DossierStage]}
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#A99BFF]"
            onClick={() => patchQuery({ etape: "all" })}
          >
            Voir tous les dossiers
          </button>
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
          {filtered.map(({ card, stage, alert }) => {
            const action = primaryAction(card, stage, alert?.kind ?? null);
            const color = stage ? DOSSIER_STAGE_COLORS[stage] : "#6C7593";
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedId(card.id)}
                className="grid w-full grid-cols-[1.4fr_0.7fr_0.6fr_0.8fr] items-center gap-3 border-b border-[#1A2340] px-4 py-3 text-left last:border-b-0"
              >
                <span className="truncate font-semibold text-[#F2F4FA]">
                  {card.course_title?.trim() || "Formation à confirmer"}
                </span>
                <span
                  className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${color}22`, color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {stage ? DOSSIER_STAGE_LABELS[stage] : card.status}
                </span>
                <span className="text-sm text-[#9AA3BD]">{formatHtFr(card.amount_ht_cents)}</span>
                <span className="justify-self-end text-xs font-semibold" style={{ color }}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ card, stage, alert }) => {
            const color = stage ? DOSSIER_STAGE_COLORS[stage] : "#6C7593";
            const action = primaryAction(card, stage, alert?.kind ?? null);
            const seed = card.training_course_id || card.id;
            const cover = coverMeta(seed);
            const dateLabel = coverDateLabel(card, stage);
            const meta = metaLine(card);
            const currentIdx = stageIndex(stage);
            return (
              <article
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(card.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedId(card.id);
                }}
                className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831] text-left"
              >
                <div className="relative h-[148px] overflow-hidden p-4">
                  {card.cover_url ? (
                    <>
                      <Image
                        src={card.cover_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:800px) 100vw, 33vw"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, #0A0F1E00 30%, #0A0F1ECC 100%)",
                        }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${cover.palette[0]} 0%, ${cover.palette[1]} 100%)`,
                      }}
                    >
                      <CoverShape shape={cover.shape} />
                    </div>
                  )}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur"
                      style={{ background: "#0A0F1EB3", color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {stage ? DOSSIER_STAGE_LABELS[stage] : card.status}
                    </span>
                    <span className="relative">
                      <button
                        type="button"
                        aria-label="Actions"
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#0A0F1EB3] text-white backdrop-blur"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuId((value) => (value === card.id ? null : card.id));
                        }}
                      >
                        ⋯
                      </button>
                      {menuId === card.id ? (
                        <span
                          className="absolute right-0 z-20 mt-1 w-48 rounded-2xl border border-[#26304F] bg-[#111831] p-2 text-xs shadow-xl"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="block w-full rounded-xl px-2 py-1.5 text-left"
                            onClick={() => {
                              setMenuId(null);
                              window.open(
                                `/api/super-admin/crm/formation-dossiers/${card.id}/documents/devis/pdf`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            Voir le devis
                          </button>
                          <button
                            type="button"
                            className="block w-full rounded-xl px-2 py-1.5 text-left"
                            onClick={() => {
                              setMenuId(null);
                              window.open(
                                `/api/super-admin/crm/formation-dossiers/${card.id}/documents/convention/pdf`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            Voir la convention
                          </button>
                          <button
                            type="button"
                            className="block w-full rounded-xl px-2 py-1.5 text-left"
                            onClick={() => {
                              setMenuId(null);
                              setSelectedId(card.id);
                            }}
                          >
                            Ouvrir le dossier
                          </button>
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {dateLabel ? (
                    <p className="absolute bottom-4 left-4 z-10 text-[12.5px] font-extrabold text-white/80">
                      {dateLabel}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3 px-5 pb-5 pt-[18px]">
                  <h3 className="line-clamp-2 text-[16.5px] font-extrabold leading-snug text-[#F2F4FA]">
                    {card.course_title?.trim() || "Formation à confirmer"}
                  </h3>
                  {meta ? <p className="text-xs text-[#9AA3BD]">{meta}</p> : null}
                  <div className="flex gap-1">
                    {DOSSIER_STAGES.map((item, index) => (
                      <span
                        key={item}
                        className="h-[5px] flex-1 rounded-full"
                        style={{
                          background: currentIdx >= index && stage ? DOSSIER_STAGE_COLORS[stage] : "#26304F",
                        }}
                      />
                    ))}
                  </div>
                  {alert ? (
                    <p className="rounded-[10px] bg-[#FF5D731A] px-3 py-2 text-xs font-semibold text-[#FF8A9B]">
                      ⚠ {alert.text}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 border-t border-[#1A2340] pt-3">
                    <p className="text-[19px] font-extrabold text-[#F2F4FA]">
                      {card.amount_ht_cents != null ? (
                        <>
                          {formatHtFr(card.amount_ht_cents).replace(/\s*€.*/, "")}
                          <span className="ml-1 text-xs font-semibold text-[#6C7593]">€ HT</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-[#6C7593]">—</span>
                      )}
                    </p>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: `${color}1F`, color }}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runAction(card, action.kind);
                      }}
                    >
                      {action.label}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-[#26304F] bg-[#111831] p-5">
            <h3 className="text-lg font-extrabold text-[#F2F4FA]">Confirmer l&apos;envoi</h3>
            <p className="mt-2 text-sm text-[#9AA3BD]">
              Envoyer {confirm.label} à{" "}
              <span className="font-semibold text-[#F2F4FA]">
                {confirm.card.contact_email || "destinataire du dossier"}
              </span>
              {confirm.card.contact_name ? ` (${confirm.card.contact_name})` : ""}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
                onClick={() => setConfirm(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={sending}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
                onClick={() => void confirmSend()}
              >
                {sending ? "Envoi…" : "Confirmer l'envoi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FormationDossierSheet
        dossierId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => void load()}
      />
    </div>
  );
}
