"use client";

import { useEffect } from "react";
import { usePomodoro } from "./pomodoro-provider";

/**
 * Composant qui gère automatiquement le mode focus basé sur l'état du Pomodoro
 * Il ajoute une classe CSS au body pour activer le mode focus
 */
export function PomodoroFocusManager() {
  const { state } = usePomodoro();

  useEffect(() => {
    const body = document.body;
    
    if (state.phase === "work" && state.isActive) {
      body.classList.add("pomodoro-focus-mode");
    } else {
      body.classList.remove("pomodoro-focus-mode");
    }

    return () => {
      body.classList.remove("pomodoro-focus-mode");
    };
  }, [state.phase, state.isActive]);

  return null;
}







