"use client";

import { Loader2 } from "lucide-react";

type EnterpriseLoadingOverlayProps = {
  label?: string;
};

export function EnterpriseLoadingOverlay({
  label = "Préparation de votre espace entreprise…",
}: EnterpriseLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6" role="status" aria-live="polite">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" aria-hidden />
      <div className="relative w-full max-w-sm rounded-[1.75rem] border border-violet-100 bg-white px-8 py-10 text-center shadow-[0_28px_80px_rgba(91,33,182,0.12)]">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/20" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-violet-500/15" />
          <Loader2 className="relative h-8 w-8 animate-spin text-violet-600" />
        </div>
        <p className="mt-6 text-base font-semibold tracking-tight text-gray-950">{label}</p>
        <p className="mt-2 text-sm text-gray-500">Chargement de vos indicateurs et collaborateurs</p>
        <div className="mx-auto mt-6 h-1 w-full overflow-hidden rounded-full bg-violet-100">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>
      </div>
    </div>
  );
}
