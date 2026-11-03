"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnswerCard, type AnswerCardState } from "./answer-card";
import { FeedbackSheet } from "./feedback-sheet";
import { LmsScreen } from "./lms-screen";
import { QuizProgressBar, type QuizSegment } from "./quiz-progress-bar";

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export function QuizQuestionView({
  chapterLabel,
  index,
  total,
  prompt,
  imageUrl,
  multiple,
  options,
  selected,
  revealed,
  correctValues,
  explanation,
  conceptLabel,
  conceptPassage,
  streak,
  segments,
  onToggle,
  onValidate,
  onContinue,
  onQuit,
  canValidate,
  busy,
  extra,
}: {
  chapterLabel: string;
  index: number;
  total: number;
  prompt: string;
  imageUrl?: string;
  multiple?: boolean;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  revealed: boolean;
  correctValues: string[];
  explanation?: string;
  conceptLabel?: string;
  conceptPassage?: string;
  streak: number;
  segments: QuizSegment[];
  onToggle: (value: string) => void;
  onValidate: () => void;
  onContinue: () => void;
  onQuit: () => void;
  canValidate: boolean;
  busy?: boolean;
  extra?: ReactNode;
}) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [passageOpen, setPassageOpen] = useState(false);
  const correctSet = new Set(correctValues.map(String));
  const selectedSet = new Set(selected.map(String));
  const pickedRight = selected.length > 0 && selected.every((value) => correctSet.has(value)) && correctValues.every((value) => selectedSet.has(String(value)));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmQuit || passageOpen || revealed || extra) return;
      const key = event.key.toLowerCase();
      const letterIndex = LETTERS.indexOf(key);
      const digitIndex = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
      const optionIndex = letterIndex >= 0 ? letterIndex : digitIndex;
      const option = options[optionIndex];
      if (!option) return;
      event.preventDefault();
      onToggle(option.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmQuit, extra, onToggle, options, passageOpen, revealed]);

  const stateFor = (value: string, optionIndex: number): AnswerCardState => {
    if (!revealed) return selectedSet.has(value) ? "selected" : "idle";
    if (correctSet.has(value)) return "correct";
    if (selectedSet.has(value)) return "wrong";
    return options.length > 0 ? "dimmed" : optionIndex ? "dimmed" : "dimmed";
  };

  return (
    <LmsScreen className="quiz-player">
      <header className="quiz-top">
        <button type="button" className="quiz-quit" onClick={() => setConfirmQuit(true)}>
          ✕ Quitter
        </button>
        <QuizProgressBar segments={segments} />
        {streak >= 2 ? <span className="quiz-streak">🔥 {streak} bonnes d’affilée</span> : <span />}
      </header>
      <div className="quiz-body">
        <p className="quiz-kicker">
          <b>
            Question {index} sur {total}
          </b>
          {chapterLabel}
        </p>
        <h2>{prompt}</h2>
        {imageUrl ? <img className="quiz-image" src={imageUrl} alt="" /> : null}
        {multiple ? <p className="quiz-note">Plusieurs réponses possibles</p> : null}
        {options.length ? (
          <div className="quiz-answers">
            {options.map((option, optionIndex) => (
              <AnswerCard
                key={option.value}
                index={optionIndex}
                label={option.label}
                multiple={multiple}
                state={stateFor(option.value, optionIndex)}
                disabled={revealed}
                onClick={() => onToggle(option.value)}
              />
            ))}
          </div>
        ) : null}
        {extra ? <div className="quiz-extra">{extra}</div> : null}
      </div>
      {revealed ? (
        <FeedbackSheet
          correct={pickedRight}
          title={pickedRight ? feedbackHeading(index) : "Pas tout à fait."}
          explanation={explanation}
          expectedLabel={options
            .filter((option) => correctSet.has(option.value))
            .map((option) => option.label)
            .join(", ")}
          conceptLabel={conceptLabel}
          onReviewConcept={() => setPassageOpen(true)}
          onContinue={onContinue}
          busy={busy}
        />
      ) : (
        <div className="quiz-dock">
          <button type="button" className="quiz-validate" disabled={!canValidate || busy} onClick={onValidate}>
            Valider
          </button>
        </div>
      )}
      {confirmQuit ? (
        <div className="quiz-confirm" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <section>
            <h3 id="quit-title">Quitter le quiz ?</h3>
            <p>Tu reprendras à cette question en revenant.</p>
            <div>
              <button type="button" onClick={() => setConfirmQuit(false)}>
                Rester
              </button>
              <button type="button" className="quiz-validate" onClick={onQuit}>
                Quitter
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {passageOpen ? (
        <div className="concept-panel" role="dialog" aria-label={conceptLabel}>
          <button type="button" onClick={() => setPassageOpen(false)}>
            Fermer
          </button>
          <h3>{conceptLabel}</h3>
          <p>{conceptPassage || explanation || "Reviens au chapitre pour relire ce passage."}</p>
        </div>
      ) : null}
    </LmsScreen>
  );
}

function feedbackHeading(index: number) {
  const titles = ["Bien vu !", "Exactement.", "C’est ça.", "Oui, c’est bien ça."];
  return titles[(index - 1) % titles.length] ?? "Bien vu !";
}
