"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BadgeIntegrityEvent, BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import { evaluateIntegrityMetrics, judgeLeave } from "@/lib/openbadges/badge-assessment-integrity";

type UseBadgeAssessmentIntegrityOptions = {
  badgeClassId: string;
  methodId: string;
  userId?: string;
  enabled?: boolean;
  /** La surveillance ne compte qu'après l'armement, au clic sur Commencer. */
  enforce?: boolean;
  preview?: boolean;
  /** Si faux, la sortie est notée pour l'expert sans arrêter l'épreuve. */
  block?: boolean;
  toleranceMs?: number;
  toleratedLeaves?: number;
};

const TICK_MS = 1000;

export function useBadgeAssessmentIntegrity({
  badgeClassId,
  methodId,
  userId,
  enabled = true,
  enforce = true,
  preview = false,
  block = true,
  toleranceMs = 2000,
  toleratedLeaves = 1,
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
  const hiddenRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const awayAtRef = useRef<number | null>(null);
  const shortLeavesRef = useRef(0);
  const disqualifyingRef = useRef(0);
  const [warning, setWarning] = useState("");
  const [stopped, setStopped] = useState(false);

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
        disqualifyingLeaves: disqualifyingRef.current,
      }),
    );
  }, []);

  const judgeAway = useCallback(() => {
    if (!armedRef.current || awayAtRef.current == null) return;
    if (typeof document !== "undefined" && (document.hidden || !document.hasFocus())) return;
    const durationMs = Date.now() - awayAtRef.current;
    awayAtRef.current = null;
    leaveCountRef.current += 1;
    pushEvent("page_return");
    const verdict = judgeLeave({
      durationMs,
      shortLeavesUsed: shortLeavesRef.current,
      toleranceMs,
      toleratedLeaves,
      enforce,
    });
    if (verdict === "warn") {
      shortLeavesRef.current += 1;
      setWarning("Restez sur cette page");
    } else if (verdict === "stop") {
      disqualifyingRef.current += 1;
      setWarning("");
      if (block) setStopped(true);
      if (preview) setWarning("Essai : cette sortie arrêterait l'épreuve.");
      else if (!block) setWarning("Cette sortie est notée pour l'expert.");
    }
    syncMetrics();
  }, [block, enforce, preview, pushEvent, syncMetrics, toleranceMs, toleratedLeaves]);

  const markAway = useCallback(() => {
    if (!armedRef.current || awayAtRef.current != null) return;
    awayAtRef.current = Date.now();
    hadTabHiddenRef.current = true;
    tabHiddenCountRef.current += 1;
    pushEvent("page_leave");
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
      if (document.hidden) markAway();
      else judgeAway();
    };

    const onBlur = () => {
      markAway();
    };

    const onFocus = () => {
      judgeAway();
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
  }, [enabled, judgeAway, markAway, pushEvent, syncMetrics]);

  const arm = useCallback(() => {
    armedRef.current = true;
    awayAtRef.current = null;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
  }, []);

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
      disqualifyingLeaves: disqualifyingRef.current,
    });
  }, []);

  return {
    metrics,
    startWriting,
    stopWriting,
    getMetricsSnapshot,
    integrityFailed: metrics.integrityFailed,
    warning,
    stopped,
    arm,
  };
}
