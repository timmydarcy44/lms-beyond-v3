"use client";

import Link from "next/link";
import { Clock, Target, X } from "lucide-react";
import type { EdgeNextStep } from "@/lib/apprenant/edge-progression-gps";

type Props = {
  open: boolean;
  onClose: () => void;
  nextStep: EdgeNextStep;
};

export function EdgeWhatNowModal({ open, onClose, nextStep }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Fermer" />
      <div
        role="dialog"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141C] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Que dois-je faire maintenant ?
        </p>
        <h3 className="mt-3 text-lg font-semibold text-white">{nextStep.skill}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{nextStep.why}</p>

        <div className="mt-5 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="h-4 w-4 text-white/40" />
            <span>Temps estimé : {nextStep.estimatedMinutes} min</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-white/70">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <span>{nextStep.expectedOutcome}</span>
          </div>
        </div>

        <Link
          href={nextStep.actionHref}
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#3D7BFF] py-3 text-sm font-semibold text-white hover:bg-[#2F6AE8]"
        >
          {nextStep.actionLabel}
        </Link>
      </div>
    </div>
  );
}
