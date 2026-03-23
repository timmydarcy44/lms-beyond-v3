"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";

type OverlayStatus = "recording" | "analyzing" | "speaking" | "result";

type NeoVoiceOverlayProps = {
  open: boolean;
  status: OverlayStatus;
  targetText: string;
  transcription: string | null;
  score: number | null;
  onAnalyze: () => void;
  onClose: () => void;
};

export function NeoVoiceOverlay({
  open,
  status,
  targetText,
  transcription,
  score,
  onAnalyze,
  onClose,
}: NeoVoiceOverlayProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const message = useMemo(() => {
    if (status === "recording") return "Je t'écoute... Prononce ta phrase.";
    if (status === "analyzing") return "Analyse en cours... Un instant.";
    if (status === "speaking") return "Neo te répond à l'oral...";
    return "Résultat";
  }, [status]);

  if (!open) return null;

  const scoreLabel =
    score === null
      ? null
      : score >= 90
        ? { text: "Perfect / Native", color: "text-emerald-400", orb: "" }
        : score >= 70
          ? { text: "Good (accent à corriger)", color: "text-amber-400", orb: "" }
          : { text: "Needs work", color: "text-red-400", orb: "neo-orb-neutral" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0F1117] text-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/70 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-6">
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">Phrase modèle</p>
              <p className="text-base font-semibold">{targetText}</p>
            </div>
            <div className="relative flex items-center justify-center">
            {status === "recording" ? <span className="neo-pulse-ring" /> : null}
              <div
                className={`neo-orb ${status === "analyzing" ? "neo-orb-spin" : ""} ${
                  status === "result" && scoreLabel?.orb ? scoreLabel.orb : ""
                }`}
              >
              {status === "speaking" ? (
                <div className="neo-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <span className="text-xs uppercase tracking-[0.3em]">Neo</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Coach vocal</p>
            <h3 className="text-lg font-semibold">{message}</h3>
          </div>

          {status === "result" ? (
            <div className="w-full space-y-3 text-left">
              {scoreLabel ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-1">Score</p>
                  <p className={`text-lg font-semibold ${scoreLabel.color}`}>
                    {score} / 100 — {scoreLabel.text}
                  </p>
                </div>
              ) : null}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-1">Ta phrase</p>
                <p className="text-sm">{transcription || "..."}</p>
              </div>
            </div>
          ) : null}
          {status === "recording" ? (
            <button
              type="button"
              onClick={onAnalyze}
              className="w-full rounded-2xl bg-white text-[#0F1117] font-semibold py-3 mt-2 hover:bg-white/90 transition"
            >
              J'ai terminé / Analyser
            </button>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .neo-orb {
          height: 120px;
          width: 120px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ff4d00, #ff0000);
          box-shadow: 0 0 30px rgba(255, 77, 0, 0.4);
        }
        .neo-orb-neutral {
          background: linear-gradient(135deg, #6b7280, #1f2937);
          box-shadow: 0 0 30px rgba(107, 114, 128, 0.4);
        }
        .neo-orb-spin {
          animation: neoSpin 1.2s linear infinite;
        }
        .neo-pulse-ring {
          position: absolute;
          height: 150px;
          width: 150px;
          border-radius: 999px;
          border: 2px solid rgba(255, 77, 0, 0.5);
          animation: neoPulse 1.4s ease-out infinite;
        }
        .neo-bars {
          display: flex;
          gap: 6px;
          align-items: flex-end;
          height: 36px;
        }
        .neo-bars span {
          width: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          animation: neoBars 0.9s ease-in-out infinite;
        }
        .neo-bars span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .neo-bars span:nth-child(3) {
          animation-delay: 0.3s;
        }
        .neo-bars span:nth-child(4) {
          animation-delay: 0.45s;
        }
        @keyframes neoPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        @keyframes neoSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes neoBars {
          0%,
          100% {
            height: 8px;
          }
          50% {
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}
