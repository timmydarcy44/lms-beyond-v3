"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

import type { TrainingCenterSkillRow } from "@/components/apprenant/profil-edge/coaching-skills";
import { bucketLabelFr } from "@/components/apprenant/profil-edge/coaching-skills";
import type { CareerSkillBucket } from "@/lib/career-profiles/career-profile-matching";
import { levelBarColor } from "@/lib/apprenant/edge-skill-gap-visuals";
import { cn } from "@/lib/utils";

type Props = {
  rows: TrainingCenterSkillRow[];
  onSelect: (row: TrainingCenterSkillRow) => void;
};

type FilterKey = "all" | CareerSkillBucket;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Toutes",
  develop: "À développer",
  consolidate: "À consolider",
  unevaluated: "À évaluer",
  strength: "Forces",
};

function bucketCardStyles(bucket: TrainingCenterSkillRow["bucket"]) {
  switch (bucket) {
    case "develop":
      return {
        border: "border-rose-500/20 hover:border-rose-400/45",
        bg: "bg-gradient-to-br from-rose-500/[0.08] to-white/[0.02]",
        ring: "group-hover:shadow-[0_0_0_1px_rgba(251,113,133,0.25)]",
      };
    case "consolidate":
      return {
        border: "border-amber-500/25 hover:border-amber-400/45",
        bg: "bg-gradient-to-br from-amber-500/[0.09] to-white/[0.02]",
        ring: "group-hover:shadow-[0_0_0_1px_rgba(251,191,36,0.2)]",
      };
    case "unevaluated":
      return {
        border: "border-white/[0.1] hover:border-[#3D7BFF]/35",
        bg: "bg-gradient-to-br from-white/[0.05] to-transparent",
        ring: "group-hover:shadow-[0_8px_32px_rgba(61,123,255,0.12)]",
      };
    default:
      return {
        border: "border-emerald-500/20 hover:border-emerald-400/40",
        bg: "bg-gradient-to-br from-emerald-500/[0.1] to-white/[0.02]",
        ring: "group-hover:shadow-[0_0_0_1px_rgba(52,211,153,0.25)]",
      };
  }
}

function BucketPill({ bucket }: { bucket: TrainingCenterSkillRow["bucket"] }) {
  const tone =
    bucket === "develop"
      ? "bg-rose-500/15 text-rose-100 ring-rose-500/30"
      : bucket === "consolidate"
        ? "bg-amber-500/15 text-amber-50 ring-amber-500/30"
        : bucket === "unevaluated"
          ? "bg-white/[0.08] text-white/55 ring-white/15"
          : "bg-emerald-500/15 text-emerald-100 ring-emerald-500/30";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1", tone)}>
      {bucketLabelFr(bucket)}
    </span>
  );
}

function SkillMasteryCard({
  item,
  onSelect,
}: {
  item: TrainingCenterSkillRow;
  onSelect: () => void;
}) {
  const styles = bucketCardStyles(item.bucket);
  const pct = item.masteryPercent;
  const barPct = pct == null ? 8 : Math.max(8, pct);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full min-h-[168px] flex-col rounded-2xl border p-4 text-left transition duration-200 sm:p-5",
        "hover:-translate-y-0.5 active:translate-y-0",
        styles.border,
        styles.bg,
        styles.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <BucketPill bucket={item.bucket} />
        <span className="rounded-full bg-white/[0.06] p-1.5 text-white/35 transition group-hover:bg-[#3D7BFF]/20 group-hover:text-[#9EC0FF]">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>

      <h3 className="mt-3 line-clamp-3 flex-1 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[16px]">
        {item.row.skill}
      </h3>

      <p className="mt-1 text-[12px] text-white/45">{item.row.userLevel}</p>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p
              className={cn(
                "text-[1.75rem] font-bold leading-none tracking-[-0.04em] tabular-nums",
                pct == null ? "text-white/35" : "text-white",
              )}
            >
              {pct == null ? "—" : `${pct}%`}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
              Maîtrise estimée
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25">
          <div
            className={cn("h-full rounded-full transition-all", pct == null ? "bg-white/20" : levelBarColor(pct))}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-medium text-[#9EC0FF] opacity-0 transition group-hover:opacity-100">
          Ouvrir l&apos;univers compétence →
        </p>
      </div>
    </button>
  );
}

export function TrainingCenterSkillsCockpit({ rows, onSelect }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: rows.filter((r) => r.bucket !== "strength").length,
      develop: 0,
      consolidate: 0,
      unevaluated: 0,
      strength: 0,
    };
    for (const r of rows) {
      c[r.bucket] += 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows.filter((r) => r.bucket !== "strength");
    return rows.filter((r) => r.bucket === filter);
  }, [rows, filter]);

  const strengths = useMemo(() => rows.filter((r) => r.bucket === "strength"), [rows]);

  const filters: FilterKey[] = ["all", "develop", "consolidate", "unevaluated"];
  if (counts.strength > 0) filters.push("strength");

  if (!rows.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#9EC0FF]">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Référentiel métier</span>
          </div>
          <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.25rem]">
            Vos compétences, carte par carte
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-white/45">
            Touchez une carte pour accéder aux exercices, missions et preuves. Chaque % est une estimation
            basée sur vos tests et déclarations.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((key) => {
          const n = counts[key];
          if (key !== "all" && n === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition",
                active
                  ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/15 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80",
              )}
            >
              {FILTER_LABELS[key]}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  active ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/45",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {filter === "strength" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {strengths.map((item) => (
            <SkillMasteryCard key={item.row.skill} item={item} onSelect={() => onSelect(item)} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <SkillMasteryCard key={item.row.skill} item={item} onSelect={() => onSelect(item)} />
          ))}
        </div>
      )}

      {filter !== "strength" && strengths.length > 0 ? (
        <section className="space-y-3 border-t border-white/[0.06] pt-8">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/70">
            Déjà alignées avec votre objectif
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {strengths.map((item) => (
              <SkillMasteryCard key={item.row.skill} item={item} onSelect={() => onSelect(item)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
