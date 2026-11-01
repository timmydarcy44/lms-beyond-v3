"use client";

import { useEffect, useState } from "react";
import { openQuestionOf, type BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { useBadgeAssessmentIntegrity } from "@/hooks/use-badge-assessment-integrity";
import type { BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import { PassageCase } from "@/components/open-badges/passage/passage-case";
import { PassageOral, PassageVideo } from "@/components/open-badges/passage/passage-media";
import { PassageQuiz } from "@/components/open-badges/passage/passage-quiz";
import { PassageSituation } from "@/components/open-badges/passage/passage-situation";
import { PassageStopped } from "@/components/open-badges/passage/passage-chrome";
import { addBusinessDays, formatFrenchDate, type PassageMeta } from "@/components/open-badges/passage/passage-meta";

const MINUTES: Record<string, number> = {
  qcm: 20,
  case_study: 45,
  playground: 20,
  video: 10,
  dictation: 5,
  pdf_upload: 15,
};

export function examMinutes(methodId: string) {
  return MINUTES[methodId] ?? 15;
}

export function PassageExamHost({
  badgeClassId,
  userId,
  method,
  meta,
  preview,
  accommodation,
  seed,
  onSubmit,
  onLeave,
  onTick,
}: {
  badgeClassId: string;
  userId: string;
  method: BadgeMethodConfig;
  meta: PassageMeta;
  preview: boolean;
  accommodation: boolean;
  seed: string;
  onSubmit: (text: string, metrics: BadgeIntegrityMetrics) => void;
  onLeave: () => void;
  onTick?: (secondsLeft: number) => void;
}) {
  const watched = method.methodId === "qcm" || method.methodId === "case_study";
  const integrity = useBadgeAssessmentIntegrity({
    badgeClassId,
    methodId: method.methodId,
    userId,
    enabled: true,
    enforce: watched && meta.integrityCheck,
    preview,
    block: meta.integrityConsequence === "attempt",
    toleranceMs: meta.integrityToleranceSec * 1000,
    toleratedLeaves: meta.integrityToleratedLeaves,
  });
  const total = Math.round(examMinutes(method.methodId) * 60 * (accommodation ? 4 / 3 : 1));
  const [left, setLeft] = useState(total);
  const [dismissedStop, setDismissedStop] = useState(false);

  useEffect(() => {
    integrity.arm();
  }, [integrity.arm]);

  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    onTick?.(left);
  }, [left, onTick]);

  const retry = addBusinessDays(new Date(), meta.retryDelayDays);
  useEffect(() => {
    if (!integrity.stopped || preview) return;
    window.localStorage.setItem(
      `badge-passage-lock:${userId}:${badgeClassId}:${method.methodId}`,
      retry.toISOString(),
    );
  }, [badgeClassId, integrity.stopped, meta.retryDelayDays, method.methodId, preview, userId]);

  if (integrity.stopped && !(preview && dismissedStop)) {
    return (
      <PassageStopped
        attemptsLeft={Math.max(0, meta.attempts - 1)}
        retryDate={formatFrenchDate(retry)}
        onLeave={onLeave}
        onContinue={preview ? () => setDismissedStop(true) : undefined}
      />
    );
  }

  const send = (text: string) => onSubmit(text, integrity.getMetricsSnapshot());
  const prompt = openQuestionOf(method);

  if (method.methodId === "qcm") {
    return <PassageQuiz method={method} seed={seed} secondsLeft={left} warning={integrity.warning} onSubmit={send} />;
  }
  if (method.methodId === "case_study") {
    return <PassageCase method={method} warning={integrity.warning} secondsLeft={left} onSubmit={send} />;
  }
  if (method.methodId === "playground") {
    return <PassageSituation method={method} onSubmit={send} />;
  }
  if (method.methodId === "video") {
    return (
      <PassageVideo
        prompt={prompt}
        preview={preview}
        uploadUrl={`/api/earner/badges/${badgeClassId}/media`}
        onSubmit={send}
      />
    );
  }
  if (method.methodId === "dictation") {
    return (
      <PassageOral
        prompt={prompt}
        preview={preview}
        uploadUrl={`/api/earner/badges/${badgeClassId}/media`}
        onSubmit={send}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <p className="text-sm text-[#B4B8C8]">{prompt || "Déposez votre document."}</p>
      <textarea
        className="mt-4 w-full rounded-2xl border border-[#1E2130] bg-[#15171E] p-3 text-sm"
        rows={8}
        placeholder="Lien ou texte du document"
        onBlur={(event) => {
          if (event.target.value.trim()) send(event.target.value);
        }}
      />
    </div>
  );
}
