"use client";

import { Mail } from "lucide-react";
import { EDGE_COLORS, EDGE_GRADIENTS } from "@/lib/edge/edge-brand";

type ParticuliersSignupOverlayProps = {
  email: string;
  firstName: string;
  onClose: () => void;
};

export function ParticuliersSignupOverlay({ email, firstName, onClose }: ParticuliersSignupOverlayProps) {
  const title = firstName.trim()
    ? `${firstName.trim()}, vérifiez votre boîte mail`
    : "Vérifiez votre boîte mail";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ backgroundColor: EDGE_COLORS.bgDeep }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-overlay-title"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: EDGE_GRADIENTS.mailOverlayBg }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: EDGE_GRADIENTS.mailOverlayHalo }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md text-center text-white">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Mail className="h-6 w-6 text-white/80" aria-hidden />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">EDGE</p>
        <h2 id="signup-overlay-title" className="mt-3 text-[26px] font-semibold leading-snug tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/55">
          Un email de confirmation vient de vous être envoyé
          {email ? (
            <>
              {" "}
              à <span className="font-medium text-white/85">{email}</span>
            </>
          ) : null}
          . Cliquez sur le lien à l&apos;intérieur pour ouvrir votre cockpit.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-10 w-full rounded-2xl bg-white px-8 py-4 text-[15px] font-semibold text-[#0a0a0a] transition hover:opacity-95"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
