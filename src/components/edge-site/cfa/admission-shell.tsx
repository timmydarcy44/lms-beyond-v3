"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "offline";

type Props = {
  children: React.ReactNode;
  saveState: SaveState;
  onContinueLater: () => void;
  continueBusy?: boolean;
  continueMessage?: string;
};

export function AdmissionShell({
  children,
  saveState,
  onContinueLater,
  continueBusy,
  continueMessage,
}: Props) {
  const saveLabel =
    saveState === "saving"
      ? "Enregistrement…"
      : saveState === "offline"
        ? "Hors connexion : tes réponses seront enregistrées au retour du réseau"
        : saveState === "saved"
          ? "✓ Enregistré à l’instant"
          : "";

  return (
    <div className="min-h-screen bg-[#070C1C] font-[family-name:var(--font-manrope),Manrope,sans-serif] text-[#F2F4FA]">
      <header className="sticky top-0 z-40 h-[72px] border-b border-[#1F2850] bg-[#070C1C]/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="Byound — Accueil">
              <Image src={EDGE_LOGO_PATH} alt="Byound" width={112} height={28} className="h-7 w-auto" priority />
            </Link>
            <span className="hidden h-5 w-px bg-[#26304F] sm:block" aria-hidden />
            <p className="truncate text-sm font-semibold text-[#F2F4FA]/90">
              Candidature Byound School
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {saveLabel ? (
              <p
                className={cn(
                  "hidden text-xs sm:block",
                  saveState === "offline" ? "text-[#F2CF6B]" : "text-[#9AA3BD]",
                )}
              >
                {saveLabel}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onContinueLater}
              disabled={continueBusy}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#26304F] px-4 text-sm font-semibold text-[#F2F4FA] transition hover:bg-white/5 disabled:opacity-60"
            >
              {continueBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continuer plus tard
            </button>
          </div>
        </div>
      </header>

      {continueMessage ? (
        <div className="border-b border-[#1F2850] bg-[#0E1430] px-5 py-3 text-center text-sm text-[#A99BFF] sm:px-8">
          {continueMessage}
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8">{children}</div>

      <footer className="border-t border-[#1F2850] px-5 py-5 text-center text-xs text-[#6C7593] sm:px-8">
        <p>
          <Link href="/mentions-legales" className="hover:text-[#9AA3BD]">
            Mentions légales
          </Link>
          {" · "}
          <Link href="/confidentialite" className="hover:text-[#9AA3BD]">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/cgu" className="hover:text-[#9AA3BD]">
            CGU
          </Link>
        </p>
      </footer>
    </div>
  );
}
