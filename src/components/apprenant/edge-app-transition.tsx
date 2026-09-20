"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { edgePerfMark, edgePerfMeasure } from "@/lib/edge/perf-marks";

/** Animation totale cible : 500–800 ms (plus de sleep 5s). */
const TRANSITION_MS = 700;
const FADE_OUT_MS = 180;

type AppTransitionProps = {
  /** Nom sur UNE ligne (ex. « EDGE Learn » ou « Pilotage »). */
  appName?: string;
  app?: string;
  open: boolean;
  onComplete: () => void;
  className?: string;
};

/**
 * Transition de marque courte — la navigation destination doit démarrer
 * en parallèle (router.push dès le clic), pas après cette animation.
 */
export function AppTransition({ appName, app, open, onComplete, className }: AppTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "hold" | "out">("idle");
  const raw = String(appName ?? app ?? "").trim() || "EDGE";
  const line = /^EDGE\b/i.test(raw) ? raw : `EDGE ${raw}`;
  const parts = line.match(/^(EDGE)\s+(.+)$/i);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      return;
    }
    edgePerfMark("transition-open", { line });
    setPhase("in");
    const holdTimer = window.setTimeout(() => setPhase("hold"), 120);
    const outTimer = window.setTimeout(() => setPhase("out"), TRANSITION_MS - FADE_OUT_MS);
    const doneTimer = window.setTimeout(() => {
      edgePerfMeasure("app-transition", "transition-open", "transition-done");
      onComplete();
      setPhase("idle");
    }, TRANSITION_MS);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(outTimer);
      window.clearTimeout(doneTimer);
    };
  }, [open, onComplete, line]);

  if (!open && phase === "idle") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[400] flex items-center justify-center overflow-hidden",
        "bg-[#05060a]",
        phase === "out" && "opacity-0 transition-opacity duration-200 ease-out",
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
          "relative z-10 px-6 text-center transition-all duration-200 ease-out",
          phase === "out" && "scale-[0.99] opacity-0",
        )}
        style={phase === "in" ? { animation: "edgeBrandIn 220ms ease-out forwards" } : undefined}
      >
        <h1 className="whitespace-nowrap text-4xl tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
          {parts ? (
            <>
              <span className="font-extrabold">{parts[1]}</span>
              <span className="font-semibold"> {parts[2]}</span>
            </>
          ) : (
            <span className="font-extrabold">{line}</span>
          )}
        </h1>
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

export const EDGE_APP_TRANSITION_MS = TRANSITION_MS;
