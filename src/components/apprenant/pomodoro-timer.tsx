"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type PomodoroPhase = "work" | "break" | "idle";

type PomodoroTimerProps = {
  onFocusModeChange: (enabled: boolean) => void;
};

export function PomodoroTimer({ onFocusModeChange }: PomodoroTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes en secondes
  const [sessions, setSessions] = useState(1);
  const [currentSession, setCurrentSession] = useState(0);
  const [customWorkTime, setCustomWorkTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const WORK_TIME = customWorkTime * 60; // Convertir en secondes
  const BREAK_TIME = customBreakTime * 60;

  // Fonction pour gérer la fin du timer (mémorisée avec useCallback)
  const handleTimerComplete = useCallback(() => {
    if (phase === "work") {
      // Pause
      setPhase("break");
      setTimeLeft(BREAK_TIME);
      setIsActive(false);
      onFocusModeChange(false);
      toast.success(`Temps de travail terminé ! Pause de ${customBreakTime} minutes.`);
    } else if (phase === "break") {
      // Nouvelle session de travail ou fin
      setCurrentSession((prev) => {
        const next = prev + 1;
        if (next >= sessions) {
          // Toutes les sessions sont terminées
          setIsActive(false);
          setPhase("idle");
          setTimeLeft(WORK_TIME);
          setCurrentSession(0);
          onFocusModeChange(false);
          toast.success(`Toutes les sessions sont terminées ! 🎉`);
          return 0;
        } else {
          // Nouvelle session de travail
          setPhase("work");
          setTimeLeft(WORK_TIME);
          setIsActive(true);
          onFocusModeChange(true);
          toast.info(`Session ${next + 1}/${sessions} - C'est parti !`);
          return next;
        }
      });
    }
  }, [phase, sessions, WORK_TIME, BREAK_TIME, customBreakTime, onFocusModeChange]);

  // Gérer le timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeLeft, handleTimerComplete]);


  const startPomodoro = () => {
    if (sessions < 1) {
      toast.error("Le nombre de sessions doit être au moins 1");
      return;
    }
    setPhase("work");
    setTimeLeft(WORK_TIME);
    setCurrentSession(0);
    setIsActive(true);
    onFocusModeChange(true); // Activer le mode focus
    toast.info(`Pomodoro démarré ! ${sessions} session(s) de ${customWorkTime} minutes`);
  };

  const pausePomodoro = () => {
    setIsActive(false);
    onFocusModeChange(false);
  };

  const resumePomodoro = () => {
    setIsActive(true);
    if (phase === "work") {
      onFocusModeChange(true);
    }
  };

  const stopPomodoro = () => {
    setIsActive(false);
    setPhase("idle");
    setTimeLeft(WORK_TIME);
    setCurrentSession(0);
    onFocusModeChange(false);
    toast.info("Pomodoro arrêté");
  };

  const resetPomodoro = () => {
    stopPomodoro();
    setTimeLeft(WORK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = phase === "work" 
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Timer className="h-5 w-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Méthode Pomodoro</h3>
      </div>

      {/* Configuration (visible seulement si idle) */}
      {phase === "idle" && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Temps de travail (min)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={customWorkTime}
                onChange={(e) => setCustomWorkTime(Math.max(1, Math.min(60, parseInt(e.target.value) || 25)))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Temps de pause (min)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={customBreakTime}
                onChange={(e) => setCustomBreakTime(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Nombre de sessions</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={sessions}
              onChange={(e) => setSessions(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-white mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-white/60 mb-4">
          {phase === "work" && `Session ${currentSession + 1}/${sessions} - Travail`}
          {phase === "break" && `Pause - Session ${currentSession + 1}/${sessions} terminée`}
          {phase === "idle" && "Prêt à commencer"}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {phase === "idle" ? (
          <Button
            onClick={startPomodoro}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Play className="h-4 w-4 mr-2" />
            Démarrer
          </Button>
        ) : (
          <>
            {isActive ? (
              <Button
                onClick={pausePomodoro}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={resumePomodoro}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Reprendre
              </Button>
            )}
            <Button
              onClick={stopPomodoro}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              onClick={resetPomodoro}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

