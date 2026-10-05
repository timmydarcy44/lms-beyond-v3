"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QualiopiComplianceSnapshot, QualiopiComplianceStatus } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";
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

type Props = {
  className?: string;
  refreshKey?: number;
};

export function QualiopiRnqPanel({ className, refreshKey = 0 }: Props) {
  const [snapshot, setSnapshot] = useState<QualiopiComplianceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attestingId, setAttestingId] = useState<number | null>(null);

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

  const setAttestation = async (indicatorId: number, action: "validate" | "revoke") => {
    setAttestingId(indicatorId);
    try {
      if (action === "validate") {
        const note = window.prompt(
          "Preuve ou référence (optionnel) — ex. registre papier, URL, date de comité qualité :",
        );
        if (note === null) return;
        const res = await fetch("/api/super-admin/crm/qualiopi/compliance/attestations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ indicatorId, note: note.trim() || undefined }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Attestation impossible");
        toast.success(`Indicateur ${indicatorId} marqué validé (attestation)`);
      } else {
        const res = await fetch(
          `/api/super-admin/crm/qualiopi/compliance/attestations?indicatorId=${indicatorId}`,
          { method: "DELETE" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Retrait impossible");
        toast.success(`Attestation retirée — recalcul automatique`);
      }
      await loadCompliance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAttestingId(null);
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
        status: (ind.compliance?.status ?? "missing") as QualiopiComplianceStatus,
      })),
    );
  }, [criteria]);

  const readiness = snapshot?.summary.readinessPercent ?? 0;

  return (
    <section className={cn(QUALIOPI_CARD, "p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Référentiel national Qualiopi</h2>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            7 critères · {QUALIOPI_INDICATOR_COUNT} indicateurs · automatisé + relecture produit
          </p>
        </div>
        <span className="rounded-full border border-[#3D7BFF]/30 bg-[#3D7BFF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9EC0FF]">
          RNQ v9
        </span>
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
                <p className="mt-1 text-sm font-medium text-white/90">Dossier à consolider avant audit</p>
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

          <p className={cn("mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]", QUALIOPI_MUTED)}>
            <span>
              {snapshot.runtime.coreDocsUploaded}/{snapshot.runtime.coreDocsTotal} modèles admin
            </span>
            <span>{snapshot.runtime.sessionsTotal} sessions</span>
            <span>{snapshot.runtime.sessionsWithSignedAttendance} émargement complet</span>
            <span>{snapshot.runtime.satisfactionResponses} satisfaction</span>
            {"attestationsCount" in snapshot.runtime && snapshot.runtime.attestationsCount > 0 ? (
              <span>{snapshot.runtime.attestationsCount} attestation(s) manuelle(s)</span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-[#7BA7FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3D7BFF]" />
              Données live
            </span>
          </p>

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
                    <span className="hidden shrink-0 gap-0.5 sm:flex">
                      {criterion.indicators.map((ind) => {
                        const st = (ind.compliance?.status ?? "missing") as QualiopiComplianceStatus;
                        return (
                          <span
                            key={ind.id}
                            className={cn("h-2 w-3 rounded-[2px]", STATUS_SEGMENT[st])}
                          />
                        );
                      })}
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
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={attestingId === ind.id}
                                className="h-7 border-white/15 bg-transparent text-[11px] text-white/80 hover:bg-white/10"
                                onClick={() => void setAttestation(ind.id, "validate")}
                              >
                                {attestingId === ind.id ? "…" : "Marquer validé (preuve hors Byound)"}
                              </Button>
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
            <strong className="text-white/60">Validé :</strong> preuves Byound (coffre, envoi pack, émargement complet,
            satisfaction…) ou attestation manuelle avec note. <strong className="text-white/60">Partiel :</strong>{" "}
            suivez la ligne « → » sous l&apos;indicateur pour passer en validé automatiquement.{" "}
            <strong className="text-white/60">Non couvert :</strong> processus hors produit — attestation ou preuve
            externe. L&apos;audit certificateur reste décisionnaire.
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
