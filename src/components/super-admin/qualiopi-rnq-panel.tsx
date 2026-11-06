"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QualiopiComplianceSnapshot, QualiopiComplianceStatus } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { QUALIOPI_OF_NA_INDICATORS } from "@/lib/qualiopi/qualiopi-of-b2b";
import { QUALIOPI_INDICATOR_COUNT } from "@/lib/qualiopi/qualiopi-rnq-reference";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_KICKER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

const STATUS_SEGMENT: Record<QualiopiComplianceStatus, string> = {
  validated: "bg-[#3D7BFF]",
  partial: "bg-amber-500/85",
  missing: "bg-white/10",
};

const STATUS_BADGE: Record<
  QualiopiComplianceStatus,
  { short: string; className: string }
> = {
  validated: { short: "validé", className: "bg-[#3D7BFF]/20 text-[#9EC0FF] border-[#3D7BFF]/30" },
  partial: { short: "partiel", className: "bg-amber-500/15 text-amber-200 border-amber-500/25" },
  missing: { short: "manquant", className: "bg-white/5 text-white/45 border-white/10" },
};

const NA_IDS = new Set(QUALIOPI_OF_NA_INDICATORS.map((i) => i.id));

const NEXT_HREF: Record<string, string> = {
  coffre: "/super/crm/qualiopi",
  veille: "/super/crm/qualiopi/veilles",
  qualite: "/super/crm/qualiopi/qualite",
  process: "/super/crm/qualiopi/process",
  formateurs: "/super/crm/qualiopi/formateurs",
  catalogue: "/super/crm/qualiopi/catalogue",
  pilot: "/super/crm/qualiopi/pilote",
  experts: "/super/experts",
  formations: "/super/crm/formations",
};

function guessHref(nextStep?: string): string | null {
  if (!nextStep) return null;
  const t = nextStep.toLowerCase();
  if (t.includes("veille")) return NEXT_HREF.veille;
  if (t.includes("réclamation") || t.includes("paq") || t.includes("qualité")) return NEXT_HREF.qualite;
  if (t.includes("formateur") || t.includes("compétences")) return NEXT_HREF.formateurs;
  if (t.includes("process") || t.includes("handicap") || t.includes("moyens")) return NEXT_HREF.process;
  if (t.includes("catalogue") || t.includes("objectif")) return NEXT_HREF.catalogue;
  if (t.includes("expert")) return NEXT_HREF.experts;
  if (t.includes("session") || t.includes("pipeline") || t.includes("émarg")) return NEXT_HREF.formations;
  if (t.includes("coffre") || t.includes("convention") || t.includes("livret")) return NEXT_HREF.coffre;
  if (t.includes("n/a") || t.includes("attester")) return null;
  return NEXT_HREF.pilot;
}

type Props = {
  className?: string;
  refreshKey?: number;
};

export function QualiopiRnqPanel({ className, refreshKey = 0 }: Props) {
  const [snapshot, setSnapshot] = useState<QualiopiComplianceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attestingId, setAttestingId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadCompliance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/compliance");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Audit indisponible");
      setSnapshot(json as QualiopiComplianceSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompliance();
  }, [refreshKey, loadCompliance]);

  const setAttestation = async (
    indicatorId: number,
    action: "validate" | "revoke" | "na",
  ) => {
    setAttestingId(indicatorId);
    try {
      if (action === "revoke") {
        const res = await fetch(
          `/api/super-admin/crm/qualiopi/compliance/attestations?indicatorId=${indicatorId}`,
          { method: "DELETE" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Retrait impossible");
        toast.success(`Attestation retirée — recalcul automatique`);
      } else {
        let note: string | undefined;
        if (action === "na") {
          note = QUALIOPI_OF_NA_INDICATORS.find((i) => i.id === indicatorId)?.note;
        } else {
          const typed = window.prompt(
            "Preuve ou référence — ex. fichier, URL, date de comité qualité :",
          );
          if (typed === null) return;
          note = typed.trim() || undefined;
        }
        const res = await fetch("/api/super-admin/crm/qualiopi/compliance/attestations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ indicatorId, note }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Attestation impossible");
        toast.success(
          action === "na"
            ? `Indicateur ${indicatorId} attesté N/A OF B2B`
            : `Indicateur ${indicatorId} marqué validé (preuve)`,
        );
      }
      await loadCompliance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAttestingId(null);
    }
  };

  const attestAllNa = async () => {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/compliance/attestations/bulk-na", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      toast.success(`N/A OF B2B attestés : ${(json.attested as number[]).join(", ")}`);
      await loadCompliance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBulkBusy(false);
    }
  };

  const criteria = useMemo(
    () => (snapshot ? mergeComplianceIntoCriteria(snapshot) : null),
    [snapshot],
  );

  const flatIndicators = useMemo(() => {
    if (!criteria) return [];
    return criteria.flatMap((c) =>
      c.indicators.map((ind) => ({
        id: ind.id,
        title: ind.title,
        status: (ind.compliance?.status ?? "missing") as QualiopiComplianceStatus,
        nextStep: ind.compliance?.nextStep,
        reason: ind.compliance?.reason,
      })),
    );
  }, [criteria]);

  const todoList = useMemo(() => {
    return flatIndicators
      .filter((i) => i.status !== "validated")
      .sort((a, b) => {
        const rank = (s: QualiopiComplianceStatus) => (s === "missing" ? 0 : 1);
        return rank(a.status) - rank(b.status) || a.id - b.id;
      });
  }, [flatIndicators]);

  const readiness = snapshot?.summary.readinessPercent ?? 0;

  return (
    <section className={cn(QUALIOPI_CARD, "p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Référentiel national Qualiopi</h2>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            7 critères · {QUALIOPI_INDICATOR_COUNT} indicateurs · checklist audit OF B2B
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => void attestAllNa()}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            {bulkBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Attester N/A OF B2B
          </Button>
          <Link
            href="/super/crm/qualiopi/pilote"
            className="inline-flex h-8 items-center rounded-md border border-[#6E5BFF]/40 bg-[#6E5BFF]/15 px-3 text-xs font-semibold text-[#d9d4ff] hover:bg-[#6E5BFF]/25"
          >
            Session pilote
          </Link>
        </div>
      </div>

      {loading ? (
        <p className={cn("mt-8 flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyse en cours…
        </p>
      ) : error ? (
        <p className="mt-8 text-sm text-rose-300">{error}</p>
      ) : snapshot ? (
        <>
          <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
            <div className={cn(QUALIOPI_CARD_INNER, "flex items-center gap-5 p-4 sm:p-5")}>
              <div
                className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#3D7BFF ${readiness * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              >
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#0b0e18] text-xl font-bold tabular-nums text-white">
                  {readiness}%
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EC0FF]/90">
                  Prêt audit (estimé)
                </p>
                <p className="mt-1 text-sm font-medium text-white/90">
                  {todoList.length === 0 ? "Checklist vide — dossier prêt" : `${todoList.length} point(s) à traiter`}
                </p>
                <p className={cn("mt-1 text-xs leading-relaxed", QUALIOPI_MUTED)}>
                  validés + moitié des partiels sur {snapshot.summary.total} indicateurs
                </p>
              </div>
            </div>

            <StatTile
              label="Validés"
              value={snapshot.summary.validated}
              suffix={`sur ${snapshot.summary.total}`}
              dotClass="bg-[#3D7BFF]"
            />
            <StatTile
              label="Partiels"
              value={snapshot.summary.partial}
              suffix="preuves à compléter"
              dotClass="bg-amber-400"
            />
            <StatTile
              label="Non couverts"
              value={snapshot.summary.missing}
              suffix="processus à créer"
              dotClass="border border-white/25 bg-transparent"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-1">
            {flatIndicators.map((ind) => (
              <span
                key={ind.id}
                title={`Indicateur ${ind.id}`}
                className={cn("h-2.5 flex-1 min-w-[6px] max-w-[14px] rounded-sm", STATUS_SEGMENT[ind.status])}
              />
            ))}
          </div>

          {todoList.length > 0 ? (
            <div className={cn(QUALIOPI_CARD_INNER, "mt-6 p-4")}>
              <h3 className="text-sm font-semibold text-white">À faire pour l’audit</h3>
              <p className={cn("mt-1 text-xs", QUALIOPI_MUTED)}>
                Tri missing → partial. Liens vers le module concerné.
              </p>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {todoList.slice(0, 16).map((item) => {
                  const href = guessHref(item.nextStep);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-white">
                          Ind. {item.id}
                          <span
                            className={cn(
                              "ml-2 rounded-full border px-1.5 py-0.5 text-[10px] uppercase",
                              STATUS_BADGE[item.status].className,
                            )}
                          >
                            {STATUS_BADGE[item.status].short}
                          </span>
                        </span>
                        <p className={cn("mt-0.5 text-xs", QUALIOPI_MUTED)}>
                          {item.nextStep || item.reason || item.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {NA_IDS.has(item.id) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={attestingId === item.id}
                            className="h-7 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-100"
                            onClick={() => void setAttestation(item.id, "na")}
                          >
                            N/A
                          </Button>
                        ) : null}
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex h-7 items-center rounded-md border border-white/15 px-2 text-[11px] text-white/80 hover:bg-white/5"
                          >
                            Ouvrir
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 space-y-2">
            {criteria?.map((criterion) => {
              const counts = criterion.indicators.reduce(
                (acc, ind) => {
                  const s = (ind.compliance?.status ?? "missing") as QualiopiComplianceStatus;
                  acc[s] += 1;
                  return acc;
                },
                { validated: 0, partial: 0, missing: 0 },
              );
              const shortTitle = criterion.title.split(".")[0] ?? criterion.title;
              return (
                <details
                  key={criterion.id}
                  className={cn("group", QUALIOPI_CARD_INNER, "overflow-hidden open:bg-white/[0.05]")}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/80">
                      {criterion.id}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">
                        Critère {criterion.id} · {criterion.indicators.length} indicateur
                        {criterion.indicators.length > 1 ? "s" : ""}
                      </span>
                      <span className={cn("mt-0.5 block truncate text-xs", QUALIOPI_MUTED)}>{shortTitle}</span>
                    </span>
                    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-[10px] font-medium">
                      {counts.partial > 0 ? (
                        <span className={cn("rounded-full border px-2 py-0.5", STATUS_BADGE.partial.className)}>
                          {counts.partial} partiel
                        </span>
                      ) : null}
                      {counts.missing > 0 ? (
                        <span className={cn("rounded-full border px-2 py-0.5", STATUS_BADGE.missing.className)}>
                          {counts.missing} manquant
                        </span>
                      ) : null}
                      {counts.validated > 0 ? (
                        <span className={cn("rounded-full border px-2 py-0.5", STATUS_BADGE.validated.className)}>
                          {counts.validated} OK
                        </span>
                      ) : null}
                      <ChevronDown className="h-4 w-4 text-white/30 transition group-open:rotate-180" />
                    </span>
                  </summary>
                  <ul className="space-y-2 border-t border-white/[0.06] px-4 py-3">
                    {criterion.indicators.map((ind) => {
                      const c = ind.compliance;
                      const st = (c?.status ?? "missing") as QualiopiComplianceStatus;
                      const badge = STATUS_BADGE[st];
                      const href = guessHref(c?.nextStep);
                      return (
                        <li key={ind.id} className={cn("px-3 py-2.5 text-sm", QUALIOPI_CARD_INNER)}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium text-white/90">
                              {ind.title}{" "}
                              <span className="font-normal text-white/45">— {ind.summary}</span>
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                badge.className,
                              )}
                            >
                              {st === "validated" && c?.validatedSource === "attestation"
                                ? "validé · attestation"
                                : badge.short}
                            </span>
                          </div>
                          {c?.reason ? (
                            <p className={cn("mt-2 text-xs leading-relaxed", QUALIOPI_MUTED)}>{c.reason}</p>
                          ) : null}
                          {c?.attestationNote ? (
                            <p className="mt-1 text-xs text-emerald-200/80">Preuve : {c.attestationNote}</p>
                          ) : null}
                          {c?.nextStep ? (
                            <p className="mt-1 text-xs font-medium text-[#9EC0FF]">→ {c.nextStep}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {st !== "validated" ? (
                              <>
                                {NA_IDS.has(ind.id) ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={attestingId === ind.id}
                                    className="h-7 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-100 hover:bg-amber-500/20"
                                    onClick={() => void setAttestation(ind.id, "na")}
                                  >
                                    Attester N/A
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={attestingId === ind.id}
                                  className="h-7 border-white/15 bg-transparent text-[11px] text-white/80 hover:bg-white/10"
                                  onClick={() => void setAttestation(ind.id, "validate")}
                                >
                                  {attestingId === ind.id ? "…" : "Attester avec preuve"}
                                </Button>
                                {href ? (
                                  <Link
                                    href={href}
                                    className="inline-flex h-7 items-center rounded-md border border-[#3D7BFF]/30 bg-[#3D7BFF]/10 px-2 text-[11px] text-[#9EC0FF] hover:bg-[#3D7BFF]/20"
                                  >
                                    Ouvrir le module
                                  </Link>
                                ) : null}
                              </>
                            ) : c?.validatedSource === "attestation" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={attestingId === ind.id}
                                className="h-7 text-[11px] text-white/45 hover:text-white/70"
                                onClick={() => void setAttestation(ind.id, "revoke")}
                              >
                                Retirer l&apos;attestation
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </div>

          <p className={cn("mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed", QUALIOPI_MUTED)}>
            <span className="font-semibold text-white/70">Méthode — </span>
            <strong className="text-white/60">N/A OF B2B :</strong> indicateurs hors périmètre (RNCP, CFA…).{" "}
            <strong className="text-white/60">Preuve :</strong> note + fichier / module Byound. L&apos;audit
            certificateur reste décisionnaire.
          </p>
        </>
      ) : null}
    </section>
  );
}

function StatTile({
  label,
  value,
  suffix,
  dotClass,
}: {
  label: string;
  value: number;
  suffix: string;
  dotClass: string;
}) {
  return (
    <div className={cn(QUALIOPI_CARD_INNER, "p-4")}>
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotClass)} />
        <p className={QUALIOPI_KICKER}>{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white">{value}</p>
      <p className={cn("text-xs", QUALIOPI_MUTED)}>{suffix}</p>
    </div>
  );
}
