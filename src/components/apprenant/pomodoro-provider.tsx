"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { toast } from "sonner";

type PomodoroPhase = "work" | "break" | "idle" | "completed";

type PomodoroState = {
  isActive: boolean;
  phase: PomodoroPhase;
  timeLeft: number;
  sessions: number;
  currentSession: number;
  customWorkTime: number;
  customBreakTime: number;
  startTime: number | null;
};

type PomodoroContextType = {
  state: PomodoroState;
  startPomodoro: (workTime: number, breakTime: number, sessions: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  resetPomodoro: () => void;
  formatTime: (seconds: number) => string;
  progress: number;
  showCompletionScreen: boolean;
  completionMessage: string;
  dismissCompletion: () => void;
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const MOTIVATIONAL_MESSAGES = [
  "Bravo ! Vous avez terminé une session de travail. Prenez une pause bien méritée ! 🎉",
  "Excellent travail ! La méthode Pomodoro améliore votre concentration et votre productivité. 💪",
  "Félicitations ! Vous avez respecté votre planning. Continuez ainsi ! 🌟",
  "Super ! Chaque session complétée vous rapproche de vos objectifs. 🚀",
  "Parfait ! Votre cerveau a besoin de ces pauses pour mieux assimiler. 🧠",
  "Bravo ! La régularité est la clé du succès. Vous êtes sur la bonne voie ! ✨",
];

const POMODORO_BENEFITS = [
  "Améliore la concentration en limitant les distractions",
  "Réduit la fatigue mentale grâce aux pauses régulières",
  "Augmente la productivité en structurant le temps",
  "Aide à mieux estimer le temps nécessaire pour les tâches",
  "Réduit le stress en créant un rythme de travail équilibré",
];

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PomodoroState>({
    isActive: false,
    phase: "idle",
    timeLeft: 25 * 60,
    sessions: 1,
    currentSession: 0,
    customWorkTime: 25,
    customBreakTime: 5,
    startTime: null,
  });
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (state.phase !== "idle") {
      localStorage.setItem("pomodoroState", JSON.stringify(state));
    }
  }, [state]);

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem("pomodoroState");
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        // Vérifier si le timer était actif et calculer le temps restant
        if (savedState.isActive && savedState.startTime) {
          const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000);
          const remaining = Math.max(0, savedState.timeLeft - elapsed);
          setState({
            ...savedState,
            timeLeft: remaining,
            startTime: savedState.startTime,
          });
        } else {
          setState({ ...savedState, isActive: false, startTime: null });
        }
      } catch (error) {
        console.error("[pomodoro] Error loading state:", error);
      }
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "work") {
        // Pause - Afficher l'écran de complétion
        const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
        setShowCompletionScreen(true);
        setCompletionMessage(message);
        
        return {
          ...prev,
          phase: "break",
          timeLeft: prev.customBreakTime * 60,
          isActive: false,
          startTime: null,
        };
      } else if (prev.phase === "break") {
        // Nouvelle session de travail ou fin
        const next = prev.currentSession + 1;
        if (next >= prev.sessions) {
          // Toutes les sessions sont terminées
          const message = `🎉 Félicitations ! Vous avez terminé toutes vos ${prev.sessions} session(s) de travail. Vous avez accompli un excellent travail aujourd'hui !`;
          setShowCompletionScreen(true);
          setCompletionMessage(message);
          
          return {
            ...prev,
            isActive: false,
            phase: "completed",
            timeLeft: prev.customWorkTime * 60,
            currentSession: 0,
            startTime: null,
          };
        } else {
          // Nouvelle session de travail
          toast.info(`Session ${next + 1}/${prev.sessions} - C'est parti !`);
          return {
            ...prev,
            phase: "work",
            timeLeft: prev.customWorkTime * 60,
            isActive: true,
            currentSession: next,
            startTime: Date.now(),
          };
        }
      }
      return prev;
    });
  }, []);

  // Gérer le timer
  useEffect(() => {
    if (state.isActive && state.timeLeft > 0 && state.phase !== "idle" && state.phase !== "completed") {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            // Utiliser setTimeout pour éviter les problèmes de state dans le callback
            setTimeout(() => {
              handleTimerComplete();
            }, 0);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: newTimeLeft };
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
  }, [state.isActive, state.phase, handleTimerComplete]);

  const startPomodoro = useCallback((workTime: number, breakTime: number, sessions: number) => {
    setState({
      isActive: true,
      phase: "work",
      timeLeft: workTime * 60,
      sessions,
      currentSession: 0,
      customWorkTime: workTime,
      customBreakTime: breakTime,
      startTime: Date.now(),
    });
    toast.info(`Pomodoro démarré ! ${sessions} session(s) de ${workTime} minutes`);
  }, []);

  const pausePomodoro = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const resumePomodoro = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      startTime: Date.now() - (prev.customWorkTime * 60 - prev.timeLeft) * 1000,
    }));
  }, []);

  const stopPomodoro = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      phase: "idle",
      timeLeft: prev.customWorkTime * 60,
      currentSession: 0,
      startTime: null,
    }));
    localStorage.removeItem("pomodoroState");
    toast.info("Pomodoro arrêté");
  }, []);

  const resetPomodoro = useCallback(() => {
    stopPomodoro();
  }, [stopPomodoro]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const progress =
    state.phase === "work"
      ? ((state.customWorkTime * 60 - state.timeLeft) / (state.customWorkTime * 60)) * 100
      : state.phase === "break"
      ? ((state.customBreakTime * 60 - state.timeLeft) / (state.customBreakTime * 60)) * 100
      : 0;

  const dismissCompletion = useCallback(() => {
    setShowCompletionScreen(false);
    if (state.phase === "break") {
      // Démarrer automatiquement la pause après fermeture de l'écran
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isActive: true,
          startTime: Date.now(),
        }));
      }, 500);
    } else if (state.phase === "completed") {
      stopPomodoro();
    }
  }, [state.phase, stopPomodoro]);

  return (
    <PomodoroContext.Provider
      value={{
        state,
        startPomodoro,
        pausePomodoro,
        resumePomodoro,
        stopPomodoro,
        resetPomodoro,
        formatTime,
        progress,
        showCompletionScreen,
        completionMessage,
        dismissCompletion,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
}

