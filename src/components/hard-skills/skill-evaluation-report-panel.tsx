"use client";

import { AlertTriangle, Check } from "lucide-react";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { SkillEvaluationReport } from "@/lib/hard-skills/skill-evaluation-report";
import { EDGE_CONFIDENCE_LABEL, EDGE_ANALYSIS_LABEL } from "@/lib/edge-brand-copy";

type Props = {
  report: SkillEvaluationReport;
  skillName: string;
  category?: string;
  declaredLevel: HardSkillLevel;
  estimatedLevel: HardSkillLevel;
  statusLabel: string;
  statusEmoji?: string;
  confidenceScore?: number | null;
  variant?: "light" | "dark";
  compact?: boolean;
};

export function SkillEvaluationReportPanel({
  report,
  declaredLevel,
  estimatedLevel,
  statusLabel,
  statusEmoji,
  confidenceScore,
  variant = "light",
  compact = false,
}: Props) {
  const isDark = variant === "dark";

  const sectionTitle = isDark
    ? "text-xs font-semibold uppercase tracking-[0.18em] text-white/40"
    : "text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40";

  const bodyText = isDark ? "text-sm leading-relaxed text-white/75" : "text-sm leading-relaxed text-black/65";

  const metricCard = isDark
    ? "rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
    : "rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-3";

  const metricLabel = isDark
    ? "text-[10px] font-semibold uppercase tracking-wider text-white/40"
    : "text-[10px] font-semibold uppercase tracking-wider text-black/40";

  const metricValue = isDark ? "mt-1 text-sm font-medium text-white" : "mt-1 text-sm font-medium text-[#0a0a0a]";

  return (
    <div className={compact ? "space-y-5" : "space-y-8"}>
      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={metricCard}>
            <p className={metricLabel}>Niveau déclaré</p>
            <p className={metricValue}>{declaredLevel}</p>
          </div>
          <div className={metricCard}>
            <p className={metricLabel}>Niveau estimé par EDGE</p>
            <p className={metricValue}>{estimatedLevel}</p>
          </div>
          <div className={metricCard}>
            <p className={metricLabel}>Statut EDGE</p>
            <p className={metricValue}>
              {statusEmoji ? `${statusEmoji} ` : ""}
              {statusLabel}
            </p>
          </div>
          {confidenceScore != null ? (
            <div className={metricCard}>
              <p className={metricLabel}>{EDGE_CONFIDENCE_LABEL}</p>
              <p className={metricValue}>{confidenceScore} %</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <section>
        <h3 className={sectionTitle}>Pourquoi ce niveau ?</h3>
        <p className={`mt-3 ${bodyText}`}>{report.whyLevel}</p>
      </section>

      <section>
        <h3 className={sectionTitle}>Ce que nous avons observé</h3>
        <ul className="mt-4 space-y-2.5">
          {report.observations.map((obs) => (
            <li key={obs.text} className={`flex items-start gap-2.5 ${bodyText}`}>
              {obs.type === "positive" ? (
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              ) : (
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? "text-amber-300" : "text-amber-600"}`} />
              )}
              <span>{obs.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {report.showNextLevel && report.nextLevelLabel ? (
        <section
          className={
            isDark
              ? "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              : "rounded-2xl border border-black/[0.06] bg-[#fafafa] p-5"
          }
        >
          <h3 className={sectionTitle}>Comment atteindre le niveau suivant ?</h3>
          <p className={`mt-3 ${bodyText}`}>
            Pour atteindre le niveau <span className="font-semibold">{report.nextLevelLabel}</span>, EDGE recommande :
          </p>
          <ul className={`mt-4 space-y-2 ${bodyText}`}>
            {report.nextLevelSteps.map((step) => (
              <li key={step} className="flex items-start gap-2">
                <span className={isDark ? "text-[#3D7BFF]" : "text-[#FF3B30]"}>•</span>
                {step}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!compact ? (
        <p className={`text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>
          {EDGE_ANALYSIS_LABEL} — rapport généré selon le référentiel EDGE de validation des compétences.
        </p>
      ) : null}
    </div>
  );
}
