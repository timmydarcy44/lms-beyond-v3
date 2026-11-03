export type AnswerCardState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function AnswerCard({
  index,
  label,
  state,
  multiple,
  disabled,
  onClick,
}: {
  index: number;
  label: string;
  state: AnswerCardState;
  multiple?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const letter = LETTERS[index] ?? String(index + 1);
  return (
    <button type="button" className="answer-card" data-state={state} disabled={disabled} onClick={onClick}>
      <i>{multiple ? (state === "selected" || state === "correct" ? "✓" : letter) : letter}</i>
      <span>{label}</span>
      {state === "correct" ? <mark aria-hidden>✓</mark> : null}
      {state === "wrong" ? <mark aria-hidden>✕</mark> : null}
    </button>
  );
}
