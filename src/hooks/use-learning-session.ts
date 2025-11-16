"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ContentType = "course" | "path" | "resource" | "test";

interface LearningSessionConfig {
  contentType: ContentType;
  contentId: string;
  userId?: string;
}

interface LearningSessionState {
  sessionId: string | null;
  startTime: number;
  lastActivityTime: number;
  totalDuration: number; // en secondes
  activeDuration: number; // en secondes
  isActive: boolean;
  isIdle: boolean;
}

const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes en millisecondes
const ACTIVITY_DEBOUNCE = 1000; // 1 seconde entre chaque événement de souris
const SYNC_INTERVAL = 30 * 1000; // Sauvegarder toutes les 30 secondes

export function useLearningSession(config: LearningSessionConfig) {
  const [state, setState] = useState<LearningSessionState>({
    sessionId: null,
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    totalDuration: 0,
    activeDuration: 0,
    isActive: true,
    isIdle: false,
  });

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Détecter l'activité utilisateur
  const recordActivity = useCallback(() => {
    const now = Date.now();

    setState((prev) => {
      // Si on était inactif, ajouter le temps depuis la dernière activité à activeDuration
      let newActiveDuration = prev.activeDuration;
      if (prev.isIdle) {
        // On était inactif, on ne compte pas ce temps
        newActiveDuration = prev.activeDuration;
      } else {
        // On était actif, ajouter le temps écoulé depuis lastActivityTime
        const elapsed = Math.floor((now - prev.lastActivityTime) / 1000); // en secondes
        newActiveDuration = prev.activeDuration + elapsed;
      }

      return {
        ...prev,
        lastActivityTime: now,
        isIdle: false,
        activeDuration: newActiveDuration,
      };
    });

    // Réinitialiser le timeout d'inactivité
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isIdle: true,
      }));
    }, IDLE_THRESHOLD);
  }, []);

  // Démarrer une nouvelle session
  const startSession = useCallback(async () => {
    // Valider les paramètres avant de démarrer
    if (!config.contentType || !config.contentId || config.contentId.trim() === "") {
      console.warn("[useLearningSession] Invalid config, skipping session start:", {
        contentType: config.contentType,
        contentId: config.contentId,
      });
      return;
    }

    try {
      const response = await fetch("/api/learning-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: config.contentType,
          content_id: config.contentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[useLearningSession] Failed to start session:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return; // Ne pas lancer d'erreur, juste logger
      }

      const data = await response.json();
      const sessionId = data.sessionId;

      if (!sessionId) {
        console.warn("[useLearningSession] No sessionId returned from API");
        return;
      }

      setState({
        sessionId,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        totalDuration: 0,
        activeDuration: 0,
        isActive: true,
        isIdle: false,
      });

      // Enregistrer l'activité initiale
      recordActivity();
    } catch (error) {
      console.error("[useLearningSession] Error starting session:", error);
    }
  }, [config.contentType, config.contentId, recordActivity]);

  // Mettre à jour la session
  const updateSession = useCallback(async () => {
    if (!state.sessionId) return;

    const now = Date.now();
    const totalSeconds = Math.floor((now - state.startTime) / 1000);

    setState((prev) => {
      // Calculer le temps actif depuis la dernière mise à jour
      let newActiveDuration = prev.activeDuration;
      if (!prev.isIdle) {
        const elapsed = Math.floor((now - prev.lastActivityTime) / 1000);
        newActiveDuration = prev.activeDuration + elapsed;
      }

      return {
        ...prev,
        totalDuration: totalSeconds,
        activeDuration: newActiveDuration,
        lastActivityTime: now,
      };
    });

    try {
      await fetch("/api/learning-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          duration_seconds: totalSeconds,
          duration_active_seconds: state.activeDuration,
        }),
      });
    } catch (error) {
      console.error("[useLearningSession] Error updating session:", error);
    }
  }, [state.sessionId, state.startTime, state.activeDuration, state.lastActivityTime, state.isIdle]);

  // Terminer la session
  const endSession = useCallback(async () => {
    if (!state.sessionId) return;

    const now = Date.now();
    const totalSeconds = Math.floor((now - state.startTime) / 1000);
    
    let finalActiveDuration = state.activeDuration;
    if (!state.isIdle) {
      const elapsed = Math.floor((now - state.lastActivityTime) / 1000);
      finalActiveDuration = state.activeDuration + elapsed;
    }

    try {
      await fetch("/api/learning-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          duration_seconds: totalSeconds,
          duration_active_seconds: finalActiveDuration,
          ended_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("[useLearningSession] Error ending session:", error);
    }

    // Nettoyer les timeouts
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
  }, [state.sessionId, state.startTime, state.activeDuration, state.lastActivityTime, state.isIdle]);

  // Écouter les événements d'activité
  useEffect(() => {
    // Démarrer la session au montage
    startSession();

    // Événements pour détecter l'activité
    const handleActivity = () => {
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }

      activityDebounceRef.current = setTimeout(() => {
        recordActivity();
      }, ACTIVITY_DEBOUNCE);
    };

    // Écouter les mouvements de souris, clics, touches, scroll
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Écouter le focus/blur de la fenêtre
    const handleFocus = () => {
      recordActivity();
    };

    const handleBlur = () => {
      setState((prev) => ({ ...prev, isIdle: true }));
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Synchroniser périodiquement avec le serveur
    syncIntervalRef.current = setInterval(() => {
      updateSession();
    }, SYNC_INTERVAL);

    // Nettoyer au démontage
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      
      // Terminer la session
      endSession();
    };
  }, [startSession, recordActivity, updateSession, endSession]);

  // Mettre à jour le temps total en temps réel (pour l'affichage)
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const totalSeconds = Math.floor((now - prev.startTime) / 1000);
        
        let newActiveDuration = prev.activeDuration;
        if (!prev.isIdle) {
          const elapsed = Math.floor((now - prev.lastActivityTime) / 1000);
          newActiveDuration = prev.activeDuration + elapsed;
        }

        return {
          ...prev,
          totalDuration: totalSeconds,
          activeDuration: newActiveDuration,
        };
      });
    }, 1000); // Mettre à jour toutes les secondes

    return () => clearInterval(interval);
  }, []);

  return {
    sessionId: state.sessionId,
    totalDuration: state.totalDuration,
    activeDuration: state.activeDuration,
    isActive: state.isActive,
    isIdle: state.isIdle,
    // Helpers pour l'affichage
    totalDurationFormatted: formatDuration(state.totalDuration),
    activeDurationFormatted: formatDuration(state.activeDuration),
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

