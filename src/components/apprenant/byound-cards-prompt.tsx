"use client";

import { useId } from "react";
import "./byound-cards-prompt.css";

export type ByoundCardsReview = {
  known: number;
  results: Array<{ cardId: string; known: boolean }>;
};

export function ByoundCardsPrompt({
  cardIds,
  reviewed,
  onStart,
}: {
  cardIds: string[];
  reviewed: ByoundCardsReview | null;
  onStart: () => void;
}) {
  const titleId = useId();
  const count = cardIds.length;
  if (count === 0) return null;

  const knownById = new Map((reviewed?.results ?? []).map((row) => [row.cardId, row.known]));
  const hasPerCard = (reviewed?.results.length ?? 0) > 0;
  const knownCount = reviewed
    ? hasPerCard
      ? cardIds.filter((id) => knownById.get(id)).length
      : Math.min(count, reviewed.known)
    : 0;
  const minutes = Math.max(1, Math.ceil((count * 15) / 60));
  const done = Boolean(reviewed);
  const title = done ? "Sous-chapitre révisé" : "Réviser ce sous-chapitre";
  const subtitle = done
    ? `Byound Cards · ${knownCount} / ${count} cartes sues`
    : `Byound Cards · ${count} carte${count > 1 ? "s" : ""} · ${minutes} min`;
  const action = done ? "Recommencer" : "Commencer";

  return (
    <section className="byound-cards-prompt" aria-labelledby={titleId}>
      <span className="byound-cards-prompt__glow" aria-hidden />
      <span className="byound-cards-prompt__art" aria-hidden>
        <span className="byound-cards-prompt__card byound-cards-prompt__card--back" />
        <span className="byound-cards-prompt__card byound-cards-prompt__card--mid" />
        <span className="byound-cards-prompt__card byound-cards-prompt__card--front">?</span>
      </span>
      <span className="byound-cards-prompt__copy">
        <strong id={titleId}>{title}</strong>
        <small>{subtitle}</small>
        {done ? (
          <span className="byound-cards-prompt__bar" aria-hidden>
            {cardIds.map((id, index) => {
              const known = hasPerCard ? Boolean(knownById.get(id)) : index < knownCount;
              return <span key={id} data-known={known ? "true" : "false"} />;
            })}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        className="byound-cards-prompt__go"
        aria-label={`${action} la révision de ${count} carte${count > 1 ? "s" : ""}`}
        onClick={onStart}
      >
        {action}
      </button>
    </section>
  );
}
