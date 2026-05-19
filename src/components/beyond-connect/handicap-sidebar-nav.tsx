"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const HANDICAP_NAV_MS = 5000;

type HandicapSidebarNavProps = {
  collapsed?: boolean;
  labelVariant?: "handicap" | "todo";
};

/**
 * Au clic : overlay plein écran, puis navigation après 5 s.
 */
export function HandicapSidebarNav({ collapsed, labelVariant = "handicap" }: HandicapSidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [booting, setBooting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelTimer(), [cancelTimer]);

  const startHandicapNav = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (booting) return;
      setBooting(true);
      cancelTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setBooting(false);
        router.push("/dashboard/ecole/handicap");
      }, HANDICAP_NAV_MS);
    },
    [booting, cancelTimer, router],
  );

  const isHandicapActive = pathname.startsWith("/dashboard/ecole/handicap");

  const labelClass =
    labelVariant === "todo"
      ? "bg-gradient-to-r from-[#064e3b] to-[#22c55e] bg-clip-text text-transparent"
      : "bg-gradient-to-r from-[#D65151] to-[#E86B6B] bg-clip-text text-transparent";

  const bootOverlay =
    booting && typeof document !== "undefined" ? (
      <div
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-6 overflow-hidden bg-[#0a0606] px-6 text-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 20%, rgba(214,81,81,0.35), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(232,107,107,0.2), transparent 50%), linear-gradient(180deg, #121212 0%, #1a0c0c 100%)",
        }}
        role="alertdialog"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="pointer-events-none absolute -left-[15%] top-[10%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full bg-[#D65151]/25 blur-[100px] motion-safe:animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="pointer-events-none absolute -right-[10%] bottom-[5%] h-[min(50vw,380px)] w-[min(50vw,380px)] rounded-full bg-[#E86B6B]/20 blur-[90px] motion-safe:animate-pulse"
          style={{ animationDuration: "5.5s" }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[min(40vw,280px)] w-[min(40vw,280px)] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[70px]" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#D65151]/40 bg-black/30 px-5 py-2 backdrop-blur-sm">
            <ShieldCheck className="h-5 w-5 text-[#E86B6B]" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#F5F2E8]">Handicap</span>
          </div>
          <h2 className="max-w-md text-lg font-semibold tracking-tight text-white">
            Ouverture de l&apos;espace handicap
          </h2>
          <p className="max-w-sm text-sm text-white/65">
            Merci de patienter quelques instants pendant le chargement sécurisé.
          </p>
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D65151] to-[#E86B6B]"
              style={{
                transformOrigin: "left center",
                animation: `handicapBootBar ${HANDICAP_NAV_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
        <style>{`
            @keyframes handicapBootBar {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>
      </div>
    ) : null;

  return (
    <>
      {bootOverlay ? createPortal(bootOverlay, document.body) : null}
      <div className="mt-4">
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <linearGradient id="handicapNavStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={labelVariant === "todo" ? "#064e3b" : "#D65151"} />
              <stop offset="100%" stopColor={labelVariant === "todo" ? "#22c55e" : "#E86B6B"} />
            </linearGradient>
          </defs>
        </svg>
        <button
          type="button"
          onClick={startHandicapNav}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-semibold transition hover:opacity-90 ${
            isHandicapActive ? "rounded-xl bg-white/10" : ""
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" style={{ stroke: "url(#handicapNavStroke)" }} />
          {!collapsed ? <span className={labelClass}>Handicap</span> : null}
        </button>
      </div>
    </>
  );
}
