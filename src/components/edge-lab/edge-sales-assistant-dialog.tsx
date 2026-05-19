"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";

type Props = {
  open: boolean;
  question: string;
  answer: string;
  onClose: () => void;
};

export function EdgeSalesAssistantDialog({ open, question, answer, onClose }: Props) {
  const titleId = useMemo(() => "edge-sales-assistant-title", []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer le dialogue"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6">
        <div className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_120px_-52px_rgba(0,0,0,0.75)] ring-1 ring-black/10">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Assistant EDGE</p>
              <h2 id={titleId} className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
                Réponse à votre question
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex justify-end">
              <div className="max-w-[92%] rounded-2xl bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[80%]">
                {question}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800 shadow-sm ring-1 ring-zinc-200 sm:max-w-[80%]">
                {answer}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500">
                Réponse instantanée — un conseiller peut confirmer le point précis si besoin.
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={EDGE_MARKETING_HREFS.onlineCatalog}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  Voir les parcours
                </Link>
                <a
                  href="#contact"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  Parler à l’équipe
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

