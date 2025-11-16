"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "./pomodoro-provider";

const POMODORO_BENEFITS = [
  "Améliore la concentration en limitant les distractions",
  "Réduit la fatigue mentale grâce aux pauses régulières",
  "Augmente la productivité en structurant le temps",
  "Aide à mieux estimer le temps nécessaire pour les tâches",
  "Réduit le stress en créant un rythme de travail équilibré",
];

export function PomodoroCompletionScreen() {
  const { showCompletionScreen, completionMessage, dismissCompletion, state } = usePomodoro();

  if (!showCompletionScreen) return null;

  const isCompleted = state.phase === "completed";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/20 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] p-8 shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={dismissCompletion}
          className="absolute top-4 right-4 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 p-4">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Session terminée !</h2>
            <p className="text-lg text-white/80 leading-relaxed">{completionMessage}</p>
          </div>

          {/* Benefits (toujours afficher, mais plus détaillé si toutes les sessions sont terminées) */}
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6 text-left">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isCompleted ? "Les bienfaits de la méthode Pomodoro :" : "Pendant votre pause :"}
            </h3>
            {isCompleted ? (
              <ul className="space-y-2">
                {POMODORO_BENEFITS.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-white/70">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/70">
                Profitez de cette pause pour vous détendre, vous étirer ou prendre un verre d'eau. 
                Votre cerveau a besoin de ces moments de repos pour mieux assimiler ce que vous venez d'apprendre.
              </p>
            )}
          </div>

          {/* Action */}
          <div className="pt-4">
            <Button
              onClick={dismissCompletion}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isCompleted ? "Fermer" : "Continuer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

