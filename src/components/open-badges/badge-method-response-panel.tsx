"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBadgeAssessmentIntegrity } from "@/hooks/use-badge-assessment-integrity";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { methodConfigLabel } from "@/lib/openbadges/badge-method-config";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { BadgePlaygroundPanel } from "@/components/open-badges/badge-playground-panel";
import { BadgeCaseStudyPanel } from "@/components/open-badges/badge-case-study-panel";
import { BadgeEvaluationQuizFlow } from "@/components/open-badges/badge-evaluation-quiz-flow";

type EarnerAuth = {
  userId: string;
  orgId: string;
  role: string;
};

type Props = {
  badgeClassId: string;
  method: BadgeMethodConfig;
  userId?: string;
  earnerAuth?: EarnerAuth | null;
  playgroundAttemptsUsed?: number;
  onPlaygroundAttemptRecorded?: (nextUsed: number) => void;
  onSubmit: (payload: {
    methodId: BadgeEvaluationMethodId;
    responseText: string;
    qcmAnswers?: Record<string, string | string[]>;
    integrityMetrics: ReturnType<
      ReturnType<typeof useBadgeAssessmentIntegrity>["getMetricsSnapshot"]
    >;
  }) => void | Promise<void>;
  onPlaygroundComplete?: () => void;
  loading?: boolean;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} s`;
}

export function BadgeMethodResponsePanel({
  badgeClassId,
  method,
  userId,
  playgroundAttemptsUsed = 0,
  earnerAuth,
  onPlaygroundAttemptRecorded,
  onSubmit,
  onPlaygroundComplete,
  loading,
}: Props) {
  const [responseText, setResponseText] = useState("");

  const { metrics, startWriting, stopWriting, getMetricsSnapshot, integrityFailed } =
    useBadgeAssessmentIntegrity({
      badgeClassId,
      methodId: method.methodId,
      userId,
      enabled: Boolean(userId),
    });

  useEffect(() => {
    if (integrityFailed) stopWriting();
  }, [integrityFailed, stopWriting]);

  const handleSubmit = () => {
    onSubmit({
      methodId: method.methodId,
      responseText,
      integrityMetrics: getMetricsSnapshot(),
    });
  };

  if (method.methodId === "case_study") {
    return (
      <BadgeCaseStudyPanel
        method={method}
        loading={loading}
        integrityProps={{
          startWriting,
          stopWriting,
          integrityFailed,
        }}
        onSubmit={(responseHtml) => {
          onSubmit({
            methodId: "case_study",
            responseText: responseHtml,
            integrityMetrics: getMetricsSnapshot(),
          });
        }}
      />
    );
  }

  if (method.methodId === "playground") {
    if (!earnerAuth) {
      return (
        <p className="text-sm text-amber-200">Session apprenant requise pour le Playground.</p>
      );
    }
    return (
      <BadgePlaygroundPanel
        badgeClassId={badgeClassId}
        method={method}
        auth={earnerAuth}
        attemptsUsed={playgroundAttemptsUsed}
        onAttemptRecorded={(nextUsed) => onPlaygroundAttemptRecorded?.(nextUsed)}
        onAllAttemptsDone={() => onPlaygroundComplete?.()}
        getIntegritySnapshot={getMetricsSnapshot}
        integrityProps={{
          startWriting,
          stopWriting,
          integrityFailed,
        }}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{methodConfigLabel(method.methodId)}</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1 border-white/20 text-white/80">
            <Clock className="h-3 w-3" />
            Rédaction : {formatDuration(metrics.writingSeconds)}
          </Badge>
          <Badge variant="outline" className="border-white/20 text-white/70">
            Sorties : {metrics.leaveCount}
          </Badge>
          <Badge variant="outline" className="border-white/20 text-white/70">
            Onglets : {metrics.tabHiddenCount}
          </Badge>
        </div>
      </div>

      {integrityFailed ? (
        <div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Session non conforme</p>
            <p className="mt-1 text-amber-100/90">
              Vous avez quitté l’onglet ou la page pendant la rédaction. Le badge ne pourra pas être
              validé automatiquement (risque de consultation externe signalé à l’évaluateur et à l’IA).
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/50">
          Restez sur cet onglet pendant votre rédaction. Tout changement d’onglet est enregistré.
        </p>
      )}

      {method.methodId === "qcm" && method.quiz?.questions?.length ? (
        <BadgeEvaluationQuizFlow
          method={method}
          loading={loading}
          onStartWriting={startWriting}
          onSubmit={({ responseText, qcmAnswers }) =>
            onSubmit({
              methodId: method.methodId,
              responseText,
              qcmAnswers,
              integrityMetrics: getMetricsSnapshot(),
            })
          }
        />
      ) : method.methodId === "qcm" ? (
        <p className="text-sm text-white/50">Questions d&apos;évaluation non configurées.</p>
      ) : (
        <div className="space-y-2">
          <Label className="text-white/90">Votre réponse</Label>
          <Textarea
            value={responseText}
            onFocus={startWriting}
            onBlur={stopWriting}
            onChange={(e) => {
              startWriting();
              setResponseText(e.target.value);
            }}
            rows={8}
            className="border-white/15 bg-black/30 text-white"
            placeholder="Rédigez votre réponse ici…"
          />
        </div>
      )}

      {method.methodId !== "qcm" ? (
        <Button
          onClick={handleSubmit}
          disabled={loading || !responseText.trim()}
          className="w-full sm:w-auto"
        >
          Soumettre cette épreuve
        </Button>
      ) : null}
    </div>
  );
}
