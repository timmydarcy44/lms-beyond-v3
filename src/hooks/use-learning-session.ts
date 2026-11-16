"use client";

/**
 * Tracking LMS : une séance par onglet (réutilisée côté API si gap < 30 min),
 * heartbeat 30 s uniquement si onglet visible + interaction < 2 min.
 * Voir `src/lib/lms/lms-metrics.ts` pour la définition des métriques.
 */
import { supabase } from "@/lib/supabase";
import {
  HEARTBEAT_INTERVAL_MS,
  INTERACTION_WINDOW_MS,
} from "@/lib/lms/lms-metrics";
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

const TAB_ID_KEY = "learningSession:tabId";
const SESSION_ID_KEY = "learningSession:openSessionId";

function getTabId(): string {
  try {
    let id = window.sessionStorage.getItem(TAB_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(TAB_ID_KEY, id);
    }
    return id;
  } catch {
    return "tab";
  }
}

function readOpenSessionId(): string | null {
  try {
    const v = window.sessionStorage.getItem(SESSION_ID_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

function writeOpenSessionId(sessionId: string | null) {
  try {
    if (sessionId) window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    else window.sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // ignore
  }
}

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

export function useLearningSession(config: LearningSessionConfig) {
  const [state, setState] = useState<LearningSessionState>(initialState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const lastInteractionRef = useRef(Date.now());
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startLockRef = useRef(false);
  const fatalStartErrorRef = useRef(false);
  const mountTokenRef = useRef(0);
  const lastHeartbeatAtRef = useRef(0);
  const tabIdRef = useRef<string>("tab");

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setState((prev) => ({
      ...prev,
      lastActivityTime: Date.now(),
      isIdle: false,
      isActive: true,
    }));
  }, []);

  const sendHeartbeat = useCallback(async (force = false) => {
    const s = stateRef.current;
    if (!s.sessionId) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const now = Date.now();
    const sinceInteraction = now - lastInteractionRef.current;
    if (sinceInteraction > INTERACTION_WINDOW_MS) {
      setState((prev) => (prev.isIdle ? prev : { ...prev, isIdle: true, isActive: false }));
      return;
    }

    // Un seul envoi par intervalle (évite doublons Strict Mode / multi-listeners)
    if (!force && now - lastHeartbeatAtRef.current < HEARTBEAT_INTERVAL_MS - 500) return;
    lastHeartbeatAtRef.current = now;

    try {
      await fetch("/api/learning-sessions/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify({
          sessionId: s.sessionId,
          tabId: tabIdRef.current,
          content_type: config.contentType,
          content_id: config.contentId,
          interacted_within_ms: sinceInteraction,
        }),
      });
    } catch (error) {
      console.error("[useLearningSession] heartbeat:", error);
    }
  }, [config.contentType, config.contentId]);

  const startSession = useCallback(async (mountToken: number) => {
    if (fatalStartErrorRef.current || startLockRef.current) return;
    if (!config.contentType || !config.contentId?.trim()) return;

    const existing = readOpenSessionId();
    if (existing) {
      stateRef.current = {
        ...stateRef.current,
        sessionId: existing,
        loading: false,
        startTime: stateRef.current.startTime || Date.now(),
      };
      setState((prev) => ({ ...prev, sessionId: existing, loading: false }));
      return;
    }

    startLockRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      if (!supabase) {
        fatalStartErrorRef.current = true;
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/learning-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content_type: config.contentType,
          content_id: config.contentId,
          user_id: user?.id ?? null,
          tab_id: tabIdRef.current,
        }),
      });

      if (mountTokenRef.current !== mountToken) return;

      if (!response.ok) {
        fatalStartErrorRef.current = true;
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const data = (await response.json()) as { sessionId?: string; reused?: boolean };
      if (!data.sessionId) {
        fatalStartErrorRef.current = true;
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      writeOpenSessionId(data.sessionId);
      const next = {
        sessionId: data.sessionId,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        totalDuration: 0,
        activeDuration: 0,
        isActive: true,
        isIdle: false,
        loading: false,
      };
      stateRef.current = next;
      setState(next);
      lastInteractionRef.current = Date.now();
      void sendHeartbeat(true);
    } catch (error) {
      console.error("[useLearningSession] start:", error);
      fatalStartErrorRef.current = true;
      setState((prev) => ({ ...prev, loading: false }));
    } finally {
      startLockRef.current = false;
    }
  }, [config.contentType, config.contentId, sendHeartbeat]);

  const endSession = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sessionId) return;
    try {
      await fetch("/api/learning-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify({
          sessionId: s.sessionId,
          finalize: true,
        }),
      });
    } catch (error) {
      console.error("[useLearningSession] end:", error);
    }
  }, []);

  useEffect(() => {
    mountTokenRef.current += 1;
    const mountToken = mountTokenRef.current;
    fatalStartErrorRef.current = false;
    startLockRef.current = false;
    tabIdRef.current = getTabId();

    setState(initialState());
    void startSession(mountToken);

    const onInteraction = () => markInteraction();
    window.addEventListener("mousemove", onInteraction, { passive: true });
    window.addEventListener("mousedown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("scroll", onInteraction, { passive: true });
    window.addEventListener("touchstart", onInteraction, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        // Arrêt immédiat des heartbeats (l’intervalle ignore aussi document.hidden)
        setState((prev) => ({ ...prev, isIdle: true, isActive: false }));
      } else {
        markInteraction();
        void sendHeartbeat(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Un seul intervalle heartbeat par montage d’onglet
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(() => {
      void sendHeartbeat(false);
    }, HEARTBEAT_INTERVAL_MS);

    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.sessionId) return prev;
        const now = Date.now();
        const totalSeconds = Math.floor((now - prev.startTime) / 1000);
        const idle = now - lastInteractionRef.current > INTERACTION_WINDOW_MS || document.hidden;
        return {
          ...prev,
          totalDuration: totalSeconds,
          isIdle: idle,
          isActive: !idle,
        };
      });
    }, 1000);

    const onBeforeUnload = () => {
      void endSession();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("mousemove", onInteraction);
      window.removeEventListener("mousedown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("scroll", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      // Ne pas clear sessionStorage ici : un refresh doit réutiliser la même séance.
      void endSession();
    };
  }, [config.contentId, config.contentType, startSession, sendHeartbeat, markInteraction, endSession]);

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
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
