"use client";

import { CheckCircle2, X } from "lucide-react";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusConfig, verdictToHistoryStatusLabel } from "@/lib/hard-skills/skill-validation-analysis";
import { EDGE_CONFIDENCE_LABEL, sanitizeEdgePublicCopy } from "@/lib/edge-brand-copy";
import { verdictLabel } from "@/lib/hard-skills/skill-validation";

type Props = {
  skill: PublicSkillCardData;
  onClose: () => void;
};

export function PublicSkillAnalysisModal({ skill, onClose }: Props) {
  const v = skill.validation;
  const verdict = v?.verdict;
  const statusLine = verdict ? verdictLabel(verdict) : skill.statusLabel;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-labelledby="skill-analysis-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-black/[0.08] bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/[0.06] bg-white/95 px-6 py-5 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF3B30]">Analyse EDGE</p>
            <h2 id="skill-analysis-title" className="mt-1 text-xl font-semibold text-[#0a0a0a]">
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

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCell label="Niveau déclaré" value={skill.declaredLevel} />
            <InfoCell label="Niveau estimé par EDGE" value={skill.estimatedLevel} />
            <InfoCell label="Statut EDGE" value={`${publicStatusConfig(skill.status).emoji} ${statusLine}`} />
            {skill.confidenceScore != null ? (
              <InfoCell label={EDGE_CONFIDENCE_LABEL} value={`${skill.confidenceScore} %`} />
            ) : null}
          </div>

          {v?.summary || v?.detailedAnalysis ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">
                Pourquoi cette compétence est considérée comme maîtrisée ?
              </h3>
              {v.summary ? <p className="mt-2 text-sm leading-relaxed text-black/65">{v.summary}</p> : null}
            </section>
          ) : null}

          {v?.strengths?.length ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">Points forts identifiés</h3>
              <ul className="mt-3 space-y-2">
                {v.strengths.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-black/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {v?.improvementAreas?.length ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">Axes restant à renforcer</h3>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-black/65">
                {v.improvementAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {v?.evaluationMethods?.length ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">Méthodes d&apos;évaluation</h3>
              <ul className="mt-3 space-y-2">
                {v.evaluationMethods.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-black/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]/80" />
                    {sanitizeEdgePublicCopy(item)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {v?.detailedAnalysis || v?.analysis ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">Analyse détaillée</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/65">
                {v.detailedAnalysis || v.analysis}
              </p>
              {v.opinion ? (
                <p className="mt-3 text-sm italic text-black/50">Avis EDGE — {v.opinion}</p>
              ) : null}
            </section>
          ) : null}

          {v?.history?.length ? (
            <section>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">Historique des évaluations</h3>
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
                    {entry.confidenceScore != null ? (
                      <p className="mt-0.5 text-black/55">
                        {EDGE_CONFIDENCE_LABEL} : {entry.confidenceScore} %
                      </p>
                    ) : null}
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

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0a0a0a]">{value}</p>
    </div>
  );
}
