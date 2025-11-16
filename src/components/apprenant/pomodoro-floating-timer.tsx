"use client";

import { Timer, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "./pomodoro-provider";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function PomodoroFloatingTimer({ onFocusModeChange }: { onFocusModeChange?: (enabled: boolean) => void }) {
  const { state, pausePomodoro, resumePomodoro, stopPomodoro, formatTime, progress } = usePomodoro();

  if (state.phase === "idle" || state.phase === "completed") return null;

  const isWorkPhase = state.phase === "work";

  return (
    <div 
      data-pomodoro-timer
      className="fixed top-4 right-4 z-[60] rounded-xl border border-white/20 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] p-4 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Timer className={cn("h-4 w-4", isWorkPhase ? "text-orange-400" : "text-blue-400")} />
          <div className="text-right">
            <div className="text-lg font-bold text-white">{formatTime(state.timeLeft)}</div>
            <div className="text-xs text-white/60">
              {isWorkPhase ? `Session ${state.currentSession + 1}/${state.sessions}` : "Pause"}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000",
              isWorkPhase
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : "bg-gradient-to-r from-blue-500 to-cyan-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-1">
          {state.isActive ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={pausePomodoro}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                resumePomodoro();
                if (isWorkPhase && onFocusModeChange) {
                  onFocusModeChange(true);
                }
              }}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopPomodoro();
              if (onFocusModeChange) {
                onFocusModeChange(false);
              }
            }}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 z-[60] relative"
            style={{ pointerEvents: 'auto' }}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

