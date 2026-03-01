"use client";

import { Button } from "@/components/ui/button";

type TrajectoryDraftBarProps = {
  count: number;
  onGo: () => void;
  onClear: () => void;
};

export function TrajectoryDraftBar({ count, onGo, onClear }: TrajectoryDraftBarProps) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-[80] px-4 sm:px-6 lg:bottom-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-full border border-white/15 bg-black/80 px-6 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="text-sm uppercase tracking-[0.3em] text-white/70">
          Ta trajectoire • {count} compétence{count > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={onGo}
            className="rounded-full bg-white px-5 text-xs uppercase tracking-[0.28em] text-black hover:bg-white/90"
          >
            Aller à ma trajectoire
          </Button>
          <Button
            type="button"
            onClick={onClear}
            variant="ghost"
            className="rounded-full px-4 text-xs uppercase tracking-[0.28em] text-white/70 hover:text-white"
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
}



