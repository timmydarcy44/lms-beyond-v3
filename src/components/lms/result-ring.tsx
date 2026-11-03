"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./lms-screen";

export function ResultRing({ correct, total }: { correct: number; total: number }) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduce ? correct : 0);
  const safeTotal = Math.max(total, 1);
  const percent = Math.max(0, Math.min(100, (shown / safeTotal) * 100));

  useEffect(() => {
    if (reduce) {
      setShown(correct);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(correct * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [correct, reduce]);

  return (
    <div className="result-ring" style={{ ["--p" as string]: String(percent) }} aria-label={`${correct} sur ${total}`}>
      <div>
        <div>
          <strong>
            {shown} / {total}
          </strong>
          <small>bonnes réponses</small>
        </div>
      </div>
    </div>
  );
}
