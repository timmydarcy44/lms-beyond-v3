"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pause, Play, RotateCcw, X } from "lucide-react";

type PomodoroStatus = "idle" | "running" | "paused" | "break";

interface PomodoroTimerProps {
  onComplete: () => void;
  onClose: () => void;
  documentId: string;
}

const DURATIONS = [15, 25, 45];
const BREAK_MINUTES = 5;

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function PomodoroTimer({ onComplete, onClose, documentId }: PomodoroTimerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const totalSeconds = useMemo(() => {
    if (status === "break") return BREAK_MINUTES * 60;
    return selectedMinutes * 60;
  }, [status, selectedMinutes]);

  useEffect(() => {
    if (status === "idle") {
      setSecondsLeft(selectedMinutes * 60);
    }
  }, [selectedMinutes, status]);

  useEffect(() => {
    if (status !== "running" && status !== "break") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (status === "running") {
      if ("vibrate" in navigator) {
        navigator.vibrate?.(300);
      }
      toast.success("Session terminée ! Pause 5 minutes");
      setStatus("break");
      setSecondsLeft(BREAK_MINUTES * 60);
      onComplete();
      void fetch("/api/beyond-note/pomodoro-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          duration_minutes: selectedMinutes,
          completed: true,
          ended_at: new Date().toISOString(),
          actions_performed: { mode: "pomodoro" },
        }),
      }).catch(() => {});
      return;
    }
    if (status === "break") {
      toast.success("Pause terminée !");
      setStatus("idle");
      setSecondsLeft(selectedMinutes * 60);
    }
  }, [secondsLeft, status, documentId, selectedMinutes, onComplete]);

  const toggle = () => {
    if (status === "running") {
      setStatus("paused");
      return;
    }
    if (status === "paused" || status === "idle") {
      setStatus("running");
    }
  };

  const reset = () => {
    setStatus("idle");
    setSecondsLeft(selectedMinutes * 60);
  };

  const progress = totalSeconds ? (1 - secondsLeft / totalSeconds) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">
            Pomodoro
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#6D28D9"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xl font-semibold">
                {formatTime(secondsLeft)}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              {DURATIONS.map((min) => (
                <Button
                  key={min}
                  onClick={() => {
                    if (status === "running" || status === "break") return;
                    setSelectedMinutes(min);
                  }}
                  variant="outline"
                  className={`border-white/20 text-white hover:bg-white/5 ${
                    selectedMinutes === min ? "bg-white/10" : ""
                  }`}
                >
                  {min} min
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={toggle}
                className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
              >
                {status === "running" ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Démarrer
                  </>
                )}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
            <div className="text-xs text-white/40 mt-3">
              {status === "break" ? "Pause en cours" : "Session de focus"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
