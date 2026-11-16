"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, MoreHorizontal, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUALIOPI_CRITERION_NAMES } from "@/lib/qualiopi/indicators";
import { ACTIVITY_LABELS, type QualiopiActivityKey } from "@/lib/qualiopi/activity-profile";
import type { QualiopiStatusSnapshot, QualiopiUiStatus } from "@/lib/qualiopi/status-types";
import { QualiopiPlanExamples } from "@/components/super-admin/qualiopi-plan-examples";
import { QualiopiProofGuide } from "@/components/super-admin/qualiopi-proof-guide";
import { QualiopiSubcontractEditor } from "@/components/super-admin/qualiopi-subcontract-editor";
import { cn } from "@/lib/utils";

const BG = "#0A0F1E";
const CARD = "#111831";
const INNER = "#0B1122";
const BORDER = "#1A2340";
const TEXT = "#F2F4FA";
const MUTED = "#9AA3BD";
const VIOLET = "#6E5BFF";
const VIOLET_SOFT = "#C9C2FF";

const STATUS_COLOR: Record<QualiopiUiStatus, string> = {
  proven: "#6BE39B",
  todo: "#F2CF6B",
  missing: "#FF8A9B",
  na: "#3A4566",
};

const STATUS_LABEL: Record<QualiopiUiStatus, string> = {
  proven: "Prouvé",
  todo: "À compléter",
  missing: "Preuve manquante",
  na: "Non applicable",
};

type TabId = "overview" | "coffre" | "emargements" | "veilles" | "qualite" | "risques";

type Props = {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  coffreSlot?: React.ReactNode;
  emargementsSlot?: React.ReactNode;
};

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Préfère un fichier hébergé, sinon la 1re preuve avec href, sinon nextAction. */
function resolveProofHref(ind: {
  proofs: Array<{ href: string | null }>;
  nextAction: { href: string } | null;
}): string | null {
  const isFile = (href: string) =>
    /^https?:\/\//i.test(href) ||
    href.includes("/storage/") ||
    href.includes("/object/") ||
    /\.(pdf|png|jpe?g|webp|md)(\?|#|$)/i.test(href);
  const file = ind.proofs.find((p) => p.href && isFile(p.href));
  if (file?.href) return file.href;
  const first = ind.proofs.find((p) => p.href);
  if (first?.href) return first.href;
  return ind.nextAction?.href ?? null;
}

function criterionGlobalStatus(statuses: QualiopiUiStatus[]): QualiopiUiStatus {
  if (statuses.includes("missing")) return "missing";
  if (statuses.includes("todo")) return "todo";
  if (statuses.every((s) => s === "na")) return "na";
  return "proven";
}

export function QualiopiOverviewV2({ tab, onTabChange, coffreSlot, emargementsSlot }: Props) {
  const [snapshot, setSnapshot] = useState<QualiopiStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "todo">("all");
  const [openCriterion, setOpenCriterion] = useState<number | null>(null);
  const [naEditing, setNaEditing] = useState<number | null>(null);
  const [naDraft, setNaDraft] = useState("");
  const [sstOpen, setSstOpen] = useState(false);
  const [proofGuide, setProofGuide] = useState<{
    indicatorId: number;
    href: string | null;
    label: string;
  } | null>(null);

  const openProofGuide = (
    indicatorId: number,
    href: string | null,
    label = "Ouvrir la preuve",
  ) => {
    setProofGuide({ indicatorId, href, label });
  };

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(
        `/api/super-admin/crm/qualiopi/status${refresh ? "?refresh=1" : ""}`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Statut indisponible");
      setSnapshot(json as QualiopiStatusSnapshot);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === "AbortError"
            ? "Délai dépassé — réessayez"
            : e.message
          : "Erreur",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void load(true);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const criteria = useMemo(() => {
    if (!snapshot) return [];
    return ([1, 2, 3, 4, 5, 6, 7] as const).map((id) => {
      const inds = snapshot.indicators.filter((i) => i.criterionId === id);
      const applicable = inds.filter((i) => i.status !== "na");
      const proven = applicable.filter((i) => i.status === "proven").length;
      const global = criterionGlobalStatus(inds.map((i) => i.status));
      return { id, name: QUALIOPI_CRITERION_NAMES[id], inds, proven, applicable: applicable.length, global };
    });
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || openCriterion != null) return;
    const firstProblem = criteria.find((c) => c.global === "missing" || c.global === "todo");
    setOpenCriterion(firstProblem?.id ?? 1);
  }, [snapshot, criteria, openCriterion]);

  const todoActions = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.indicators
      .filter((i) => i.status === "missing" || i.status === "todo")
      .sort((a, b) => {
        const rank = (s: QualiopiUiStatus) => (s === "missing" ? 0 : 1);
        return rank(a.status) - rank(b.status) || a.indicatorId - b.indicatorId;
      });
  }, [snapshot]);

  const saveNa = async (indicatorId: number) => {
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/compliance/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicatorId, note: naDraft.trim(), kind: "na" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      toast.success(`Justification N/A — ind. ${indicatorId}`);
      setNaEditing(null);
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const exportPdf = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/compliance?format=pdf");
    if (!res.ok) {
      toast.error("Export PDF impossible");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grille-qualiopi-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = snapshot?.summary;
  const proven = s?.proven ?? 0;
  const applicable = s?.applicable ?? 32;
  const todo = s?.todo ?? 0;
  const missing = s?.missing ?? 0;
  const na = s?.na ?? 0;
  const totalSeg = Math.max(1, proven + todo + missing + na);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Vue d’ensemble" },
    { id: "coffre", label: "Coffre administratif" },
    { id: "emargements", label: "Émargements" },
    { id: "veilles", label: "Veilles" },
    { id: "qualite", label: "Réclamations et amélioration" },
    { id: "risques", label: "Risques" },
  ];

  return (
    <div className="space-y-5" style={{ color: TEXT }}>
      <QualiopiSubcontractEditor
        open={sstOpen}
        onClose={() => setSstOpen(false)}
        onSaved={() => void load(true)}
      />
      <QualiopiProofGuide
        open={Boolean(proofGuide)}
        indicatorId={proofGuide?.indicatorId ?? null}
        proofHref={proofGuide?.href ?? null}
        actionLabel={proofGuide?.label}
        onClose={() => setProofGuide(null)}
      />
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight" style={{ fontWeight: 800 }}>
            Qualiopi
          </h1>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>
            Référentiel national qualité · 7 critères · 32 indicateurs
            {applicable < 32
              ? ` · ${applicable} applicables pour Byound (${na} hors périmètre)`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportPdf()}
            className="rounded-full border-[#26304F] bg-transparent text-sm text-white hover:bg-white/5"
          >
            Exporter la grille (PDF)
          </Button>
          <Link
            href="/super/qualiopi/audit"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0A0F1E] hover:bg-white/90"
          >
            <Target className="h-4 w-4" />
            Mode auditeur
          </Link>
          <button
            type="button"
            aria-label="Options"
            onClick={() => void load(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26304F] text-white/70 hover:bg-white/5"
            title="Recalculer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ready card */}
      <section
        className="rounded-[30px] border p-[26px_30px]"
        style={{
          borderColor: "#2A3157",
          background:
            "radial-gradient(120% 140% at 0% 0%, #2A2270 0%, #151B3A 45%, #111831 100%)",
        }}
      >
        {loading && !snapshot ? (
          <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ) : error && !snapshot ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#FF8A9B]">{error}</p>
            <Button size="sm" onClick={() => void load(true)} className="rounded-full bg-white text-[#0A0F1E]">
              Réessayer
            </Button>
          </div>
        ) : snapshot ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium" style={{ color: VIOLET_SOFT }}>
                  Prêt pour l’audit
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-[46px] font-extrabold leading-none tabular-nums">{proven}</span>
                  <span className="text-[26px] font-medium tabular-nums" style={{ color: MUTED }}>
                    / {applicable} applicables prouvés
                  </span>
                </p>
                {na > 0 ? (
                  <p className="mt-2 text-xs" style={{ color: MUTED }}>
                    Score hors N/A · {na} indicateur{na > 1 ? "s" : ""} non
                    applicable{na > 1 ? "s" : ""} exclu{na > 1 ? "s" : ""} du
                    dénominateur
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                {snapshot.audit.at ? (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      snapshot.audit.daysUntil != null && snapshot.audit.daysUntil <= 15
                        ? "bg-[#FF8A9B]/15 text-[#FF8A9B]"
                        : snapshot.audit.daysUntil != null && snapshot.audit.daysUntil <= 60
                          ? "bg-[#F2CF6B]/15 text-[#F2CF6B]"
                          : "bg-white/10 text-white/80",
                    )}
                  >
                    Audit de {snapshot.audit.type}
                    {snapshot.audit.at
                      ? ` · ${new Date(`${snapshot.audit.at}T12:00:00`).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}`
                      : ""}
                    {snapshot.audit.daysUntil != null ? ` · dans ${snapshot.audit.daysUntil} j` : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                    Date d’audit à renseigner (paramètres OF)
                  </span>
                )}
                <div className="flex flex-wrap justify-end gap-1.5">
                  {(Object.keys(snapshot.activities) as QualiopiActivityKey[])
                    .filter(
                      (k) =>
                        snapshot.activities[k] &&
                        (k === "of" || k === "cfa" || k === "vae" || k === "bilan"),
                    )
                    .map((k) => (
                      <span
                        key={k}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          k === "cfa" ? "bg-teal-500/20 text-teal-200" : "bg-white/10 text-white/75",
                        )}
                      >
                        {ACTIVITY_LABELS[k]}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex h-3 w-full gap-[3px] overflow-hidden rounded-full">
              {[
                { n: proven, c: STATUS_COLOR.proven },
                { n: todo, c: STATUS_COLOR.todo },
                { n: missing, c: STATUS_COLOR.missing },
                { n: na, c: STATUS_COLOR.na },
              ].map((seg, i) =>
                seg.n > 0 ? (
                  <div
                    key={i}
                    className="h-full rounded-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(seg.n / totalSeg) * 100}%`, background: seg.c }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: MUTED }}>
              <p>
                <span style={{ color: STATUS_COLOR.proven }}>●</span> {proven} prouvés ·{" "}
                <span style={{ color: STATUS_COLOR.todo }}>●</span> {todo} à compléter ·{" "}
                <span style={{ color: STATUS_COLOR.missing }}>●</span> {missing} preuves manquantes ·{" "}
                <span style={{ color: STATUS_COLOR.na }}>●</span> {na} non applicables
              </p>
              <p>Mis à jour il y a {minutesAgo(snapshot.generatedAt)} min</p>
            </div>
          </>
        ) : null}
      </section>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-full border p-1" style={{ borderColor: BORDER, background: CARD }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === "veilles") {
                window.location.href = "/super/crm/qualiopi/veilles";
                return;
              }
              if (t.id === "qualite") {
                window.location.href = "/super/crm/qualiopi/qualite";
                return;
              }
              if (t.id === "risques") {
                window.location.href = "/super/crm/qualiopi/risques";
                return;
              }
              onTabChange(t.id);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-white text-[#0A0F1E]" : "text-white/60 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "coffre" ? (
        coffreSlot
      ) : tab === "emargements" ? (
        emargementsSlot
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Criteria */}
          <section className="rounded-[24px] border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Les 7 critères</h2>
              <div className="flex gap-1 rounded-full border p-0.5" style={{ borderColor: BORDER }}>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    filter === "all" ? "bg-white text-[#0A0F1E]" : "text-white/55",
                  )}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("todo")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    filter === "todo" ? "bg-white text-[#0A0F1E]" : "text-white/55",
                  )}
                >
                  À traiter {todoActions.length}
                </button>
              </div>
            </div>

            {loading && !snapshot ? (
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {criteria
                  .filter((c) =>
                    filter === "all"
                      ? true
                      : c.inds.some((i) => i.status === "todo" || i.status === "missing"),
                  )
                  .map((c) => {
                    const open = openCriterion === c.id;
                    return (
                      <li key={c.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: BORDER, background: INNER }}>
                        <button
                          type="button"
                          onClick={() => setOpenCriterion(open ? null : c.id)}
                          className="grid w-full grid-cols-[44px_1fr_auto_70px_140px_16px] items-center gap-2 px-3 py-3 text-left"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold" style={{ borderColor: BORDER }}>
                            C{c.id}
                          </span>
                          <span className="truncate text-sm font-semibold">{c.name}</span>
                          <span className="hidden items-center gap-0.5 sm:flex">
                            {c.inds.map((ind) => (
                              <span
                                key={ind.indicatorId}
                                className="inline-block h-2 w-[22px] rounded-sm"
                                style={{ background: STATUS_COLOR[ind.status] }}
                                title={`Ind. ${ind.indicatorId}`}
                              />
                            ))}
                          </span>
                          <span className="text-right text-sm tabular-nums" style={{ color: MUTED }}>
                            {c.proven} / {c.applicable}
                          </span>
                          <span
                            className="justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              color: STATUS_COLOR[c.global],
                              background: `${STATUS_COLOR[c.global]}22`,
                            }}
                          >
                            {c.global === "proven" ? "✓ Prouvé" : STATUS_LABEL[c.global]}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-white/30 transition", open && "rotate-180")} />
                        </button>
                        {open ? (
                          <ul className="space-y-2 border-t px-3 py-3" style={{ borderColor: BORDER }}>
                            {c.inds.map((ind) => {
                              const proofHref = resolveProofHref(ind);
                              return (
                              <li
                                key={ind.indicatorId}
                                className="ml-[80px] rounded-xl px-3 py-2.5"
                                style={{ background: "#FFFFFF05" }}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                        style={{
                                          color: STATUS_COLOR[ind.status],
                                          background: `${STATUS_COLOR[ind.status]}22`,
                                        }}
                                      >
                                        Ind. {ind.indicatorId}
                                        {ind.scopeTag ? ` · ${ind.scopeTag}` : ""}
                                      </span>
                                      <span className="text-sm font-extrabold">{ind.shortTitle}</span>
                                    </div>
                                    {ind.status === "na" ? (
                                      <div className="mt-1.5">
                                        {naEditing === ind.indicatorId ? (
                                          <div className="space-y-2">
                                            <textarea
                                              value={naDraft}
                                              onChange={(e) => setNaDraft(e.target.value)}
                                              rows={2}
                                              className="w-full rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white"
                                              style={{ borderColor: BORDER }}
                                              placeholder="Justification N/A…"
                                            />
                                            <div className="flex gap-2">
                                              <Button size="sm" className="h-7 rounded-full bg-white text-[#0A0F1E]" onClick={() => void saveNa(ind.indicatorId)}>
                                                Enregistrer
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-7 text-white/50" onClick={() => setNaEditing(null)}>
                                                Annuler
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-[12.5px]" style={{ color: MUTED }}>
                                            ◇ {ind.naJustification || "Justification N/A manquante"}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="mt-1 text-[12.5px]" style={{ color: MUTED }}>
                                        ◇{" "}
                                        {ind.proofs[0]
                                          ? `${ind.proofs[0].label}${ind.proofs[0].counter ? ` · ${ind.proofs[0].counter}` : ""}`
                                          : "Aucune preuve automatique"}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <span
                                      className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                                      style={{
                                        color: STATUS_COLOR[ind.status],
                                        borderColor: `${STATUS_COLOR[ind.status]}55`,
                                      }}
                                    >
                                      {STATUS_LABEL[ind.status]}
                                    </span>
                                    {ind.status === "na" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 rounded-full border-[#26304F] text-[11px] text-white"
                                        onClick={() => {
                                          setNaEditing(ind.indicatorId);
                                          setNaDraft(ind.naJustification || "");
                                        }}
                                      >
                                        {ind.naJustification ? "Modifier" : "Justifier"}
                                      </Button>
                                    ) : ind.indicatorId === 27 ? (
                                      <Button
                                        size="sm"
                                        className="h-7 rounded-full px-3 text-[11px] font-semibold"
                                        style={{
                                          background: `${STATUS_COLOR[ind.status]}22`,
                                          color: STATUS_COLOR[ind.status],
                                        }}
                                        onClick={() => setSstOpen(true)}
                                      >
                                        Éditer
                                      </Button>
                                    ) : ind.status === "proven" && proofHref ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openProofGuide(ind.indicatorId, proofHref, "Ouvrir la preuve")
                                        }
                                        className="inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold text-white/80"
                                        style={{ borderColor: BORDER }}
                                      >
                                        Voir la preuve
                                      </button>
                                    ) : ind.nextAction ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openProofGuide(
                                            ind.indicatorId,
                                            ind.nextAction!.href,
                                            ind.nextAction!.label === "Compléter" ||
                                              ind.nextAction!.label === "Ajouter"
                                              ? ind.nextAction!.label
                                              : "Ouvrir la preuve",
                                          )
                                        }
                                        className="inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold"
                                        style={{
                                          background: `${STATUS_COLOR[ind.status]}22`,
                                          color: STATUS_COLOR[ind.status],
                                        }}
                                      >
                                        {ind.nextAction.label}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                                {ind.status === "todo" || ind.status === "missing" ? (
                                  <QualiopiPlanExamples
                                    indicatorId={ind.indicatorId}
                                    compact
                                  />
                                ) : null}
                              </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          {/* Right column */}
          <aside className="space-y-3">
            <section
              className="rounded-[24px] border p-4"
              style={{
                background: `linear-gradient(180deg, rgba(255,138,155,0.08) 0%, ${CARD} 28%)`,
                borderColor: BORDER,
                borderTopWidth: 3,
                borderTopColor: "#FF8A9B",
              }}
            >
              <h3 className="text-sm font-semibold">À faire avant l’audit</h3>
              <ul className="mt-3 space-y-2">
                {todoActions.slice(0, 4).map((item) => (
                  <li key={item.indicatorId} className="flex items-start gap-2 rounded-xl px-2 py-2" style={{ background: INNER }}>
                    <span
                      className="mt-0.5 h-8 w-[3px] shrink-0 rounded-full"
                      style={{ background: STATUS_COLOR[item.status] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold" style={{ color: MUTED }}>
                        Ind. {item.indicatorId}
                        {item.scopeTag ? ` · ${item.scopeTag}` : ""}
                      </p>
                      <p className="text-[13.5px] font-extrabold leading-snug">
                        {item.nextAction?.label || item.shortTitle}
                      </p>
                    </div>
                    {item.indicatorId === 27 ? (
                      <button
                        type="button"
                        onClick={() => setSstOpen(true)}
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: `${STATUS_COLOR[item.status]}22`,
                          color: STATUS_COLOR[item.status],
                        }}
                      >
                        Éditer
                      </button>
                    ) : item.nextAction ? (
                      <button
                        type="button"
                        onClick={() =>
                          openProofGuide(
                            item.indicatorId,
                            resolveProofHref(item) ?? item.nextAction!.href,
                            item.status === "missing"
                              ? "Ajouter"
                              : item.nextAction!.label === "Compléter"
                                ? "Compléter"
                                : "Ouvrir la preuve",
                          )
                        }
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: `${STATUS_COLOR[item.status]}22`,
                          color: STATUS_COLOR[item.status],
                        }}
                      >
                        {item.status === "missing" ? "Ajouter" : item.nextAction.label}
                      </button>
                    ) : null}
                  </li>
                ))}
                {todoActions.length === 0 ? (
                  <p className="text-xs" style={{ color: MUTED }}>
                    Aucune action — checklist claire.
                  </p>
                ) : null}
              </ul>
              {todoActions.length > 4 ? (
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold"
                  style={{ color: VIOLET_SOFT }}
                  onClick={() => setFilter("todo")}
                >
                  Voir les {todoActions.length} actions ›
                </button>
              ) : null}
            </section>

            {[
              {
                title: "Coffre administratif",
                value: snapshot ? `${snapshot.coffre.deposited} / ${snapshot.coffre.expected}` : "—",
                sub: "modèles déposés",
                action: "Déposer",
                onClick: () => onTabChange("coffre"),
                color: VIOLET,
              },
              {
                title: "Émargements horodatés",
                value: snapshot ? `${snapshot.emargements.complete} / ${snapshot.emargements.total}` : "—",
                sub: "sessions complètes",
                action: "Voir",
                onClick: () => onTabChange("emargements"),
                color: "#6BE39B",
              },
              {
                title: "Veilles",
                value: snapshot ? String(snapshot.veilles.toReadThisMonth) : "—",
                sub: "à lire ce mois-ci",
                action: "Ouvrir",
                href: "/super/crm/qualiopi/veilles",
                color: "#F2CF6B",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-[24px] border p-4" style={{ background: CARD, borderColor: BORDER }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: `${card.color}22`, color: card.color }}>
                      ◆
                    </span>
                    <p className="text-sm font-semibold">{card.title}</p>
                  </div>
                  {card.href ? (
                    <Link href={card.href} className="text-xs font-semibold" style={{ color: VIOLET_SOFT }}>
                      {card.action}
                    </Link>
                  ) : (
                    <button type="button" onClick={card.onClick} className="text-xs font-semibold" style={{ color: VIOLET_SOFT }}>
                      {card.action}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-2xl font-extrabold tabular-nums">{card.value}</p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
