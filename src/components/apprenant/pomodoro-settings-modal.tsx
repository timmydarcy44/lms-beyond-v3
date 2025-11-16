"use client";

import { useState } from "react";
import { X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { usePomodoro } from "./pomodoro-provider";

type PomodoroSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFocusModeChange: (enabled: boolean) => void;
};

export function PomodoroSettingsModal({
  isOpen,
  onClose,
  onFocusModeChange,
}: PomodoroSettingsModalProps) {
  const { startPomodoro } = usePomodoro();
  const [customWorkTime, setCustomWorkTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);
  const [sessions, setSessions] = useState(1);

  if (!isOpen) return null;

  const handleStart = () => {
    if (sessions < 1) {
      return;
    }
    startPomodoro(customWorkTime, customBreakTime, sessions);
    onFocusModeChange(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Méthode Pomodoro</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Configuration */}
        <div className="space-y-6">
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

          {/* Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              Le timer fonctionnera sur l'ensemble de votre formation, pas seulement sur un chapitre. 
              Vous pouvez naviguer entre les chapitres pendant la session.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Démarrer
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


