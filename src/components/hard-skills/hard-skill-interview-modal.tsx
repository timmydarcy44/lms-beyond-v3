"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { SkillValidationVerdict } from "@/lib/hard-skills/skill-validation";
import type { SkillAnalysisApiResult } from "@/lib/hard-skills/skill-validation-analysis";
import { verdictLabel } from "@/lib/hard-skills/skill-validation";
import { buildSkillEvaluationReportFromAnalysis } from "@/lib/hard-skills/skill-evaluation-report";
import { SkillEvaluationReportPanel } from "@/components/hard-skills/skill-evaluation-report-panel";
import { EDGE_CONFIDENCE_LABEL } from "@/lib/edge-brand-copy";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { EDGE_INPUT_CLASS } from "@/components/ui/edge-select";

type AnalysisResult = SkillAnalysisApiResult;

type Props = {
  open: boolean;
  skillName: string | null;
  level: HardSkillLevel;
  careerTitle?: string | null;
  onClose: () => void;
  onComplete: (result: AnalysisResult, qa: { questions: string[]; answers: string[] }) => void;
};

export function HardSkillInterviewModal({ open, skillName, level, careerTitle, onClose, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!open || !skillName) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStep(0);
    void (async () => {
      try {
        const res = await fetch("/api/learner/skill-validation/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "questions", skillName, level, careerTitle }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        setQuestions(json.questions ?? []);
        setAnswers((json.questions ?? []).map(() => ""));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger l'entretien");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, skillName, level, careerTitle]);

  const submit = async () => {
    if (!skillName) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/learner/skill-validation/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", skillName, level, questions, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      const analysis: AnalysisResult = json;
      setResult(analysis);
      onComplete(analysis, { questions, answers });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !skillName) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0D111A] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-[#3D7BFF]">Entretien expérientiel EDGE</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{skillName}</h3>
        <p className="mt-1 text-sm text-white/50">Niveau {level} · {questions.length} questions</p>

        {loading ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Préparation de l&apos;entretien…
          </p>
        ) : result ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-white/40">Résultat EDGE</p>
              <p className="mt-1 text-lg font-semibold text-white">{verdictLabel(result.verdict)}</p>
              <p className="mt-1 text-sm text-white/55">
                {EDGE_CONFIDENCE_LABEL} : {result.confidenceScore} %
              </p>
            </div>
            <SkillEvaluationReportPanel
              report={buildSkillEvaluationReportFromAnalysis({
                skillName,
                declaredLevel: level,
                estimatedLevel: result.estimatedLevel,
                analysis: result,
              })}
              skillName={skillName}
              declaredLevel={level}
              estimatedLevel={(result.estimatedLevel ?? level) as HardSkillLevel}
              statusLabel={verdictLabel(result.verdict)}
              confidenceScore={result.confidenceScore}
              variant="dark"
              compact
            />
            {result.badgeSuggested && result.verdict === "validated" ? (
              <p className="text-sm text-emerald-300">
                Vous pouvez créer le badge EDGE associé depuis votre Wallet.
              </p>
            ) : null}
            <button type="button" onClick={onClose} className={CONNECT_BTN_PRIMARY}>
              Fermer
            </button>
          </div>
        ) : questions.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-white">
              Question {step + 1} / {questions.length}
            </p>
            <p className="mt-3 text-sm text-white/80">{questions[step]}</p>
            <textarea
              rows={5}
              value={answers[step] ?? ""}
              onChange={(e) => {
                const next = [...answers];
                next[step] = e.target.value;
                setAnswers(next);
              }}
              placeholder="Décrivez votre expérience concrète…"
              className={`${EDGE_INPUT_CLASS} mt-4`}
            />
            <div className="mt-6 flex justify-between gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className={CONNECT_BTN_SECONDARY}
              >
                Précédent
              </button>
              {step < questions.length - 1 ? (
                <button type="button" onClick={() => setStep((s) => s + 1)} className={CONNECT_BTN_PRIMARY}>
                  Suivant
                </button>
              ) : (
                <button type="button" disabled={submitting} onClick={() => void submit()} className={CONNECT_BTN_PRIMARY}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Analyser mes réponses
                </button>
              )}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}
        {!result && !loading ? (
          <button type="button" onClick={onClose} className={`${CONNECT_BTN_SECONDARY} mt-4`}>
            Annuler
          </button>
        ) : null}
      </div>
    </div>
  );
}
