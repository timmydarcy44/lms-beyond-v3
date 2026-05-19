"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildQuizReviewBriefForAi,
  type CategoryRadarRow,
  type QuizReviewItem,
} from "@/lib/quiz/build-question-review";
import { toast } from "sonner";

function CircularScore({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <svg className="-rotate-90" width="180" height="180" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#scoreGradDark)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black tabular-nums text-white">{score}</span>
        <span className="text-sm font-semibold text-slate-300">/ {max}</span>
      </div>
    </div>
  );
}

export type QuizResultsProps = {
  score: number;
  minScorePercent: number;
  summary?: string;
  completionLabel: string;
  reviewItems: QuizReviewItem[];
  radarRows: CategoryRadarRow[];
  onClose: () => void;
  onReviewAgain: () => void;
  fullscreen?: boolean;
  className?: string;
};

export function QuizResults({
  score,
  minScorePercent,
  summary,
  completionLabel,
  reviewItems,
  radarRows,
  onClose,
  onReviewAgain,
  fullscreen,
  className,
}: QuizResultsProps) {
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [analysisComment, setAnalysisComment] = useState("");
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationText, setRemediationText] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setAnalysisLoading(true);
      try {
        const res = await fetch("/api/ai/quiz-global-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, radar: radarRows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!ignore) {
          setStrengths(Array.isArray(data.strengths) ? data.strengths : []);
          setImprovements(Array.isArray(data.improvements) ? data.improvements : []);
          setAnalysisComment(typeof data.comment === "string" ? data.comment : "");
        }
      } catch {
        if (!ignore) {
          setStrengths(["Tu as terminé l’ensemble du quiz.", "Tes réponses sont enregistrées pour le suivi pédagogique."]);
          setImprovements(["Relire les questions avec erreur et leurs explications.", "Cibler les thèmes les moins maîtrisés dans le radar."]);
          setAnalysisComment("Analyse IA momentanément indisponible — voici une synthèse par défaut.");
        }
      } finally {
        if (!ignore) setAnalysisLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [score, radarRows, reviewBrief]);

  const wrongItems = reviewItems.filter((r) => !r.correct);

  const glassCard = "border border-white/10 bg-white/5 shadow-xl backdrop-blur-md";

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-y-auto overflow-x-hidden",
        "bg-[#0B0E14] text-white",
        fullscreen && "min-h-[70vh]",
        className,
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(236,72,153,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.06),transparent_50%)]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("relative z-10 mx-auto w-full max-w-5xl space-y-6 px-4 py-8")}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className={cn(glassCard, "md:col-span-1")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-white">Ton score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 pb-6">
              <CircularScore score={score} />
              <p className="text-center text-sm text-slate-300">
                {score >= 85
                  ? "Excellent travail."
                  : score >= minScorePercent
                    ? "Objectif atteint ou dépassé."
                    : `Objectif suggéré : ${minScorePercent}%.`}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-300">{completionLabel}</p>
            </CardContent>
          </Card>

          <Card className={cn(glassCard, "border-fuchsia-500/20 md:col-span-2")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#ff00ff] drop-shadow-[0_0_12px_rgba(255,0,255,0.35)]">
                <Eye className="h-5 w-5 text-[#ff00ff]" aria-hidden />
                L&apos;œil d&apos;EDGE AI
              </CardTitle>
              <p className="text-sm font-normal text-white">
                Synthèse basée sur ton score, tes thèmes et le détail de tes réponses (erreurs et réussites).
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              {analysisLoading ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-fuchsia-400" /> Génération de l’analyse…
                </div>
              ) : (
                <>
                  {analysisComment ? <p className="leading-relaxed text-slate-300">{analysisComment}</p> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 font-semibold text-white">Points forts</p>
                      <ul className="list-inside list-disc space-y-1 text-slate-300">
                        {(strengths.length ? strengths : ["—"]).slice(0, 4).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 font-semibold text-white">Axes d’amélioration</p>
                      <ul className="list-inside list-disc space-y-1 text-slate-300">
                        {(improvements.length ? improvements : ["—"]).slice(0, 4).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {radarRows.length > 0 ? (
          <Card className={glassCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-white">Synthèse par thème</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-3">
                {radarRows.map((row) => (
                  <li
                    key={row.category}
                    className="flex min-w-[140px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-white">{row.category}</span>
                    <span className="ml-auto tabular-nums text-slate-300">
                      {row.correct}/{row.total}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-white">Détail des réponses</CardTitle>
            {summary ? <p className="text-sm font-normal text-slate-300">{summary}</p> : null}
          </CardHeader>
          <CardContent className="space-y-3 overflow-visible pr-1">
            {reviewItems.map((row) => (
              <div
                key={row.questionId}
                className={cn(
                  "rounded-xl border p-4",
                  row.correct
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-rose-500/35 bg-rose-500/10",
                )}
              >
                <div className="flex items-start gap-2">
                  {row.correct ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-bold text-white">
                      Question {row.index} : {row.title}
                    </p>
                    {!row.correct ? (
                      <>
                        <p className="text-sm text-slate-300">
                          <span className="font-semibold text-white">Ta réponse :</span>{" "}
                          <span className="line-through decoration-rose-400/90 decoration-2">{row.userAnswerDisplay}</span>
                        </p>
                        <p className="text-sm text-slate-200">
                          <span className="font-semibold text-white">Bonne réponse :</span>{" "}
                          <span className="text-slate-300">{row.expectedDisplay}</span>
                        </p>
                        {row.explanation ? (
                          <div className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-sm">
                            <p className="font-semibold text-white">Pourquoi est-ce faux ?</p>
                            <p className="mt-1 leading-relaxed text-slate-300">{row.explanation}</p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">Ta réponse :</span> {row.userAnswerDisplay}
                      </p>
                    )}
                    {row.feedback ? (
                      <p className="text-sm italic text-slate-400">Feedback : {row.feedback}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-fuchsia-400/40 bg-white/5 text-white hover:bg-white/10"
            disabled={remediationLoading || wrongItems.length === 0}
            onClick={async () => {
              setRemediationLoading(true);
              try {
                const res = await fetch("/api/ai/quiz-remediation", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    score,
                    mistakes: wrongItems.map((w) => ({
                      title: w.title,
                      userAnswer: w.userAnswerDisplay,
                      explanation: w.explanation,
                    })),
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur");
                if (data.summary) setRemediationText(data.summary);
                else toast.error("Réponse vide");
              } catch (e) {
                console.error(e);
                toast.error("Impossible de générer le résumé");
              } finally {
                setRemediationLoading(false);
              }
            }}
          >
            {remediationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Générer un résumé de mes points d’amélioration
          </Button>
          {remediationText ? (
            <p className="max-w-prose whitespace-pre-wrap text-sm text-slate-300 sm:flex-1">{remediationText}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pb-8">
          <Button
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-8 font-semibold text-white hover:opacity-95"
          >
            Fermer
          </Button>
          <Button
            variant="outline"
            onClick={onReviewAgain}
            className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            Revoir
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
