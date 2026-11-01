"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { toast } from "sonner";
import { BadgeEpreuveCompletion } from "@/components/apprenant/badge-epreuve-completion";
import {
  PassageBriefing,
  PassageDone,
  PassageFrame,
  type PassageStep,
} from "@/components/open-badges/passage/passage-chrome";
import { examMinutes, PassageExamHost } from "@/components/open-badges/passage/passage-host";
import {
  addBusinessDays,
  formatFrenchDate,
  type PassageMeta,
} from "@/components/open-badges/passage/passage-meta";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { getPlaygroundMaxAttempts, methodConfigLabel } from "@/lib/openbadges/badge-method-config";
import { listPlaygroundActivities } from "@/lib/openbadges/playground-activity";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

function shortExamBlurb(method: BadgeMethodConfig, fallback: string) {
  const learner = method.learnerInstruction?.trim() ?? "";
  if (learner && learner.length < 90 && !/expert|au moins/i.test(learner)) return learner;
  if (method.methodId === "qcm") {
    const count = method.quiz?.questionCount || method.quiz?.questions.length || 0;
    const score = method.quiz?.passingScorePercent ?? 80;
    return count ? `${count} questions · seuil ${score} %` : "Questions à choix.";
  }
  if (method.methodId === "case_study") return "Un dossier à lire, une réponse rédigée.";
  if (method.methodId === "video") return "Une prise de parole filmée · 2 prises";
  if (method.methodId === "dictation") return "Une question tirée au hasard, une réponse audio.";
  if (method.methodId === "playground") return "Un échange en situation.";
  return fallback;
}

const DEFAULT_META: PassageMeta = {
  level: 1,
  competencies: [],
  criteria: [],
  attempts: 3,
  retryDelayDays: 7,
  reviewSlaDays: 5,
  accommodations: true,
  integrityCheck: true,
  integrityToleranceSec: 2,
  integrityToleratedLeaves: 1,
  integrityConsequence: "attempt",
};

type EarnerAuth = {
  userId: string;
  orgId: string;
  role: string;
};

type InitialConfig = {
  id: string;
  name: string;
  methodConfigs: BadgeMethodConfig[];
  playgroundAttemptsUsed?: number;
  playgroundMaxAttempts?: number | null;
  mustRestartAssessment?: boolean;
  submittedMethodIds?: string[];
  readyForFinalEvaluation?: boolean;
};

function progressStorageKey(badgeClassId: string, userId: string) {
  return `open-badge-progress:${userId}:${badgeClassId}`;
}

function applyConfigFromApi(
  json: {
    badgeClass: {
      id: string;
      name: string;
      methodConfigs?: BadgeMethodConfig[];
      playgroundAttemptsUsed?: number;
      playgroundMaxAttempts?: number | null;
      submittedMethodIds?: string[];
      readyForFinalEvaluation?: boolean;
    };
  },
  fallbackName?: string,
): InitialConfig | null {
  const methodConfigs = Array.isArray(json.badgeClass?.methodConfigs)
    ? (json.badgeClass.methodConfigs as BadgeMethodConfig[])
    : [];
  if (methodConfigs.length === 0) return null;

  return {
    id: json.badgeClass.id,
    name: json.badgeClass.name ?? fallbackName ?? "",
    methodConfigs,
    playgroundAttemptsUsed: json.badgeClass.playgroundAttemptsUsed ?? 0,
    playgroundMaxAttempts: json.badgeClass.playgroundMaxAttempts ?? null,
    mustRestartAssessment: false,
    submittedMethodIds: json.badgeClass.submittedMethodIds ?? [],
    readyForFinalEvaluation: Boolean(json.badgeClass.readyForFinalEvaluation),
  };
}

export function BadgeSequentialAssessmentFlow({
  badgeClassId,
  presentationHref,
  initialAuth,
  initialConfig,
  preview = false,
  passage,
}: {
  badgeClassId: string;
  presentationHref: string;
  initialAuth?: EarnerAuth | null;
  initialConfig?: InitialConfig | null;
  /** Essai super admin : aucune réponse n'est enregistrée, aucun badge n'est délivré. */
  preview?: boolean;
  passage?: PassageMeta;
}) {
  const [auth, setAuth] = useState<EarnerAuth | null>(initialAuth ?? null);
  const [config, setConfig] = useState<InitialConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [accommodation, setAccommodation] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const restartHandledRef = useRef(false);
  const initialConfigRef = useRef(initialConfig);
  initialConfigRef.current = initialConfig;

  const applyProgress = useCallback((next: InitialConfig, localCompleted: string[]) => {
    const serverSubmitted = (next.submittedMethodIds ?? []).filter((id) =>
      next.methodConfigs.some((m) => m.methodId === id),
    );
    const merged = Array.from(new Set([...localCompleted, ...serverSubmitted]));
    setCompletedIds(merged);
    const firstPending = next.methodConfigs.findIndex((m) => !merged.includes(m.methodId));
    setActiveIndex(firstPending >= 0 ? firstPending : next.methodConfigs.length);
    return merged;
  }, []);

  useEffect(() => {
    if (initialAuth) return;
    const loadAuth = async () => {
      const res = await fetch("/api/dashboard/apprenant/earner-context");
      if (!res.ok) {
        setLoadError("Session apprenant introuvable. Reconnectez-vous.");
        return;
      }
      const json = await res.json();
      setAuth({
        userId: json.userId,
        orgId: json.orgId,
        role: String(json.role ?? "EARNER"),
      });
    };
    void loadAuth();
  }, [initialAuth]);

  useEffect(() => {
    if (!auth) return;

    if (preview && initialConfigRef.current?.methodConfigs?.length) {
      const next = { ...initialConfigRef.current, mustRestartAssessment: false };
      setConfig(next);
      applyProgress(next, []);
      return;
    }

    const load = async () => {
      const headers = {
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      };

      const fetchConfig = () =>
        fetch(`/api/earner/badges/${badgeClassId}/config`, {
          credentials: "include",
          headers,
        });

      let res = await fetchConfig();
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const fallback = initialConfigRef.current;
        if (fallback?.methodConfigs?.length) {
          setConfig({ ...fallback, mustRestartAssessment: false });
          applyProgress({ ...fallback, mustRestartAssessment: false }, []);
          return;
        }
        const code = String(errJson?.error ?? "");
        if (res.status === 403) {
          setLoadError("Session expirée. Reconnectez-vous puis réessayez.");
        } else if (res.status === 404 || code === "NOT_FOUND") {
          setLoadError("Ce badge n'est pas accessible pour votre compte.");
        } else {
          setLoadError("Impossible de charger la configuration de l'épreuve.");
        }
        return;
      }

      let json = await res.json();
      const mustRestart = Boolean(json.badgeClass?.mustRestartAssessment);

      if (mustRestart && !restartHandledRef.current) {
        restartHandledRef.current = true;
        localStorage.removeItem(progressStorageKey(badgeClassId, auth.userId));
        await fetch(`/api/earner/badges/${badgeClassId}/assessment/reset`, {
          method: "POST",
          credentials: "include",
          headers,
        });
        res = await fetchConfig();
        if (!res.ok) {
          setLoadError("Impossible de réinitialiser l'épreuve. Réessayez.");
          return;
        }
        json = await res.json();
      }

      const next = applyConfigFromApi(json, initialConfigRef.current?.name);
      if (!next) {
        setLoadError("Aucune épreuve n'est configurée pour ce badge.");
        return;
      }

      setConfig(next);
      applyProgress(next, []);
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement initial uniquement
  }, [auth, badgeClassId, preview]);

  const markMethodComplete = useCallback(
    (methodId: string) => {
      if (!config) return;
      setCompletedIds((prev) => {
        const nextCompleted = Array.from(new Set([...prev, methodId]));
        const nextIndex = config.methodConfigs.findIndex((m) => !nextCompleted.includes(m.methodId));
        setActiveIndex(nextIndex >= 0 ? nextIndex : config.methodConfigs.length);
        return nextCompleted;
      });
    },
    [config],
  );

  const submitMethod = async (payload: {
    methodId: string;
    responseText: string;
    qcmAnswers?: Record<string, string | string[]>;
    integrityMetrics: ReturnType<
      typeof import("@/lib/openbadges/badge-assessment-integrity").evaluateIntegrityMetrics
    >;
  }) => {
    if (!auth || !config) return;
    if (preview) {
      toast.success(`${methodConfigLabel(payload.methodId as BadgeEvaluationMethodId)} — essai, non enregistré`);
      setStarted(false);
      markMethodComplete(payload.methodId);
      setConfig((c) => {
        if (!c) return c;
        const nextSubmitted = Array.from(new Set([...(c.submittedMethodIds ?? []), payload.methodId]));
        const ready = c.methodConfigs.every((m) => nextSubmitted.includes(m.methodId));
        return { ...c, submittedMethodIds: nextSubmitted, readyForFinalEvaluation: ready };
      });
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/earner/badges/${badgeClassId}/submit`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      },
      body: JSON.stringify({
        methodResponses: [
          {
            methodId: payload.methodId,
            responseText: payload.responseText,
            qcmAnswers: payload.qcmAnswers,
            submittedAt: new Date().toISOString(),
          },
        ],
        integrityMetrics: payload.integrityMetrics,
        evidence: [
          {
            type: "TEXT",
            title: `Réponse — ${payload.methodId}`,
            description: payload.responseText,
          },
        ],
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.error === "PLAYGROUND_ATTEMPTS_EXCEEDED") {
        toast.error("Vous avez utilisé tous vos essais Playground.");
        const pgConfig = config.methodConfigs.find((m) => m.methodId === "playground");
        const maxPg = pgConfig ? getPlaygroundMaxAttempts(pgConfig) : 2;
        setConfig((c) => (c ? { ...c, playgroundAttemptsUsed: maxPg } : c));
      } else {
        toast.error(json?.error ?? "Erreur lors de l'envoi — réessayez.");
      }
      return;
    }

    if (payload.integrityMetrics.integrityFailed) {
      toast.warning("Réponse enregistrée — session signalée (onglet).");
    } else {
      toast.success(`${methodConfigLabel(payload.methodId as BadgeEvaluationMethodId)} terminé`);
    }

    setStarted(false);
    markMethodComplete(payload.methodId);
    setConfig((c) => {
      if (!c) return c;
      const nextSubmitted = Array.from(new Set([...(c.submittedMethodIds ?? []), payload.methodId]));
      const pgConfig = c.methodConfigs.find((m) => m.methodId === "playground");
      const maxPg = pgConfig ? getPlaygroundMaxAttempts(pgConfig) : 2;
      const pgDone =
        !pgConfig || (c.playgroundAttemptsUsed ?? 0) >= maxPg || nextSubmitted.includes("playground");
      const ready = c.methodConfigs.every((m) =>
        m.methodId === "playground" ? pgDone : nextSubmitted.includes(m.methodId),
      );
      return { ...c, submittedMethodIds: nextSubmitted, readyForFinalEvaluation: ready };
    });
  };

  const activeMethod = config?.methodConfigs[activeIndex] ?? null;

  const readyForFinalEvaluation = Boolean(config?.readyForFinalEvaluation);
  const meta = passage ?? DEFAULT_META;

  const steps: PassageStep[] = (config?.methodConfigs ?? []).map((method, index) => {
    const activity = method.methodId === "playground" ? listPlaygroundActivities(method.playground)[0] : null;
    const label =
      activity?.type === "situation"
        ? "Mise en situation"
        : activity?.type === "sandbox"
          ? "Bac à sable"
          : activity?.type === "module"
            ? "Module"
            : methodConfigLabel(method.methodId);
    return {
      id: method.methodId,
      label,
      blurb: shortExamBlurb(method, label),
      minutes: examMinutes(method.methodId),
      done: completedIds.includes(method.methodId),
      current: started && index === activeIndex,
    };
  });

  if (loadError) {
    return (
      <div className={`${manrope.className} flex min-h-screen flex-col items-center justify-center bg-[#0B0C10] px-6 text-center text-[#F2F2F5]`}>
        <p className="text-lg">{loadError}</p>
        <Link href={presentationHref} className="mt-6 text-sm text-[#C9C2FF]">
          Retour
        </Link>
      </div>
    );
  }

  if (!auth || !config) {
    return (
      <div className={`${manrope.className} flex min-h-screen items-center justify-center bg-[#0B0C10] text-sm text-[#8A8FA3]`}>
        Chargement de l&apos;épreuve…
      </div>
    );
  }

  if (config.methodConfigs.length === 0) {
    return (
      <div className={`${manrope.className} mx-auto max-w-lg bg-[#0B0C10] px-6 py-16 text-center text-[#F2F2F5]`}>
        <p>Aucune épreuve configurée pour ce badge.</p>
        <Link href={presentationHref} className="mt-4 inline-block text-sm text-[#C9C2FF]">
          Retour
        </Link>
      </div>
    );
  }

  if (readyForFinalEvaluation) {
    if (preview) {
      return (
        <div className={manrope.className}>
          <PassageDone
            preview
            expertName="notre équipe"
            resultDate={formatFrenchDate(addBusinessDays(new Date(), meta.reviewSlaDays))}
            steps={steps.map((step) => ({ ...step, done: true }))}
            onLeave={() => {
              window.location.href = presentationHref;
            }}
          />
        </div>
      );
    }
    return <BadgeEpreuveCompletion badgeClassId={badgeClassId} badgeName={config.name} auth={auth} />;
  }

  const watched = activeMethod?.methodId === "qcm" || activeMethod?.methodId === "case_study";
  const lockRaw =
    typeof window !== "undefined" && activeMethod
      ? window.localStorage.getItem(`badge-passage-lock:${auth.userId}:${badgeClassId}:${activeMethod.methodId}`)
      : null;
  const lockedUntil = lockRaw ? new Date(lockRaw) : null;
  const locked = Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

  return (
    <div className={manrope.className}>
      <PassageFrame
        badgeName={config.name}
        level={meta.level}
        steps={steps}
        secondsLeft={started ? secondsLeft : null}
        savedLabel="● Enregistré"
        preview={preview}
        integrityQuit={started && watched && meta.integrityConsequence === "attempt"}
        onQuit={() => {
          window.location.href = presentationHref;
        }}
      >
        {!started || !activeMethod ? (
          <PassageBriefing
            steps={steps}
            resume={completedIds.length > 0}
            attempts={meta.attempts}
            retryDelayDays={meta.retryDelayDays}
            reviewMonths={12}
            competencies={meta.competencies}
            criteria={meta.criteria}
            accommodationsOffered={meta.accommodations}
            onStart={(next) => {
              setAccommodation(next);
              setStarted(true);
            }}
          />
        ) : locked && lockedUntil ? (
          <div className="mx-auto max-w-lg px-6 py-20 text-center">
            <h1 className="text-2xl font-semibold">L&apos;épreuve s&apos;est arrêtée</h1>
            <p className="mt-3 text-sm text-[#B4B8C8]">
              Il vous reste {Math.max(0, meta.attempts - 1)} tentative, disponible le {formatFrenchDate(lockedUntil)}.
            </p>
          </div>
        ) : (
          <PassageExamHost
            key={activeMethod.methodId}
            badgeClassId={badgeClassId}
            userId={auth.userId}
            method={activeMethod}
            meta={meta}
            preview={preview}
            accommodation={accommodation}
            seed={`${auth.userId}:${badgeClassId}`}
            onTick={setSecondsLeft}
            onLeave={() => {
              window.location.href = presentationHref;
            }}
            onSubmit={(text, metrics) => {
              void submitMethod({
                methodId: activeMethod.methodId,
                responseText: text,
                integrityMetrics: metrics,
              });
            }}
          />
        )}
      </PassageFrame>
    </div>
  );
}
