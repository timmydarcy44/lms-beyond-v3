import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";

export type GapSeverity = "aligned" | "low" | "medium" | "high" | "unevaluated";

export function levelScoreFromLabel(level: string): number | null {
  if (level === "Non évaluée" || level === "Non renseigné" || level === "Non évalué") return null;
  if (level === "Excellent") return 95;
  if (level === "Très bon") return 85;
  if (level === "Bon") return 72;
  if (level === "Moyen") return 55;
  if (level === "À renforcer") return 35;
  return null;
}

export function gapSeverityFrom(gapLabel: string, status: SkillGapStatus): GapSeverity {
  if (status === "validated" || gapLabel === "Aligné") return "aligned";
  if (gapLabel === "Écart majeur" || gapLabel === "Prochaine progression") return "high";
  if (gapLabel === "À consolider") return "medium";
  if (gapLabel === "Non évalué" || gapLabel === "À évaluer") return "unevaluated";
  if (status === "priority") return "low";
  return "low";
}

export function levelBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-sky-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500/90";
}

export const LEVEL_BADGE: Record<string, string> = {
  Excellent: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  "Très bon": "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  Bon: "bg-cyan-500/12 text-cyan-200 ring-1 ring-cyan-500/20",
  Moyen: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  "À renforcer": "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/20",
  "Non évaluée": "bg-white/[0.06] text-white/45 ring-1 ring-white/10",
  "Non renseigné": "bg-white/[0.06] text-white/45 ring-1 ring-white/10",
  "Non évalué": "bg-white/[0.06] text-white/45 ring-1 ring-white/10",
};

export const GAP_BADGE: Record<GapSeverity, string> = {
  aligned: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  low: "bg-sky-500/12 text-sky-300 ring-1 ring-sky-500/20",
  medium: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  high: "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/20",
  unevaluated: "bg-white/[0.06] text-white/45 ring-1 ring-white/10",
};

export const STATUS_BADGE: Record<SkillGapStatus, string> = {
  validated: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  in_progress: "bg-cyan-500/12 text-cyan-200 ring-1 ring-cyan-500/20",
  priority: "bg-[#3D7BFF]/20 text-[#8BB4FF] ring-1 ring-[#3D7BFF]/35",
  to_develop: "bg-amber-500/12 text-amber-200/90 ring-1 ring-amber-500/20",
  badge_available: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
};

export const ONBOARDING_ROW_RING: Record<string, string> = {
  aligned: "ring-2 ring-emerald-500/50 bg-emerald-500/[0.06]",
  unevaluated: "ring-2 ring-white/25 bg-white/[0.04]",
  priority: "ring-2 ring-[#3D7BFF]/55 bg-[#3D7BFF]/[0.08]",
};

export function pillClass(fallback: string, map: Record<string, string>, key: string): string {
  return map[key] ?? fallback;
}
