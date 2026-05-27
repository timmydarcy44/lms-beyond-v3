"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Bot, Check, Loader2, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { getPlaygroundMaxAttempts } from "@/lib/openbadges/badge-method-config";
import { serializePlaygroundAttempt } from "@/lib/openbadges/badge-playground-session";
import type { BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";

type EarnerAuth = {
  userId: string;
  orgId: string;
  role: string;
};

type Phase = "compose" | "reading";

type Props = {
  badgeClassId: string;
  method: BadgeMethodConfig;
  auth: EarnerAuth;
  attemptsUsed: number;
  onAttemptRecorded: (nextUsed: number) => void;
  onAllAttemptsDone: () => void;
  getIntegritySnapshot: () => BadgeIntegrityMetrics;
  integrityProps: {
    startWriting: () => void;
    stopWriting: () => void;
    integrityFailed: boolean;
  };
};

export function BadgePlaygroundPanel({
  badgeClassId,
  method,
  auth,
  attemptsUsed,
  onAttemptRecorded,
  onAllAttemptsDone,
  getIntegritySnapshot,
  integrityProps,
}: Props) {
  const [phase, setPhase] = useState<Phase>("compose");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAiResponse, setLastAiResponse] = useState("");
  const [lastAttemptNumber, setLastAttemptNumber] = useState(0);
  const maxAttempts = getPlaygroundMaxAttempts(method);
  const consigne = method.playground?.learnerPrompt?.trim() ?? method.evaluationPrompt;
  const currentAttempt = attemptsUsed + (phase === "reading" ? 0 : 1);
  const remaining = Math.max(0, maxAttempts - attemptsUsed);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-user-id": auth.userId,
      "x-org-id": auth.orgId,
      "x-user-role": auth.role,
    }),
    [auth],
  );

  const submitAttempt = useCallback(
    async (promptText: string, attemptNumber: number) => {
      if (attemptNumber > maxAttempts) {
        toast.error("Nombre d'essais maximum atteint.");
        return;
      }

      setLoading(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

      try {
        const respondRes = await fetch(
          `/api/earner/badges/${badgeClassId}/playground/respond`,
          {
            method: "POST",
            credentials: "include",
            headers: authHeaders,
            signal: controller.signal,
            body: JSON.stringify({ prompt: promptText, attemptNumber }),
          },
        );

        if (!respondRes.ok) {
          const err = await respondRes.json().catch(() => null);
          if (err?.error === "PLAYGROUND_ATTEMPTS_EXCEEDED") {
            toast.error("Vous avez utilisé tous vos essais Playground.");
          } else {
            toast.error(err?.error ?? "Réponse IA indisponible.");
          }
          return;
        }

        const respondJson = await respondRes.json();
        const aiResponse = String(respondJson.aiResponse ?? "");
        const promptQuality =
          respondJson.promptQuality === "insufficient" ? "insufficient" : "valid";

        const attempt = {
          attemptNumber,
          prompt: promptText,
          aiResponse,
          promptQuality,
          submittedAt: new Date().toISOString(),
        };

        const integrityMetrics = getIntegritySnapshot();
        const submitRes = await fetch(`/api/earner/badges/${badgeClassId}/submit`, {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body: JSON.stringify({
            methodResponses: [
              {
                methodId: "playground",
                responseText: serializePlaygroundAttempt(attempt),
                playgroundAttempt: attempt,
                submittedAt: attempt.submittedAt,
              },
            ],
            integrityMetrics,
            evidence: [
              {
                type: "TEXT",
                title: `Playground — essai ${attemptNumber}`,
                description: promptText,
              },
            ],
          }),
        });

        if (!submitRes.ok) {
          const err = await submitRes.json().catch(() => null);
          if (err?.error === "PLAYGROUND_ATTEMPTS_EXCEEDED") {
            toast.error("Tous vos essais ont été utilisés.");
          } else {
            toast.error("Enregistrement de l'essai impossible.");
          }
          return;
        }

        const submitJson = await submitRes.json();
        const nextUsed = Math.min(
          maxAttempts,
          typeof submitJson.playgroundAttemptsUsed === "number"
            ? submitJson.playgroundAttemptsUsed
            : attemptNumber,
        );

        onAttemptRecorded(nextUsed);
        setLastAiResponse(aiResponse);
        setLastAttemptNumber(attemptNumber);
        setPhase("reading");
        setPrompt("");

        if (integrityMetrics.integrityFailed) {
          toast.warning("Essai enregistré — changement d'onglet signalé.");
        } else {
          toast.success(`Essai ${attemptNumber} enregistré`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          toast.error("La réponse IA met trop de temps. Réessayez.");
        } else {
          toast.error("Erreur réseau. Réessayez.");
        }
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [
      authHeaders,
      badgeClassId,
      getIntegritySnapshot,
      maxAttempts,
      onAttemptRecorded,
    ],
  );

  const handleSend = () => {
    const text = prompt.trim();
    if (!text || loading || attemptsUsed >= maxAttempts) return;
    void submitAttempt(text, attemptsUsed + 1);
  };

  const handleReformulate = () => {
    setLoading(false);
    setPhase("compose");
    setPrompt("");
  };

  const handleFinish = () => {
    onAllAttemptsDone();
  };

  const finishWithCurrentAttempt = useCallback(async () => {
    if (loading || !lastAttemptNumber) return;
    setLoading(true);
    try {
      const integrityMetrics = getIntegritySnapshot();
      const res = await fetch(`/api/earner/badges/${badgeClassId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
        body: JSON.stringify({
          methodResponses: [
            {
              methodId: "playground_done",
              responseText: JSON.stringify({
                done: true,
                attemptNumber: lastAttemptNumber,
                doneAt: new Date().toISOString(),
              }),
              submittedAt: new Date().toISOString(),
            },
          ],
          integrityMetrics,
          evidence: [
            {
              type: "TEXT",
              title: `Playground — terminé à l'essai ${lastAttemptNumber}`,
              description: "Terminé par l'apprenant.",
            },
          ],
        }),
      });

      if (!res.ok) {
        toast.error("Impossible de terminer le playground. Réessayez.");
        return;
      }

      onAllAttemptsDone();
    } finally {
      setLoading(false);
    }
  }, [
    badgeClassId,
    authHeaders,
    getIntegritySnapshot,
    lastAttemptNumber,
    loading,
    onAllAttemptsDone,
  ]);

  const canComposeAnotherAttempt =
    attemptsUsed < maxAttempts && (lastAttemptNumber === 0 || lastAttemptNumber < maxAttempts);

  if (attemptsUsed >= maxAttempts && phase !== "reading" && !canComposeAnotherAttempt) {
    return (
      <div className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 text-center">
        <p className="text-sm text-white/70">Les {maxAttempts} essais sont terminés.</p>
        <Button type="button" onClick={handleFinish} className="mt-4 bg-[#FF3B30] hover:bg-[#e6352b]">
          Évaluer ma session et voir le résultat
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Playground EDGE</p>
            <p className="text-[11px] text-white/50">Prompt → réponse IA → reformulation</p>
          </div>
        </div>
        <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
          Essai {Math.min(lastAttemptNumber || currentAttempt, maxAttempts)}/{maxAttempts}
        </Badge>
      </div>

      <div className="border-b border-white/10 bg-cyan-950/40 px-4 py-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-400/90">Consigne</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{consigne}</p>
      </div>

      <div className="p-4 space-y-4">
        {phase === "compose" ? (
          <>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-medium text-white/60">
                <User className="h-3.5 w-3.5" />
                Votre prompt — essai {attemptsUsed + 1}
              </p>
              <Textarea
                value={prompt}
                onFocus={integrityProps.startWriting}
                onBlur={integrityProps.stopWriting}
                onChange={(e) => {
                  integrityProps.startWriting();
                  setPrompt(e.target.value);
                }}
                rows={8}
                placeholder="Rédigez votre prompt comme dans un assistant IA…"
                className="min-h-[180px] resize-y border-white/10 bg-black/40 text-white placeholder:text-white/30 focus-visible:ring-cyan-500/50"
                disabled={loading}
              />
            </div>
            {integrityProps.integrityFailed ? (
              <p className="text-xs text-amber-300">
                Changement d&apos;onglet détecté — signalé à l&apos;évaluateur.
              </p>
            ) : null}
            <Button
              onClick={handleSend}
              disabled={loading || !prompt.trim() || !canComposeAnotherAttempt}
              className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer à l&apos;IA
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-400/90">
                <Bot className="h-4 w-4" />
                Réponse IA — essai {lastAttemptNumber}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                {lastAiResponse}
              </p>
            </div>

            {lastAttemptNumber < maxAttempts ? (
              <div className="space-y-2">
                <p className="text-sm text-white/65">
                  Lisez le résultat, puis reformulez votre prompt pour l&apos;essai{" "}
                  {lastAttemptNumber + 1}.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={finishWithCurrentAttempt}
                    disabled={loading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Valider cet essai {lastAttemptNumber} et terminer
                  </Button>
                <Button
                  type="button"
                  onClick={handleReformulate}
                  className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500"
                >
                  Reformuler pour l&apos;essai {lastAttemptNumber + 1}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-200/90">
                  Fin des essais. L&apos;évaluateur IA analysera vos prompts et les réponses
                  obtenues.
                </p>
                <Button
                  type="button"
                  onClick={handleFinish}
                  className="w-full bg-[#FF3B30] hover:bg-[#e6352b] text-white"
                >
                  Voir mon résultat
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
