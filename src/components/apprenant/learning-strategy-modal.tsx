"use client";

import { useState } from "react";
import { X, Brain, Timer, Focus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { DyslexiaSettingsPalette } from "@/components/apprenant/dyslexia-settings-palette";
import { PomodoroSettingsModal } from "@/components/apprenant/pomodoro-settings-modal";
import { cn } from "@/lib/utils";

type LearningStrategyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFocusModeChange?: (focus: boolean) => void;
};

export function LearningStrategyModal({
  isOpen,
  onClose,
  onFocusModeChange,
}: LearningStrategyModalProps) {
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();
  const [showDyslexiaPalette, setShowDyslexiaPalette] = useState(false);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const handleFocusMode = () => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    onFocusModeChange?.(newFocusMode);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl border-white/20 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] shadow-2xl">
          <DialogHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Choisir sa stratégie d'apprentissage
                </DialogTitle>
                <DialogDescription className="text-white/60 mt-1">
                  Personnalisez votre expérience d'apprentissage
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {/* Neuro Adapter */}
            <button
              onClick={() => {
                if (!isDyslexiaMode) {
                  toggleDyslexiaMode();
                  setShowDyslexiaPalette(true);
                  onClose(); // Fermer le modal immédiatement
                } else {
                  toggleDyslexiaMode();
                  onClose(); // Fermer le modal immédiatement
                }
              }}
              className={cn(
                "w-full group relative overflow-hidden rounded-2xl border transition-all duration-300 text-left",
                "hover:scale-[1.02] hover:shadow-xl",
                isDyslexiaMode
                  ? "border-blue-500/50 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-transparent shadow-lg shadow-blue-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <div className="p-6 flex items-start gap-4">
                <div className={cn(
                  "rounded-xl p-3 transition-all duration-300",
                  isDyslexiaMode
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                    : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Brain className={cn(
                    "h-6 w-6 transition-colors",
                    isDyslexiaMode ? "text-white" : "text-blue-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={cn(
                      "text-lg font-semibold transition-colors",
                      isDyslexiaMode ? "text-white" : "text-white/90"
                    )}>
                      {isDyslexiaMode ? "Neuro adapter activé" : "Activer le neuro adapter"}
                    </h3>
                    {isDyslexiaMode && (
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 uppercase tracking-wide">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Adapte la typographie, l'espacement et le contraste pour améliorer votre lisibilité et votre compréhension
                  </p>
                </div>
              </div>
            </button>

            {/* Mode Focus */}
            <button
              onClick={() => {
                handleFocusMode();
                onClose(); // Fermer le modal immédiatement
              }}
              className={cn(
                "w-full group relative overflow-hidden rounded-2xl border transition-all duration-300 text-left",
                "hover:scale-[1.02] hover:shadow-xl",
                focusMode
                  ? "border-[#FF512F]/50 bg-gradient-to-br from-[#FF512F]/20 via-[#DD2476]/15 to-transparent shadow-lg shadow-[#DD2476]/20"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <div className="p-6 flex items-start gap-4">
                <div className={cn(
                  "rounded-xl p-3 transition-all duration-300",
                  focusMode
                    ? "bg-gradient-to-r from-[#FF512F] to-[#DD2476] shadow-lg shadow-[#DD2476]/30"
                    : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Focus className={cn(
                    "h-6 w-6 transition-colors",
                    focusMode ? "text-white" : "text-[#FF512F]"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={cn(
                      "text-lg font-semibold transition-colors",
                      focusMode ? "text-white" : "text-white/90"
                    )}>
                      {focusMode ? "Mode focus activé" : "Activer le mode focus"}
                    </h3>
                    {focusMode && (
                      <span className="rounded-full bg-[#FF512F]/20 px-3 py-1 text-xs font-semibold text-[#FF512F] uppercase tracking-wide">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Masque les distractions pour une concentration optimale et une meilleure rétention de l'information
                  </p>
                </div>
              </div>
            </button>

            {/* Méthode Pomodoro */}
            <button
              onClick={() => {
                setShowPomodoroModal(true);
                onClose(); // Fermer le modal immédiatement
              }}
              className="w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl text-left"
            >
              <div className="p-6 flex items-start gap-4">
                <div className="rounded-xl p-3 bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                  <Timer className="h-6 w-6 text-purple-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white/90">
                      Activer la méthode Pomodoro
                    </h3>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Gérez votre temps efficacement avec des sessions de travail structurées et des pauses régulières
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 px-6"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dyslexia Settings Palette */}
      <DyslexiaSettingsPalette
        isOpen={showDyslexiaPalette}
        onClose={() => setShowDyslexiaPalette(false)}
        onPreferencesChange={() => {}}
      />

      {/* Pomodoro Settings Modal */}
      <PomodoroSettingsModal
        isOpen={showPomodoroModal}
        onClose={() => setShowPomodoroModal(false)}
        onFocusModeChange={setFocusMode}
      />
    </>
  );
}

