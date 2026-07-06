"use client";

import { Compass } from "lucide-react";

type Props = {
  onClick: () => void;
};

export function EdgeWhatNowFab({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-4 z-[140] flex items-center gap-2 rounded-full border border-white/15 bg-[#12141C]/95 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:border-[#3D7BFF]/40 hover:bg-[#1a1d28] sm:right-8"
      aria-label="Que dois-je faire maintenant ?"
    >
      <Compass className="h-4 w-4 text-[#8BB4FF]" />
      <span className="hidden sm:inline">Que faire maintenant ?</span>
    </button>
  );
}
