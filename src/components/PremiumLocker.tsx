"use client";

import React from "react";

type PremiumLockerProps = {
  locked?: boolean;
  ctaLabel?: string;
  children: React.ReactNode;
};

export default function PremiumLocker({
  locked = true,
  ctaLabel = "Débloquer mon profil certifié (29€)",
  children,
}: PremiumLockerProps) {
  return (
    <div className="relative">
      <div className={locked ? "pointer-events-none select-none blur-sm" : ""}>{children}</div>
      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] border border-white/10 bg-[#121212]/80 text-center backdrop-blur-md">
          <div className="text-[13px] font-semibold text-white">Accès Premium requis</div>
          <div className="max-w-[260px] text-[11px] text-white/60">
            Débloquez le rapport complet pour accéder à toutes les analyses.
          </div>
          <button className="rounded-full bg-[#F59E0B] px-4 py-2 text-[12px] font-semibold text-[#111827]">
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
