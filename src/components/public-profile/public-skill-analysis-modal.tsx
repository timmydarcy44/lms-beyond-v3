"use client";

import { useEffect, useMemo } from "react";
import { FileText, MessageSquare, X } from "lucide-react";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusConfig, verdictToHistoryStatusLabel } from "@/lib/hard-skills/skill-validation-analysis";
import {
  EDGE_ANALYSIS_LABEL,
  EDGE_CONFIDENCE_LABEL,
  EDGE_STATUS_LABEL,
  sanitizeEdgePublicCopy,
} from "@/lib/edge-brand-copy";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const interviewPairs =
    v?.questions?.length && v.answers?.length
      ? v.questions.map((q, i) => ({ question: q, answer: v.answers?.[i] ?? "" }))
      : [];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />

      <aside
        role="dialog"
        aria-labelledby="skill-analysis-title"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-black/[0.08] bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF3B30]">
              {EDGE_ANALYSIS_LABEL}
            </p>
            <h2 id="skill-analysis-title" className="mt-1 truncate text-lg font-semibold tracking-tight text-[#0a0a0a]">
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Métriques clés */}
          <div className="grid grid-cols-2 gap-2.5">
            <Metric label="Niveau déclaré" value={skill.declaredLevel} />
            <Metric label="Niveau estimé Byound" value={skill.estimatedLevel} />
            <Metric label={EDGE_STATUS_LABEL} value={`${statusCfg.emoji} ${statusLine}`} />
            {skill.confidenceScore != null ? (
              <Metric label={EDGE_CONFIDENCE_LABEL} value={`${skill.confidenceScore} %`} />
            ) : (
              <Metric label={EDGE_CONFIDENCE_LABEL} value="—" />
            )}
          </div>

          {skill.portfolioProof?.url || skill.portfolioProof?.note ? (
            <DepositedDocument proof={skill.portfolioProof} />
          ) : null}

          {/* Historique */}
          {v?.history?.length ? (
            <section className="mt-8">
              <SectionTitle>Historique</SectionTitle>
              <ol className="mt-3 space-y-2">
                {[...(v.history ?? [])].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-3.5 py-2.5 text-sm"
                  >
                    <p className="text-[11px] text-black/40">
                      {new Date(entry.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-0.5 font-medium text-[#0a0a0a]">{sanitizeEdgePublicCopy(entry.title)}</p>
                    <p className="mt-0.5 text-xs text-black/55">
                      {entry.verdict ? verdictToHistoryStatusLabel(entry.verdict) : entry.statusLabel}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Analyse détaillée */}
          {(v?.detailedAnalysis || v?.analysis || v?.summary) ? (
            <section className="mt-8">
              <SectionTitle>Analyse détaillée</SectionTitle>
              <p className="mt-3 text-sm leading-relaxed text-black/65">
                {sanitizeEdgePublicCopy(v?.detailedAnalysis || v?.analysis || v?.summary || "")}
              </p>
            </section>
          ) : null}

          {/* Résumé entretien */}
          {interviewPairs.length > 0 ? (
            <section className="mt-8">
              <SectionTitle>
                <MessageSquare className="mr-1.5 inline h-3.5 w-3.5" />
                Résumé de l&apos;entretien expérientiel
              </SectionTitle>
              <div className="mt-3 space-y-3">
                {interviewPairs.map((pair, i) => (
                  <div key={i} className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-3.5 py-3">
                    <p className="text-xs font-medium text-[#0a0a0a]">{sanitizeEdgePublicCopy(pair.question)}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-black/55">
                      {pair.answer.trim() || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : v?.method === "interview" && v?.summary ? (
            <section className="mt-8">
              <SectionTitle>Résumé de l&apos;entretien expérientiel</SectionTitle>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{sanitizeEdgePublicCopy(v.summary)}</p>
            </section>
          ) : null}

          {/* Preuves retenues */}
          {(v?.proofUrl || v?.proofNote) ? (
            <section className="mt-8">
              <SectionTitle>
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                Preuves retenues
              </SectionTitle>
              <div className="mt-3 rounded-lg border border-black/[0.06] bg-[#fafafa] px-3.5 py-3 text-sm">
                {v.proofNote ? (
                  <p className="text-black/65">{sanitizeEdgePublicCopy(v.proofNote)}</p>
                ) : null}
                {v.proofUrl ? (
                  <a
                    href={v.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-[#0066cc] hover:underline"
                  >
                    Voir le document
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Justification Byound */}
          <section className="mt-8 border-t border-black/[0.06] pt-8">
            <SectionTitle>Justification de la décision Byound</SectionTitle>
            {v?.opinion ? (
              <p className="mt-3 text-sm leading-relaxed text-black/65">{sanitizeEdgePublicCopy(v.opinion)}</p>
            ) : null}
            <div className="mt-5">
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
                compact
              />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
      {children}
    </h3>
  );
}

function proofHref(proof: { url?: string; note?: string }) {
  const url = proof.url?.trim();
  if (url?.startsWith("http")) return url;
  return proof.note?.match(/https?:\/\/\S+/)?.[0];
}

function DepositedDocument({ proof }: { proof: { url?: string; note?: string } }) {
  const href = proofHref(proof);
  const note = proof.note?.trim();
  const showNote = Boolean(note && note !== href);
  const isImage = Boolean(href && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(href));
  const isPdf = Boolean(href && /\.pdf(\?|$)/i.test(href));
  const isVideo = Boolean(href && /\.(mp4|webm|mov)(\?|$)/i.test(href));

  return (
    <section className="mt-8">
      <SectionTitle>
        <FileText className="mr-1.5 inline h-3.5 w-3.5" />
        Document déposé
      </SectionTitle>
      <div className="mt-3 overflow-hidden rounded-lg border border-black/[0.06] bg-[#fafafa]">
        {isImage && href ? (
          <img src={href} alt="Document déposé" className="max-h-80 w-full bg-white object-contain" />
        ) : null}
        {isPdf && href ? (
          <iframe title="Document déposé" src={href} className="h-80 w-full bg-white" />
        ) : null}
        {isVideo && href ? <video src={href} controls className="max-h-80 w-full bg-black" /> : null}
        <div className="px-3.5 py-3 text-sm">
          {showNote ? <p className="whitespace-pre-wrap text-black/65">{note}</p> : null}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-[#0066cc] hover:underline"
            >
              Voir le document
            </a>
          ) : note?.includes("Fichier :") ? (
            <p className="text-xs text-black/45">
              Le nom du fichier est enregistré. Le document lui-même n&apos;a pas été conservé : il faut le déposer à nouveau.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#0a0a0a]">{value}</p>
    </div>
  );
}
