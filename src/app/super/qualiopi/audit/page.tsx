"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUALIOPI_CRITERION_NAMES } from "@/lib/qualiopi/indicators";
import type { QualiopiStatusSnapshot, QualiopiUiStatus } from "@/lib/qualiopi/status-types";
import { cn } from "@/lib/utils";

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

export default function QualiopiAuditorModePage() {
  const [snapshot, setSnapshot] = useState<QualiopiStatusSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/status");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Indisponible");
      setSnapshot(json as QualiopiStatusSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const indicators = snapshot?.indicators ?? [];
  const current = indicators[index] ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(indicators.length - 1, i + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "Escape") {
        window.location.href = "/super/crm/qualiopi";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indicators.length]);

  const byCriterion = useMemo(() => {
    const map = new Map<number, typeof indicators>();
    for (const ind of indicators) {
      const list = map.get(ind.criterionId) ?? [];
      list.push(ind);
      map.set(ind.criterionId, list);
    }
    return map;
  }, [indicators]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0A0F1E", color: "#F2F4FA" }}>
      <header className="flex items-center justify-between border-b border-[#1A2340] px-5 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9C2FF]">Mode auditeur</p>
          <p className="text-sm text-[#9AA3BD]">
            Indicateur {Math.min(index + 1, 32)} sur 32 — flèches clavier pour naviguer
          </p>
        </div>
        <Link
          href="/super/crm/qualiopi"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#26304F] px-3 text-sm text-white/80 hover:bg-white/5"
        >
          <X className="h-4 w-4" />
          Quitter
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-64 shrink-0 overflow-y-auto border-r border-[#1A2340] p-3 md:block">
          {([1, 2, 3, 4, 5, 6, 7] as const).map((cid) => (
            <div key={cid} className="mb-3">
              <p className="mb-1 px-2 text-[11px] font-semibold text-[#9AA3BD]">
                C{cid} · {QUALIOPI_CRITERION_NAMES[cid]}
              </p>
              <ul className="space-y-0.5">
                {(byCriterion.get(cid) ?? []).map((ind) => {
                  const idx = indicators.findIndex((i) => i.indicatorId === ind.indicatorId);
                  return (
                    <li key={ind.indicatorId}>
                      <button
                        type="button"
                        onClick={() => setIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs",
                          idx === index ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5",
                        )}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: STATUS_COLOR[ind.status] }}
                        />
                        Ind. {ind.indicatorId}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          {error ? (
            <div className="m-6 rounded-2xl border border-[#FF8A9B]/30 bg-[#FF8A9B]/10 p-4 text-[#FF8A9B]">
              {error}
              <Button size="sm" className="ml-3 rounded-full bg-white text-[#0A0F1E]" onClick={() => void load()}>
                Réessayer
              </Button>
            </div>
          ) : !current ? (
            <div className="m-6 h-40 animate-pulse rounded-2xl bg-white/5" />
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto p-6 sm:p-8">
              <div className="mx-auto w-full max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      color: STATUS_COLOR[current.status],
                      background: `${STATUS_COLOR[current.status]}22`,
                    }}
                  >
                    Ind. {current.indicatorId}
                    {current.scopeTag ? ` · ${current.scopeTag}` : ""}
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: STATUS_COLOR[current.status],
                      borderColor: `${STATUS_COLOR[current.status]}55`,
                    }}
                  >
                    {STATUS_LABEL[current.status]}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{current.shortTitle}</h1>
                <p className="mt-1 text-sm text-[#9AA3BD]">
                  Critère {current.criterionId} ·{" "}
                  {QUALIOPI_CRITERION_NAMES[current.criterionId as 1 | 2 | 3 | 4 | 5 | 6 | 7]}
                </p>

                {(current.helpWhere || current.helpHow) && (
                  <div className="mt-6 rounded-2xl border border-[#1A2340] bg-[#111831] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#C9C2FF]">
                      Aide auditeur
                    </p>
                    {current.helpWhere ? (
                      <p className="mt-2 text-sm text-[#9AA3BD]">
                        <span className="font-semibold text-white/80">Où — </span>
                        {current.helpWhere}
                      </p>
                    ) : null}
                    {current.helpHow ? (
                      <p className="mt-1 text-sm text-[#9AA3BD]">
                        <span className="font-semibold text-white/80">Comment — </span>
                        {current.helpHow}
                      </p>
                    ) : null}
                  </div>
                )}

                {current.status === "na" ? (
                  <div className="mt-6 rounded-2xl border border-[#3A4566] bg-[#0B1122] p-4 text-sm text-[#9AA3BD]">
                    Non applicable — {current.naJustification || "Justification à renseigner."}
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#C9C2FF]">Preuves</p>
                    {current.proofs.length === 0 ? (
                      <p className="text-sm text-[#9AA3BD]">
                        Aucune preuve automatique — dépôt manuel ou module à compléter.
                        {current.indicatorId === 26
                          ? " (Handicap : registre anonymisé uniquement dans ce mode.)"
                          : ""}
                      </p>
                    ) : (
                      current.proofs.map((p, i) => (
                        <div
                          key={`${p.label}-${i}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1A2340] bg-[#111831] px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">{p.label}</p>
                            {p.counter ? (
                              <p className="text-xs text-[#9AA3BD]">{p.counter}</p>
                            ) : null}
                          </div>
                          {p.href ? (
                            <Link
                              href={p.href}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0A0F1E]"
                            >
                              Ouvrir
                            </Link>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <footer className="flex items-center justify-between border-t border-[#1A2340] px-5 py-3">
            <Button
              variant="outline"
              className="rounded-full border-[#26304F] bg-transparent text-white"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Précédent
            </Button>
            <span className="text-xs tabular-nums text-[#9AA3BD]">
              {index + 1} / {indicators.length || 32}
            </span>
            <Button
              variant="outline"
              className="rounded-full border-[#26304F] bg-transparent text-white"
              disabled={index >= indicators.length - 1}
              onClick={() => setIndex((i) => Math.min(indicators.length - 1, i + 1))}
            >
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </footer>
        </main>
      </div>
    </div>
  );
}
