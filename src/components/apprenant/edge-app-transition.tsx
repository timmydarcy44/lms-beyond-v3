"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { edgePerfMark, edgePerfMeasure } from "@/lib/edge/perf-marks";

/** Durée minimale d’affichage de la marque. */
const MIN_HOLD_MS = 520;
/** Fade de sortie uniquement quand la destination est prête. */
const FADE_OUT_MS = 160;
/** Filet de sécurité si la navigation reste bloquée. */
const MAX_WAIT_MS = 8000;

const BYOUND_LOGO_WHITE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png";

type AppTransitionProps = {
  /** Nom de l’app (ex. « Byound Learn », « Learn » ou « Pilotage »). */
  appName?: string;
  app?: string;
  open: boolean;
  /** true quand le pathname correspond déjà à l’app cible. */
  destinationReady?: boolean;
  onComplete: () => void;
  className?: string;
};

/** Extrait le libellé d’application (sans le préfixe marque). */
function resolveAppLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^(Byound|EDGE)\s+/i, "").trim() || trimmed;
}

/**
 * Transition de marque — reste opaque jusqu’à ce que la destination soit prête,
 * pour ne jamais révéler l’ancien dashboard entre-deux.
 */
export function AppTransition({
  appName,
  app,
  open,
  destinationReady = false,
  onComplete,
  className,
}: AppTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "hold" | "out">("idle");
  const openedAtRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const appLabel = resolveAppLabel(String(appName ?? app ?? ""));
  const line = appLabel ? `Byound ${appLabel}` : "Byound";

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      completedRef.current = false;
      return;
    }
    completedRef.current = false;
    openedAtRef.current = performance.now();
    edgePerfMark("transition-open", { line });
    setPhase("in");
    const holdTimer = window.setTimeout(() => setPhase("hold"), 100);
    return () => window.clearTimeout(holdTimer);
  }, [open, line]);

  useEffect(() => {
    if (!open || phase === "idle" || phase === "out" || completedRef.current) return;

    const tryDismiss = () => {
      if (completedRef.current) return;
      const elapsed = performance.now() - openedAtRef.current;
      const minOk = elapsed >= MIN_HOLD_MS;
      const forced = elapsed >= MAX_WAIT_MS;
      if ((!destinationReady || !minOk) && !forced) return;

      completedRef.current = true;
      setPhase("out");
      window.setTimeout(() => {
        edgePerfMeasure("app-transition", "transition-open", "transition-done");
        onCompleteRef.current();
        setPhase("idle");
      }, FADE_OUT_MS);
    };

    tryDismiss();
    const poll = window.setInterval(tryDismiss, 50);
    return () => window.clearInterval(poll);
  }, [open, phase, destinationReady]);

  if (!open && phase === "idle") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[400] flex items-center justify-center overflow-hidden",
        "bg-[#05060a]",
        phase === "out" && "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
        className,
      )}
      role="presentation"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 42%, rgba(61,123,255,0.22), transparent 62%), radial-gradient(ellipse 90% 70% at 100% 100%, rgba(61,123,255,0.08), transparent 55%)",
        }}
      />
      <div
        className={cn(
          "relative z-10 flex items-center gap-4 px-6 transition-all duration-150 ease-out sm:gap-5 md:gap-6",
          phase === "out" && "scale-[0.99] opacity-0",
        )}
        style={phase === "in" ? { animation: "edgeBrandIn 220ms ease-out forwards" } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BYOUND_LOGO_WHITE}
          alt="Byound"
          className="h-9 w-auto sm:h-11 md:h-14 lg:h-16"
        />
        {appLabel ? (
          <h1 className="whitespace-nowrap text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {appLabel}
          </h1>
        ) : null}
      </div>
      <style jsx global>{`
        @keyframes edgeBrandIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/** @deprecated Utiliser AppTransition */
export function EdgeAppTransition(props: {
  app: string;
  open: boolean;
  onComplete: () => void;
  className?: string;
}) {
  return (
    <AppTransition
      appName={props.app}
      open={props.open}
      onComplete={props.onComplete}
      className={props.className}
    />
  );
}

export const EDGE_APP_TRANSITION_MS = MIN_HOLD_MS;
