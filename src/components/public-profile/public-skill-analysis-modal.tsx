"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusConfig, verdictToHistoryStatusLabel } from "@/lib/hard-skills/skill-validation-analysis";
import { EDGE_ANALYSIS_LABEL, sanitizeEdgePublicCopy } from "@/lib/edge-brand-copy";
import { verdictLabel } from "@/lib/hard-skills/skill-validation";
import { buildSkillEvaluationReport } from "@/lib/hard-skills/skill-evaluation-report";
import { SkillEvaluationReportPanel } from "@/components/hard-skills/skill-evaluation-report-panel";

type Props = {
  skill: PublicSkillCardData;
  onClose: () => void;
};

export function PublicSkillAnalysisModal({ skill, onClose }: Props) {
  const v = skill.validation;
  const verdict = v?.verdict;
  const statusCfg = publicStatusConfig(skill.status);
  const statusLine = verdict ? verdictLabel(verdict) : skill.statusLabel;
  const report = useMemo(() => buildSkillEvaluationReport(skill), [skill]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-labelledby="skill-analysis-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-black/[0.08] bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/[0.06] bg-white/95 px-6 py-5 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF3B30]">{EDGE_ANALYSIS_LABEL}</p>
            <h2 id="skill-analysis-title" className="mt-1 text-xl font-semibold tracking-tight text-[#0a0a0a]">
              {skill.name}
            </h2>
            <p className="mt-0.5 text-sm text-black/45">{skill.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 text-black/50 hover:bg-black/[0.04]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-8">
          <SkillEvaluationReportPanel
            report={report}
            skillName={skill.name}
            category={skill.category}
            declaredLevel={skill.declaredLevel}
            estimatedLevel={skill.estimatedLevel}
            statusLabel={statusLine}
            statusEmoji={statusCfg.emoji}
            confidenceScore={skill.confidenceScore}
            variant="light"
          />

          {v?.history?.length ? (
            <section className="mt-10 border-t border-black/[0.06] pt-8">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                Historique des évaluations
              </h3>
              <ol className="mt-4 space-y-3">
                {[...(v.history ?? [])].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-3 text-sm"
                  >
                    <p className="text-xs text-black/40">
                      {new Date(entry.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 font-medium text-[#0a0a0a]">{sanitizeEdgePublicCopy(entry.title)}</p>
                    <p className="mt-0.5 text-black/60">
                      Statut : {entry.verdict ? verdictToHistoryStatusLabel(entry.verdict) : entry.statusLabel}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
