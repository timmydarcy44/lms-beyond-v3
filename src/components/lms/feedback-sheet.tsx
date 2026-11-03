export function FeedbackSheet({
  correct,
  title,
  explanation,
  expectedLabel,
  conceptLabel,
  onReviewConcept,
  onContinue,
  busy,
}: {
  correct: boolean;
  title: string;
  explanation?: string;
  expectedLabel?: string;
  conceptLabel?: string;
  onReviewConcept?: () => void;
  onContinue: () => void;
  busy?: boolean;
}) {
  return (
    <div className="feedback-sheet" data-correct={correct ? "true" : "false"} role="status">
      <div className="feedback-sheet__main">
        <span className="feedback-dot" aria-hidden>
          {correct ? "✓" : "✕"}
        </span>
        <div>
          <b>{title}</b>
          {!correct && expectedLabel ? <p>La bonne réponse : {expectedLabel}</p> : null}
          {explanation ? <p>{explanation}</p> : null}
          {conceptLabel ? (
            <button type="button" className="linkish" onClick={onReviewConcept}>
              Revoir « {conceptLabel} » dans le chapitre ›
            </button>
          ) : null}
        </div>
      </div>
      <button type="button" className="quiz-continue" onClick={onContinue} disabled={busy}>
        {busy ? "Enregistrement…" : "Continuer ›"}
      </button>
    </div>
  );
}
