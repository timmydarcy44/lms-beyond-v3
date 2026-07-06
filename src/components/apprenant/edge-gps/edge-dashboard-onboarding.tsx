"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EDGE_DASHBOARD_ONBOARDING_KEY } from "@/lib/apprenant/edge-personalized-path-request";

const STEPS = [
  {
    title: "Votre objectif",
    text: "Tout commence par l'objectif professionnel que vous souhaitez atteindre.",
  },
  {
    title: "Vos écarts",
    text: "EDGE compare votre profil actuel aux compétences attendues pour cet objectif.",
  },
  {
    title: "Vos compétences",
    text: "Chaque compétence peut être analysée, développée puis validée.",
  },
  {
    title: "Vos badges",
    text: "Les validations obtenues enrichissent votre Passeport EDGE.",
  },
  {
    title: "Votre parcours personnalisé",
    text: "Un conseiller EDGE peut analyser vos résultats et construire un parcours adapté à votre situation.",
  },
] as const;

export function EdgeDashboardOnboarding({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(EDGE_DASHBOARD_ONBOARDING_KEY);
      if (!seen) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(EDGE_DASHBOARD_ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} aria-label="Fermer" />
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141C] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 w-6 rounded-full transition",
                  i <= step ? "bg-[#3D7BFF]" : "bg-white/15",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Bienvenue sur EDGE
        </p>
        <h2 id="onboarding-title" className="mt-2 text-lg font-semibold text-white">
          {current.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{current.text}</p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="text-sm text-white/45 transition hover:text-white/70"
          >
            Passer
          </button>
          <div className="flex gap-2">
            {isLast ? (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-white/90"
              >
                Compris
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-lg bg-[#3D7BFF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2F6AE8]"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
