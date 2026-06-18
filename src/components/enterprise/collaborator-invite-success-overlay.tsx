"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

type CollaboratorInviteSuccessOverlayProps = {
  open: boolean;
  collaboratorName?: string;
  onClose: () => void;
  autoCloseMs?: number;
};

export function CollaboratorInviteSuccessOverlay({
  open,
  collaboratorName,
  onClose,
  autoCloseMs = 2800,
}: CollaboratorInviteSuccessOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  const subtitle = collaboratorName
    ? `${collaboratorName} va pouvoir créer son mot de passe et accéder à son espace salarié.`
    : "Il ou elle va pouvoir créer son mot de passe et accéder à son espace salarié.";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" aria-hidden />
      <div
        className="relative w-full max-w-[22rem] rounded-[1.75rem] border border-white/30 bg-white px-8 py-9 text-center shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
        onClick={(e) => e.stopPropagation()}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/25">
          <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
        </div>
        <p className="mt-5 text-[1.05rem] font-semibold leading-snug tracking-tight text-gray-950">
          Votre collaborateur vient de recevoir un email
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
