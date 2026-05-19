"use client";

import { useLearningSession } from "@/hooks/use-learning-session";

function formatLabel(label: string) {
  return label.replace(/\s+/g, " ").trim();
}

export function ParcoursChrono({ pathId }: { pathId: string }) {
  const { totalDurationFormatted, activeDurationFormatted, isIdle } = useLearningSession({
    contentType: "path",
    contentId: pathId,
  });

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
        {formatLabel("Chrono")}
      </p>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/60">Temps passé</span>
          <span className="font-semibold text-white">{activeDurationFormatted}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/60">Session (page)</span>
          <span className="font-semibold text-white">
            {totalDurationFormatted}
            {isIdle ? <span className="ml-2 text-xs font-medium text-white/40">(inactif)</span> : null}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/45">
        Le “temps passé” s’additionne et se met en pause si vous êtes inactif ou quittez la page.
      </p>
    </div>
  );
}

