"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Target, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

import type { ParsedProfileAnalysisSections } from "@/lib/learner/profile-analysis";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { cn } from "@/lib/utils";

type TabId = "portrait" | "objectif" | "forces" | "priorites";

function summaryToBullets(summary: string): string[] {
  const cleaned = summary.replace(/\*\*/g, "").trim();
  const parts = cleaned.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [];
  if (parts.length >= 2) return parts.slice(0, 5);
  if (cleaned.length > 180) {
    return [cleaned.slice(0, 180).trim() + "…", cleaned.slice(180, 360).trim()].filter(Boolean);
  }
  return cleaned ? [cleaned] : [];
}

function InsightList({ items, tone }: { items: string[]; tone: "strength" | "improve" }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.slice(0, 20)}`}
          className="flex gap-3 rounded-xl border border-white/[0.07] bg-[#0a0c12]/80 px-3.5 py-3"
        >
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
              tone === "strength" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200",
            )}
          >
            {index + 1}
          </span>
          <p className="text-[14px] leading-relaxed text-white/78">{item}</p>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  objectiveLabel?: string | null;
  sections: ParsedProfileAnalysisSections | null;
  analysisLoading: boolean;
  hasCrossContent: boolean;
};

export function CrossReadingPanel({
  objectiveLabel,
  sections,
  analysisLoading,
  hasCrossContent,
}: Props) {
  const tabs = useMemo(() => {
    const list: Array<{ id: TabId; label: string; icon: ReactNode; badge?: number }> = [];
    if (sections?.summary || analysisLoading) {
      list.push({ id: "portrait", label: "Portrait", icon: <Sparkles className="h-3.5 w-3.5" /> });
    }
    if (sections?.orientation) {
      list.push({ id: "objectif", label: "Vers l'objectif", icon: <Target className="h-3.5 w-3.5" /> });
    }
    if (sections?.strengths.length) {
      list.push({
        id: "forces",
        label: "Forces",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        badge: sections.strengths.length,
      });
    }
    if (sections?.improvements.length) {
      list.push({
        id: "priorites",
        label: "Priorités",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        badge: sections.improvements.length,
      });
    }
    return list;
  }, [sections, analysisLoading]);

  const [active, setActive] = useState<TabId>("portrait");

  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.id === active)) {
      setActive(tabs[0].id);
    }
  }, [tabs, active]);

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Lecture croisée
          </p>
          {objectiveLabel ? (
            <p className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.55rem]">
              {objectiveLabel}
            </p>
          ) : (
            <p className="mt-2 text-[1.2rem] font-semibold text-white/45">Objectif professionnel à définir</p>
          )}
        </div>
        <Link
          href={PROFIL_EDGE_SECTION_HREFS.projet}
          className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#3D7BFF]/35 bg-[#3D7BFF]/10 px-4 py-2 text-[13px] font-semibold text-[#9EC0FF] transition hover:bg-[#3D7BFF]/20"
        >
          Modifier mon objectif
        </Link>
      </div>

      {!hasCrossContent ? (
        <div className="px-5 py-8 sm:px-6">
          <p className="max-w-lg text-[14px] leading-relaxed text-white/45">
            Passez DISC, IDMC et Soft skills pour obtenir une lecture personnalisée de votre profil.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex gap-1 overflow-x-auto px-4 pt-4 sm:px-5"
            role="tablist"
            aria-label="Parties de la lecture croisée"
          >
            {tabs.map((tab) => {
              const selected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition",
                    selected
                      ? "bg-white text-[#0a0c12]"
                      : "bg-white/[0.06] text-white/65 hover:bg-white/[0.1] hover:text-white",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge != null ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        selected ? "bg-[#0a0c12]/10 text-[#0a0c12]" : "bg-white/10 text-white/70",
                      )}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="min-h-[12rem] px-5 py-6 sm:px-6 sm:py-7" role="tabpanel">
            {active === "portrait" ? (
              analysisLoading && !sections?.summary ? (
                <div className="space-y-3" aria-busy="true">
                  <div className="h-4 w-[90%] animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-[80%] animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-[65%] animate-pulse rounded bg-white/10" />
                </div>
              ) : sections?.summary ? (
                <ul className="space-y-3 border-l-2 border-[#3D7BFF]/40 pl-4">
                  {summaryToBullets(sections.summary).map((line, i) => (
                    <li
                      key={`sum-${i}`}
                      className={cn(
                        "text-[14px] leading-relaxed text-white/80",
                        i === 0 && "text-[15px] font-medium text-white",
                      )}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-white/45">Synthèse en cours de génération…</p>
              )
            ) : null}

            {active === "objectif" && sections?.orientation ? (
              <ul className="space-y-2.5">
                {summaryToBullets(sections.orientation)
                  .slice(0, 4)
                  .map((line, i) => (
                    <li key={`ori-${i}`} className="text-[14px] leading-relaxed text-white/75">
                      {line}
                    </li>
                  ))}
              </ul>
            ) : null}

            {active === "forces" && sections?.strengths.length ? (
              <InsightList items={sections.strengths} tone="strength" />
            ) : null}

            {active === "priorites" && sections?.improvements.length ? (
              <InsightList items={sections.improvements} tone="improve" />
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
