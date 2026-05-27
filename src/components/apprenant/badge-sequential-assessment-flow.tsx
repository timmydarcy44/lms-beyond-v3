"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { BadgeMethodResponsePanel } from "@/components/open-badges/badge-method-response-panel";
import { BadgeEpreuveCompletion } from "@/components/apprenant/badge-epreuve-completion";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { getPlaygroundMaxAttempts, methodConfigLabel } from "@/lib/openbadges/badge-method-config";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";

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
}: {
  badgeClassId: string;
  presentationHref: string;
  initialAuth?: EarnerAuth | null;
  initialConfig?: InitialConfig | null;
}) {
  const [auth, setAuth] = useState<EarnerAuth | null>(initialAuth ?? null);
  const [config, setConfig] = useState<InitialConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  }, [auth, badgeClassId]);

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

  const handlePlaygroundAttemptRecorded = useCallback((nextUsed: number) => {
    setConfig((c) => (c ? { ...c, playgroundAttemptsUsed: nextUsed } : c));
  }, []);

  const completePlayground = useCallback(() => {
    if (!config) return;
    setCompletedIds((prev) => {
      const nextCompleted = Array.from(new Set([...prev, "playground"]));
      const nextIndex = config.methodConfigs.findIndex((m) => !nextCompleted.includes(m.methodId));
      setActiveIndex(nextIndex >= 0 ? nextIndex : config.methodConfigs.length);
      setConfig((c) => {
        if (!c) return c;
        const nextSubmitted = Array.from(new Set([...(c.submittedMethodIds ?? []), "playground"]));
        const ready = c.methodConfigs.every((m) => nextSubmitted.includes(m.methodId));
        return {
          ...c,
          submittedMethodIds: nextSubmitted,
          readyForFinalEvaluation: ready,
        };
      });
      return nextCompleted;
    });
  }, [config]);

  const submitMethod = async (payload: {
    methodId: string;
    responseText: string;
    qcmAnswers?: Record<string, string | string[]>;
    integrityMetrics: ReturnType<
      typeof import("@/lib/openbadges/badge-assessment-integrity").evaluateIntegrityMetrics
    >;
  }) => {
    if (!auth || !config) return;
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

    if (payload.methodId === "playground") {
      return;
    }

    if (payload.integrityMetrics.integrityFailed) {
      toast.warning("Réponse enregistrée — session signalée (onglet).");
    } else {
      toast.success(`${methodConfigLabel(payload.methodId as BadgeEvaluationMethodId)} terminé`);
    }

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
  const total = config?.methodConfigs.length ?? 0;

  const pendingMethods = useMemo(
    () => config?.methodConfigs.filter((m) => !completedIds.includes(m.methodId)) ?? [],
    [config, completedIds],
  );

  const readyForFinalEvaluation = Boolean(config?.readyForFinalEvaluation);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030303] px-6 text-center text-white">
        <p className="text-lg">{loadError}</p>
        <Link href={presentationHref} className="mt-6 text-[#FF3B30] hover:underline">
          Retour à la présentation
        </Link>
      </div>
    );
  }

  if (!auth || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] text-sm text-white/50">
        Chargement de l&apos;épreuve…
      </div>
    );
  }

  if (config.methodConfigs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center text-white">
        <p>Aucune épreuve configurée pour ce badge.</p>
        <Link href={presentationHref} className="mt-4 inline-block text-[#FF3B30] hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  if (readyForFinalEvaluation) {
    return (
      <BadgeEpreuveCompletion badgeClassId={badgeClassId} badgeName={config.name} auth={auth} />
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] pb-20 text-white">
      <div
        className={`mx-auto px-5 pt-8 sm:px-8 ${
          activeMethod?.methodId === "case_study" ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        <Link
          href={presentationHref}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Présentation du badge
        </Link>

        <header className="mt-8 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#FF3B30]/90">
            Épreuve {completedIds.length + 1} sur {total}
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">{config.name}</h1>
          <p className="text-sm text-white/60">
            Mode en cours : {methodConfigLabel(activeMethod!.methodId)}
            {pendingMethods.length > 1
              ? ` — encore ${pendingMethods.length - 1} épreuve(s) après celle-ci`
              : null}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {config.methodConfigs.map((method) => {
              const done = completedIds.includes(method.methodId);
              const isCurrent = method.methodId === activeMethod?.methodId;
              return (
                <span
                  key={method.methodId}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isCurrent
                        ? "bg-[#FF3B30]/20 text-[#FF3B30]"
                        : "bg-white/8 text-white/40"
                  }`}
                >
                  {methodConfigLabel(method.methodId)}
                  {done ? " ✓" : ""}
                </span>
              );
            })}
          </div>
        </header>

        <div className="mt-10">
          {activeMethod ? (
            <BadgeMethodResponsePanel
              key={activeMethod.methodId}
              badgeClassId={badgeClassId}
              method={activeMethod}
              userId={auth.userId}
              earnerAuth={auth}
              playgroundAttemptsUsed={
                activeMethod.methodId === "playground" ? config.playgroundAttemptsUsed ?? 0 : 0
              }
              onPlaygroundAttemptRecorded={
                activeMethod.methodId === "playground" ? handlePlaygroundAttemptRecorded : undefined
              }
              onPlaygroundComplete={
                activeMethod.methodId === "playground" ? completePlayground : undefined
              }
              loading={loading}
              onSubmit={submitMethod}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
