"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeMethodResponsePanel } from "@/components/open-badges/badge-method-response-panel";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { parseMethodConfigs } from "@/lib/openbadges/badge-method-config";
import OpenBadgeSubmitView from "./view";

type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
} | null;

type BadgeConfig = {
  id: string;
  name: string;
  methodConfigs: BadgeMethodConfig[];
  playgroundAttemptsUsed?: number;
  playgroundMaxAttempts?: number | null;
};

export function BadgeSubmitClient({
  auth,
  badgeClassId,
}: {
  auth: AuthContext;
  badgeClassId: string;
}) {
  const [config, setConfig] = useState<BadgeConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const load = async () => {
      const res = await fetch(`/api/earner/badges/${badgeClassId}/config`, {
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
          "x-user-role": auth.role,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      const methodConfigs = parseMethodConfigs(json.badgeClass?.methodConfigs);
      if (methodConfigs.length > 0) {
        setConfig({
          id: json.badgeClass.id,
          name: json.badgeClass.name,
          methodConfigs,
          playgroundAttemptsUsed: json.badgeClass.playgroundAttemptsUsed ?? 0,
          playgroundMaxAttempts: json.badgeClass.playgroundMaxAttempts ?? null,
        });
      }
    };
    void load();
  }, [auth, badgeClassId]);

  const submitMethod = async (payload: {
    methodId: string;
    responseText: string;
    qcmAnswers?: Record<string, string>;
    integrityMetrics: ReturnType<
      typeof import("@/lib/openbadges/badge-assessment-integrity").evaluateIntegrityMetrics
    >;
  }) => {
    if (!auth) return;
    setLoading(true);
    const res = await fetch(`/api/earner/badges/${badgeClassId}/submit`, {
      method: "POST",
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
        setConfig((c) =>
          c
            ? {
                ...c,
                playgroundAttemptsUsed: c.playgroundMaxAttempts ?? 2,
              }
            : c,
        );
      } else {
        toast.error(json?.error ?? "Erreur lors de l’envoi.");
      }
      return;
    }
    setConfig((c) =>
      c && payload.methodId === "playground"
        ? { ...c, playgroundAttemptsUsed: (c.playgroundAttemptsUsed ?? 0) + 1 }
        : c,
    );
    if (payload.integrityMetrics.integrityFailed) {
      toast.warning(
        "Réponse enregistrée, mais votre session a été signalée (changement d’onglet détecté).",
      );
    } else {
      toast.success("Réponse enregistrée.");
    }
  };

  if (!auth) {
    return <OpenBadgeSubmitView auth={auth} badgeClassId={badgeClassId} />;
  }

  if (!config) {
    return <OpenBadgeSubmitView auth={auth} badgeClassId={badgeClassId} />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Open Badges</p>
        <h1 className="text-pretty text-3xl font-semibold sm:text-4xl">{config.name}</h1>
        <p className="text-sm text-white/70">
          Complétez chaque épreuve ci-dessous. Votre temps de rédaction et vos changements d’onglet
          sont suivis.
        </p>
      </div>
      {config.methodConfigs.map((method) => (
        <BadgeMethodResponsePanel
          key={method.methodId}
          badgeClassId={badgeClassId}
          method={method}
          userId={auth.userId}
          playgroundAttemptsUsed={
            method.methodId === "playground" ? config.playgroundAttemptsUsed ?? 0 : 0
          }
          loading={loading}
          onSubmit={submitMethod}
        />
      ))}
    </div>
  );
}
