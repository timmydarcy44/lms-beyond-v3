"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  buildQuizReviewBriefForAi,
  type CategoryRadarRow,
  type QuizReviewItem,
} from "@/lib/quiz/build-question-review";
import { goalCount, resultHeadline, synthesisLine } from "@/lib/lms/presentation";
import { ConceptBreakdown, type ConceptRow } from "@/components/lms/concept-breakdown";
import { LmsScreen } from "@/components/lms/lms-screen";
import { ResultRing } from "@/components/lms/result-ring";
import { ReviewList } from "@/components/lms/review-list";

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
  courseId?: string;
  lessonId?: string;
  continueHref?: string;
  nextLockedMessage?: string;
  previewCards?: number;
};

function legacyObjective(score: number, minScorePercent: number, goal: number, total: number) {
  if (score >= 85) return "Excellent travail.";
  if (score >= minScorePercent) return "Objectif atteint ou dépassé.";
  return `Objectif : ${goal} / ${total}. Il te manque encore quelques réponses.`;
}

export function QuizResults({
  score,
  minScorePercent,
  summary,
  completionLabel,
  reviewItems,
  radarRows,
  onClose,
  onReviewAgain,
  courseId,
  lessonId,
  continueHref,
  nextLockedMessage,
  previewCards = 0,
}: QuizResultsProps) {
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [analysisComment, setAnalysisComment] = useState("");
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationText, setRemediationText] = useState<string | null>(null);
  const [cardsAdded, setCardsAdded] = useState(previewCards);
  const [passage, setPassage] = useState<QuizReviewItem | null>(null);

  const reviewBrief = useMemo(() => buildQuizReviewBriefForAi(reviewItems), [reviewItems]);
  const correctCount = reviewItems.filter((item) => item.correct).length;
  const total = reviewItems.length || 1;
  const wrongItems = reviewItems.filter((item) => !item.correct);
  const goal = goalCount(minScorePercent, reviewItems.length || 0);

  const conceptRows = useMemo<ConceptRow[]>(() => {
    const groups = new Map<string, boolean[]>();
    for (const item of reviewItems) {
      const label = (item.conceptLabel || item.category || "Général").trim() || "Général";
      const bits = groups.get(label) ?? [];
      bits.push(item.correct);
      groups.set(label, bits);
    }
    if (groups.size === 0 && radarRows.length) {
      return radarRows.map((row) => ({
        label: row.category,
        correct: row.correct,
        total: row.total,
        bits: Array.from({ length: row.total }, (_, index) => index < row.correct),
      }));
    }
    return [...groups.entries()].map(([label, bits]) => ({
      label,
      correct: bits.filter(Boolean).length,
      total: bits.length,
      bits,
    }));
  }, [radarRows, reviewItems]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setAnalysisLoading(true);
      try {
        const res = await fetch("/api/ai/quiz-global-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, radar: radarRows, reviewBrief }),
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
          setImprovements(["Relire les questions avec erreur et leurs explications.", "Cibler les thèmes les moins maîtrisés."]);
          setAnalysisComment("Analyse Byound momentanément indisponible — voici une synthèse par défaut.");
        }
      } finally {
        if (!ignore) setAnalysisLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [score, radarRows, reviewBrief]);

  const cardPayload = useMemo(
    () =>
      wrongItems.slice(0, 12).map((item) => ({
        front: item.conceptLabel || item.title,
        back: item.explanation || `Bonne réponse : ${item.expectedDisplay}`,
      })),
    [reviewItems],
  );

  useEffect(() => {
    if (!courseId || cardPayload.length === 0) return;
    let ignore = false;
    const cards = cardPayload;
    fetch("/api/apprenant/quiz-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, lessonId, cards }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { active?: boolean; added?: number; cards?: Array<{ front: string; back: string }> } | null) => {
        if (ignore || !payload?.active) return;
        const added = Number(payload.added ?? payload.cards?.length ?? 0);
        setCardsAdded(added);
        if (!lessonId || typeof window === "undefined" || !payload.cards?.length) return;
        const key = `flashcards-${courseId}-${lessonId}`;
        try {
          const current = JSON.parse(window.localStorage.getItem(key) || "[]") as Array<{ front?: string; back?: string }>;
          const seen = new Set(current.map((card) => `${card.front}||${card.back}`));
          const next = [...current];
          for (const card of payload.cards) {
            const id = `${card.front}||${card.back}`;
            if (seen.has(id)) continue;
            seen.add(id);
            next.push({ front: card.front, back: card.back, id: `quiz-${id.slice(0, 40)}` } as { front: string; back: string });
          }
          window.localStorage.setItem(key, JSON.stringify(next));
          window.dispatchEvent(new CustomEvent("flashcards-storage-updated", { detail: { key } }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [cardPayload, courseId, lessonId]);

  const openReview = (id: string) => {
    setPassage(reviewItems.find((item) => item.questionId === id) ?? null);
  };

  const continueControl = nextLockedMessage ? (
    <p className="synthesis">{nextLockedMessage}</p>
  ) : continueHref ? (
    <Link className="result-primary" href={continueHref} style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
      Continuer le parcours ›
    </Link>
  ) : (
    <button type="button" className="result-primary" onClick={onClose}>
      Continuer le parcours ›
    </button>
  );

  return (
    <LmsScreen className="quiz-results-screen" >
      <div className="quiz-results" style={{ background: "transparent" }}>
        <section className="result-hero">
          <span className="result-hero__kicker">Quiz terminé</span>
          <ResultRing correct={correctCount} total={reviewItems.length} />
          <h2>{resultHeadline(correctCount, reviewItems.length)}</h2>
          <p className="synthesis">{synthesisLine(conceptRows)}</p>
          {summary ? <p className="synthesis">{summary}</p> : null}
          <div className="result-actions">
            {continueControl}
            <button type="button" className="result-secondary" onClick={onReviewAgain}>
              Refaire le quiz
            </button>
          </div>
          <p className="result-meta">{completionLabel}</p>
        </section>
        <div className="result-stack">
          <ConceptBreakdown rows={conceptRows} />
          <ReviewList
            items={wrongItems.map((item) => ({
              id: item.questionId,
              title: item.title,
              expected: item.expectedDisplay,
              conceptLabel: item.conceptLabel,
            }))}
            onReview={openReview}
          />
          {cardsAdded > 0 ? (
            <div className="cards-added">
              <i>+</i>
              <div>
                <strong>
                  {cardsAdded} carte{cardsAdded > 1 ? "s" : ""} ajoutée{cardsAdded > 1 ? "s" : ""} à tes Byound Cards
                </strong>
                <small>Pour réviser {wrongItems[0]?.conceptLabel || "ce qui a coincé"}.</small>
              </div>
            </div>
          ) : null}
          <section className="result-card">
            <h3>L’œil d’Byound AI</h3>
            {analysisLoading ? (
              <p>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Génération de l’analyse…
              </p>
            ) : (
              <>
                {analysisComment ? <p>{analysisComment}</p> : null}
                <p>
                  <strong>Points forts.</strong> {(strengths.length ? strengths : ["—"]).slice(0, 4).join(" ")}
                </p>
                <p>
                  <strong>Axes d’amélioration.</strong> {(improvements.length ? improvements : ["—"]).slice(0, 4).join(" ")}
                </p>
              </>
            )}
          </section>
          <section className="result-card">
            <h3>Objectif</h3>
            <p>{legacyObjective(score, minScorePercent, goal, total)}</p>
          </section>
          <section className="result-card">
            <h3>Détail des réponses</h3>
            {reviewItems.map((row) => (
              <article key={row.questionId} className="detail-block" data-ok={row.correct ? "true" : "false"} id={`reponse-${row.questionId}`}>
                <p>
                  <strong>
                    Question {row.index} : {row.title}
                  </strong>
                </p>
                {row.correct ? (
                  <p>Ta réponse : {row.userAnswerDisplay}</p>
                ) : (
                  <>
                    <p>
                      Ta réponse : <s>{row.userAnswerDisplay}</s>
                    </p>
                    <p>Bonne réponse : {row.expectedDisplay}</p>
                    {row.explanation ? (
                      <p>
                        <strong>Pourquoi est-ce faux ?</strong> {row.explanation}
                      </p>
                    ) : null}
                  </>
                )}
                {row.feedback ? <p>Feedback : {row.feedback}</p> : null}
              </article>
            ))}
          </section>
          <section className="result-card">
            <h3>Résumé des points d’amélioration</h3>
            <button
              type="button"
              className="result-secondary"
              style={{ background: "#6e5bff" }}
              disabled={remediationLoading || wrongItems.length === 0}
              onClick={async () => {
                setRemediationLoading(true);
                try {
                  const res = await fetch("/api/ai/quiz-remediation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      score,
                      mistakes: wrongItems.map((item) => ({
                        title: item.title,
                        userAnswer: item.userAnswerDisplay,
                        explanation: item.explanation,
                      })),
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Erreur");
                  if (data.summary) setRemediationText(data.summary);
                  else toast.error("Réponse vide");
                } catch (error) {
                  console.error(error);
                  toast.error("Impossible de générer le résumé");
                } finally {
                  setRemediationLoading(false);
                }
              }}
            >
              {remediationLoading ? "Génération…" : "Générer un résumé de mes points d’amélioration"}
            </button>
            {remediationText ? <p>{remediationText}</p> : null}
            <button type="button" className="result-secondary" style={{ marginTop: 8, background: "#0b0d14" }} onClick={onClose}>
              Fermer
            </button>
          </section>
          <div className="mobile-actions">
            {continueControl}
            <button type="button" className="result-secondary" onClick={onReviewAgain}>
              Refaire le quiz
            </button>
          </div>
        </div>
      </div>
      {passage ? (
        <div className="concept-panel" role="dialog" aria-label={passage.conceptLabel || "Passage"}>
          <button type="button" onClick={() => setPassage(null)}>
            Fermer
          </button>
          <h3>{passage.conceptLabel || "À revoir"}</h3>
          <p>{passage.passage || passage.explanation || `Bonne réponse : ${passage.expectedDisplay}`}</p>
        </div>
      ) : null}
    </LmsScreen>
  );
}
