"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BadgeIntegrityEvent, BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import { evaluateIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";

type UseBadgeAssessmentIntegrityOptions = {
  badgeClassId: string;
  methodId: string;
  userId?: string;
  enabled?: boolean;
};

const TICK_MS = 1000;

export function useBadgeAssessmentIntegrity({
  badgeClassId,
  methodId,
  userId,
  enabled = true,
}: UseBadgeAssessmentIntegrityOptions) {
  const [metrics, setMetrics] = useState<BadgeIntegrityMetrics>(() =>
    evaluateIntegrityMetrics(null),
  );
  const sessionIdRef = useRef<string | null>(null);
  const writingRef = useRef(0);
  const totalRef = useRef(0);
  const leaveCountRef = useRef(0);
  const tabHiddenCountRef = useRef(0);
  const hadTabHiddenRef = useRef(false);
  const eventsRef = useRef<BadgeIntegrityEvent[]>([]);
  const isWritingRef = useRef(false);
  const hiddenRef = useRef(typeof document !== "undefined" ? document.hidden : false);
  const startedAtRef = useRef<number | null>(null);

  const pushEvent = useCallback((type: BadgeIntegrityEvent["type"]) => {
    eventsRef.current = [
      ...eventsRef.current.slice(-49),
      { type, at: new Date().toISOString() },
    ];
  }, []);

  const syncMetrics = useCallback(() => {
    setMetrics(
      evaluateIntegrityMetrics({
        writingSeconds: writingRef.current,
        totalSeconds: totalRef.current,
        leaveCount: leaveCountRef.current,
        tabHiddenCount: tabHiddenCountRef.current,
        events: eventsRef.current,
        hadTabHidden: hadTabHiddenRef.current,
      }),
    );
  }, []);

  const recordTabHidden = useCallback(() => {
    if (hiddenRef.current) return;
    hiddenRef.current = true;
    hadTabHiddenRef.current = true;
    tabHiddenCountRef.current += 1;
    pushEvent("tab_hidden");
    syncMetrics();
  }, [pushEvent, syncMetrics]);

  const recordTabVisible = useCallback(() => {
    if (!hiddenRef.current) return;
    hiddenRef.current = false;
    pushEvent("tab_visible");
    syncMetrics();
  }, [pushEvent, syncMetrics]);

  const startWriting = useCallback(() => {
    isWritingRef.current = true;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
  }, []);

  const stopWriting = useCallback(() => {
    isWritingRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.hidden) recordTabHidden();
      else recordTabVisible();
    };

    const onBlur = () => {
      leaveCountRef.current += 1;
      pushEvent("page_leave");
      syncMetrics();
    };

    const onFocus = () => {
      pushEvent("page_return");
      syncMetrics();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const tick = window.setInterval(() => {
      totalRef.current += 1;
      if (isWritingRef.current && !hiddenRef.current) {
        writingRef.current += 1;
      }
      syncMetrics();
    }, TICK_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(tick);
    };
  }, [enabled, recordTabHidden, recordTabVisible, pushEvent, syncMetrics]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const startSession = async () => {
      try {
        const res = await fetch("/api/learning-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: "badge_assessment",
            content_id: badgeClassId,
            user_id: userId,
          }),
        });
        const json = await res.json().catch(() => ({}));
        const sid = (json?.sessionId ?? json?.session?.id) as string | undefined;
        if (res.ok && sid) {
          sessionIdRef.current = sid;
        }
      } catch {
        // session optionnelle
      }
    };

    void startSession();

    return () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      void fetch("/api/learning-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          duration_seconds: totalRef.current,
          duration_active_seconds: writingRef.current,
          metadata: {
            badgeClassId,
            methodId,
            leave_count: leaveCountRef.current,
            tab_hidden_count: tabHiddenCountRef.current,
            had_tab_hidden: hadTabHiddenRef.current,
          },
        }),
      });
    };
  }, [badgeClassId, enabled, methodId, userId]);

  const getMetricsSnapshot = useCallback((): BadgeIntegrityMetrics => {
    return evaluateIntegrityMetrics({
      writingSeconds: writingRef.current,
      totalSeconds: totalRef.current,
      leaveCount: leaveCountRef.current,
      tabHiddenCount: tabHiddenCountRef.current,
      events: eventsRef.current,
      hadTabHidden: hadTabHiddenRef.current,
    });
  }, []);

  return {
    metrics,
    startWriting,
    stopWriting,
    getMetricsSnapshot,
    integrityFailed: metrics.integrityFailed,
  };
}
