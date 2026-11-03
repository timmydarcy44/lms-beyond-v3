export type QuizSegment = "correct" | "wrong" | "current" | "upcoming";

export function QuizProgressBar({ segments }: { segments: QuizSegment[] }) {
  return (
    <div className="quiz-progress" aria-hidden>
      {segments.map((state, index) => (
        <span key={index} data-state={state} />
      ))}
    </div>
  );
}
