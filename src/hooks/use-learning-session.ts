"use client";

/** Appels `fetch("/api/learning-sessions", …)` — persistance `learning_sessions` (voir route API). */
import { supabase } from "@/lib/supabase";
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
  totalDuration: number;
  activeDuration: number;
  isActive: boolean;
  isIdle: boolean;
  loading: boolean;
}

const IDLE_THRESHOLD = 5 * 60 * 1000;
const ACTIVITY_DEBOUNCE = 1000;
const SYNC_INTERVAL = 30 * 1000;

const initialState = (): LearningSessionState => ({
  sessionId: null,
  startTime: Date.now(),
  lastActivityTime: Date.now(),
  totalDuration: 0,
  activeDuration: 0,
  isActive: true,
  isIdle: false,
  loading: false,
});

function storageKey(contentType: ContentType, contentId: string) {
  return `learningSession:${contentType}:${contentId}:activeSeconds`;
}

function readPersistedSeconds(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writePersistedSeconds(key: string, seconds: number) {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(seconds))));
  } catch {
    // ignore
  }
}

function sessionIdKey(contentType: ContentType, contentId: string) {
  return `learningSession:${contentType}:${contentId}:sessionId`;
}

function readPersistedSessionId(key: string): string | null {
  try {
    const v = window.sessionStorage.getItem(key);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

function writePersistedSessionId(key: string, sessionId: string) {
  try {
    window.sessionStorage.setItem(key, sessionId);
  } catch {
    // ignore
  }
}

export function useLearningSession(config: LearningSessionConfig) {
  const [state, setState] = useState<LearningSessionState>(initialState);

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const fatalStartErrorRef = useRef(false);
  const startLockRef = useRef(false);
  const startHttpErrorLoggedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const lastStartAttemptAtRef = useRef<number>(0);
  /** Incrémenté à chaque run d’effet pour ignorer les réponses POST obsolètes (changement de contenu / Strict Mode). */
  const mountTokenRef = useRef(0);

  const recordActivity = useCallback(() => {
    const now = Date.now();

    setState((prev) => {
      let newActiveDuration = prev.activeDuration;
      if (!prev.isIdle) {
        const elapsed = Math.floor((now - prev.lastActivityTime) / 1000);
        newActiveDuration = prev.activeDuration + elapsed;
      }

      // on persiste en continu (additif) pour le contenu courant
      writePersistedSeconds(storageKey(config.contentType, config.contentId), newActiveDuration);

      return {
        ...prev,
        lastActivityTime: now,
        isIdle: false,
        activeDuration: newActiveDuration,
      };
    });

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isIdle: true,
      }));
    }, IDLE_THRESHOLD);
  }, [config.contentType, config.contentId]);

  const flushAndPersist = useCallback((markIdle: boolean) => {
    const now = Date.now();
    setState((prev) => {
      let newActiveDuration = prev.activeDuration;
      if (!prev.isIdle) {
        const elapsed = Math.floor((now - prev.lastActivityTime) / 1000);
        newActiveDuration = prev.activeDuration + elapsed;
      }
      writePersistedSeconds(storageKey(config.contentType, config.contentId), newActiveDuration);
      const nextIdle = markIdle ? true : prev.isIdle;
      // Évite de déclencher une boucle de re-render : si rien ne change, retourner `prev`.
      if (newActiveDuration === prev.activeDuration && nextIdle === prev.isIdle) {
        return prev;
      }
      return {
        ...prev,
        activeDuration: newActiveDuration,
        ...(nextIdle !== prev.isIdle ? { isIdle: nextIdle } : null),
        // On ne met à jour lastActivityTime que si on a effectivement ajouté du temps actif.
        ...(newActiveDuration !== prev.activeDuration ? { lastActivityTime: now } : null),
      };
    });
  }, [config.contentType, config.contentId]);

  const persistOnly = useCallback(
    (markIdle: boolean) => {
      const s = stateRef.current;
      const now = Date.now();
      let active = s.activeDuration;
      if (!s.isIdle) {
        const elapsed = Math.floor((now - s.lastActivityTime) / 1000);
        active = s.activeDuration + Math.max(0, elapsed);
      }
      writePersistedSeconds(storageKey(config.contentType, config.contentId), active);
      if (markIdle && !s.isIdle) {
        // Marque idle sans toucher aux autres champs.
        setState((prev) => (prev.isIdle ? prev : { ...prev, isIdle: true }));
      }
    },
    [config.contentType, config.contentId],
  );

  const startSession = useCallback(async (mountToken: number) => {
    const s = stateRef.current;
    if (s.sessionId || s.loading) return;
    if (fatalStartErrorRef.current || startLockRef.current) return;

    if (!config.contentType || !config.contentId || config.contentId.trim() === "") {
      console.warn("[useLearningSession] Invalid config, skipping session start:", {
        contentType: config.contentType,
        contentId: config.contentId,
      });
      return;
    }

    // Reuse a previously created sessionId for this tab to prevent POST loops.
    const sidKey = sessionIdKey(config.contentType, config.contentId);
    const existingSessionId = readPersistedSessionId(sidKey);
    if (existingSessionId) {
      sessionIdRef.current = existingSessionId;
      setState((prev) => ({
        ...prev,
        sessionId: existingSessionId,
        loading: false,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
      }));
      return;
    }

    // Hard throttle: never try to start more than once every 10s.
    const now = Date.now();
    if (now - lastStartAttemptAtRef.current < 10_000) return;
    lastStartAttemptAtRef.current = now;

    startLockRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      if (!supabase) {
        console.warn("[useLearningSession] Supabase client indisponible (env manquant ?)");
        if (mountTokenRef.current === mountToken) {
          fatalStartErrorRef.current = true;
          setState((prev) => ({ ...prev, loading: false }));
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/learning-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: config.contentType,
          content_id: config.contentId,
          user_id: user?.id ?? null,
        }),
      });

      if (!response.ok) {
        if (mountTokenRef.current === mountToken) {
          if (!startHttpErrorLoggedRef.current) {
            startHttpErrorLoggedRef.current = true;
            const errorData = await response.json().catch(() => ({}));
            console.error("[useLearningSession] Failed to start session:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });
          }
          fatalStartErrorRef.current = true;
          setState((prev) => ({ ...prev, loading: false }));
        }
        return;
      }

      const data = await response.json();
      const sessionId = data.sessionId as string | undefined;

      if (!sessionId) {
        if (mountTokenRef.current === mountToken) {
          if (!startHttpErrorLoggedRef.current) {
            startHttpErrorLoggedRef.current = true;
            console.warn("[useLearningSession] No sessionId returned from API");
          }
          fatalStartErrorRef.current = true;
          setState((prev) => ({ ...prev, loading: false }));
        }
        return;
      }

      if (mountTokenRef.current !== mountToken) return;

      sessionIdRef.current = sessionId;
      writePersistedSessionId(sidKey, sessionId);
      setState({
        sessionId,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        totalDuration: 0,
        activeDuration: 0,
        isActive: true,
        isIdle: false,
        loading: false,
      });

      recordActivity();
    } catch (error) {
      if (!startHttpErrorLoggedRef.current) {
        startHttpErrorLoggedRef.current = true;
        console.error("[useLearningSession] Error starting session:", error);
      }
      fatalStartErrorRef.current = true;
      setState((prev) => ({ ...prev, loading: false }));
    } finally {
      startLockRef.current = false;
    }
  }, [config.contentType, config.contentId, recordActivity]);

  const updateSession = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sessionId) return;
    const now = Date.now();
    const totalSeconds = Math.floor((now - s.startTime) / 1000);

    setState((prev) => {
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
      // Sync côté serveur désactivée pour l’instant (colonnes non stabilisées en DB).
    } catch (error) {
      console.error("[useLearningSession] Error updating session:", error);
    }
  }, []);

  const endSession = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sessionId) return;

    const now = Date.now();
    const totalSeconds = Math.floor((now - s.startTime) / 1000);

    let finalActiveDuration = s.activeDuration;
    if (!s.isIdle) {
      const elapsed = Math.floor((now - s.lastActivityTime) / 1000);
      finalActiveDuration = s.activeDuration + elapsed;
    }

    try {
      // Sync côté serveur désactivée pour l’instant (pas de ended_at / colonnes fin).
    } catch (error) {
      console.error("[useLearningSession] Error ending session:", error);
    }

    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
  }, []);

  useEffect(() => {
    mountTokenRef.current += 1;
    const mountToken = mountTokenRef.current;

    fatalStartErrorRef.current = false;
    startHttpErrorLoggedRef.current = false;
    startLockRef.current = false;
    sessionIdRef.current = null;

    const persisted = readPersistedSeconds(storageKey(config.contentType, config.contentId));
    setState({
      ...initialState(),
      activeDuration: persisted,
    });

    void startSession(mountToken);

    const handleActivity = () => {
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }

      activityDebounceRef.current = setTimeout(() => {
        recordActivity();
      }, ACTIVITY_DEBOUNCE);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    const handleFocus = () => {
      recordActivity();
    };

    const handleBlur = () => {
      flushAndPersist(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    const handleVisibility = () => {
      if (document.hidden) {
        flushAndPersist(true);
      } else {
        recordActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const handleBeforeUnload = () => {
      flushAndPersist(true);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    syncIntervalRef.current = setInterval(() => {
      updateSession();
    }, SYNC_INTERVAL);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

      // Cleanup: ne pas déclencher de setState en boucle (StrictMode / reruns).
      persistOnly(true);
      void endSession();
    };
  }, [config.contentId, config.contentType, recordActivity, flushAndPersist, persistOnly, startSession, updateSession, endSession]);

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
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    sessionId: state.sessionId,
    totalDuration: state.totalDuration,
    activeDuration: state.activeDuration,
    isActive: state.isActive,
    isIdle: state.isIdle,
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
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
