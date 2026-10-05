"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { QualiopiComplianceSnapshot } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { QUALIOPI_INDICATOR_COUNT } from "@/lib/qualiopi/qualiopi-rnq-reference";
import { cn } from "@/lib/utils";

const STATUS_META = {
  validated: {
    label: "Validé (produit + données)",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  partial: {
    label: "Partiel",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  missing: {
    label: "Non couvert",
    className: "border-gray-200 bg-gray-100 text-gray-700",
  },
} as const;

export function QualiopiRnqPanel({ className }: { className?: string }) {
  const [snapshot, setSnapshot] = useState<QualiopiComplianceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/super-admin/crm/qualiopi/compliance");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Audit indisponible");
        if (!cancelled) setSnapshot(json as QualiopiComplianceSnapshot);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const criteria = useMemo(
    () => (snapshot ? mergeComplianceIntoCriteria(snapshot) : null),
    [snapshot],
  );

  return (
    <section className={cn("rounded-2xl border border-gray-200 bg-white p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Référentiel national Qualiopi</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            7 critères · {QUALIOPI_INDICATOR_COUNT} indicateurs — état d’avancement Byound (automatisé +
            relecture produit).
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          RNQ
        </span>
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyse en cours…
        </p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : snapshot ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Prêt audit (estimé)" value={`${snapshot.summary.readinessPercent} %`} />
            <SummaryCard
              label="Validé"
              value={String(snapshot.summary.validated)}
              sub={`sur ${snapshot.summary.total} indicateurs`}
              tone="green"
            />
            <SummaryCard label="Partiel" value={String(snapshot.summary.partial)} tone="amber" />
            <SummaryCard label="Non couvert" value={String(snapshot.summary.missing)} tone="gray" />
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Données live : {snapshot.runtime.coreDocsUploaded}/{snapshot.runtime.coreDocsTotal} modèles
            admin · {snapshot.runtime.sessionsTotal} session(s) · {snapshot.runtime.sessionsWithSignedAttendance}{" "}
            avec émargement complet · {snapshot.runtime.satisfactionResponses} satisfaction(s).
          </p>

          <div className="mt-6 space-y-3">
            {criteria?.map((criterion) => {
              const counts = criterion.indicators.reduce(
                (acc, ind) => {
                  const s = ind.compliance?.status ?? "missing";
                  acc[s] += 1;
                  return acc;
                },
                { validated: 0, partial: 0, missing: 0 },
              );
              return (
                <details
                  key={criterion.id}
                  className="group rounded-xl border border-gray-100 bg-gray-50/80 open:bg-white open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    <span>
                      <span className="text-indigo-600">Critère {criterion.id}</span>
                      <span className="mt-0.5 block font-normal text-gray-600">{criterion.title}</span>
                    </span>
                    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-[10px] font-medium">
                      {counts.validated > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                          {counts.validated} OK
                        </span>
                      ) : null}
                      {counts.partial > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                          {counts.partial} partiel
                        </span>
                      ) : null}
                      {counts.missing > 0 ? (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
                          {counts.missing} manquant
                        </span>
                      ) : null}
                      <ChevronDown className="h-4 w-4 text-gray-400 transition group-open:rotate-180" />
                    </span>
                  </summary>
                  <ul className="space-y-2 border-t border-gray-100 px-4 py-3">
                    {criterion.indicators.map((ind) => {
                      const c = ind.compliance;
                      const st = c?.status ?? "missing";
                      const meta = STATUS_META[st];
                      return (
                        <li
                          key={ind.id}
                          className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium text-gray-900">
                              {ind.title}{" "}
                              <span className="font-normal text-gray-500">— {ind.summary}</span>
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                meta.className,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          {c?.reason ? (
                            <p className="mt-2 text-xs leading-relaxed text-gray-600">{c.reason}</p>
                          ) : null}
                          {c?.nextStep ? (
                            <p className="mt-1 text-xs font-medium text-indigo-700">→ {c.nextStep}</p>
                          ) : null}
                          {ind.productHint ? (
                            <p className="mt-1 text-[11px] text-gray-400">Byound : {ind.productHint}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </div>

          <p className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
            <strong className="text-gray-800">Méthode :</strong> « Validé » = fonctionnalité + preuves en base
            (ex. émargements signés). « Partiel » = brique produit ou contenu type, preuve audit à compléter.
            « Non couvert » = processus ou registre à créer hors ou dans Byound. Un audit certificateur reste
            décisionnaire.
          </p>
        </>
      ) : null}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "green" | "amber" | "gray";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-800"
        : tone === "gray"
          ? "text-gray-700"
          : "text-indigo-700";
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", toneClass)}>{value}</p>
      {sub ? <p className="text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}
