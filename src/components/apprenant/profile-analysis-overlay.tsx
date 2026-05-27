"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function ProfileAnalysisOverlay({ open, onClose, title, subtitle, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-analysis-title"
    >
      <div className="relative flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
              Analyse croisée
            </p>
            <h2 id="profile-analysis-title" className="mt-1 text-lg font-semibold text-[#0a0a0a]">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-sm text-black/55">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 text-black/50 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-black/75">
          {children}
        </div>
        <div className="border-t border-black/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#FF3B30] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
