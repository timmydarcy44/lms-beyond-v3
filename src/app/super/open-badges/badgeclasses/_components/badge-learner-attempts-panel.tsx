"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PlaygroundAttempt = {
  attemptNumber: number;
  prompt: string;
  aiResponse: string;
  promptQuality?: string;
};

type LearnerAttempt = {
  earnerId: string;
  earnerName: string;
  attemptIndex: number;
  status: "awarded" | "failed" | "in_progress";
  evaluatedAt: string | null;
  awarded: boolean;
  reasoning: string;
  progressionNote: string;
  qcmScore: { correct: number; total: number } | null;
  playgroundPassed: boolean;
  integrityFailed: boolean;
  hasWalletAward: boolean;
  qcm: { answers: Record<string, string | string[]>; responseText: string | null } | null;
  playgroundAttempts: PlaygroundAttempt[];
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: LearnerAttempt["status"]) {
  if (status === "awarded") {
    return (
      <Badge className="border-emerald-600/50 bg-emerald-50 text-emerald-800">Badge obtenu</Badge>
    );
  }
  if (status === "failed") {
    return <Badge className="border-red-600/50 bg-red-50 text-red-800">Non obtenu</Badge>;
  }
  return <Badge variant="outline">En cours</Badge>;
}

function AttemptCard({ attempt }: { attempt: LearnerAttempt }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{attempt.earnerName}</span>
            {statusBadge(attempt.status)}
            {attempt.hasWalletAward ? (
              <Badge variant="outline" className="text-xs">
                Wallet
              </Badge>
            ) : null}
            {attempt.integrityFailed ? (
              <Badge variant="outline" className="border-amber-500 text-amber-800">
                Intégrité
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            Tentative {attempt.attemptIndex} · {formatDate(attempt.evaluatedAt)}
            {attempt.qcmScore ? (
              <>
                {" "}
                · QCM {attempt.qcmScore.correct}/{attempt.qcmScore.total}
              </>
            ) : null}
            {attempt.playgroundAttempts.length > 0 ? (
              <> · Playground {attempt.playgroundAttempts.length} essai(s)</>
            ) : null}
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>

      {open ? (
        <div className="space-y-4 border-t border-slate-200 px-4 py-4">
          {attempt.reasoning ? (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Verdict IA — pourquoi {attempt.awarded ? "le badge est attribué" : "le badge n'est pas attribué"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {attempt.reasoning}
              </p>
            </div>
          ) : attempt.status === "in_progress" ? (
            <p className="text-sm text-slate-600">Session commencée, pas encore évaluée.</p>
          ) : (
            <p className="text-sm text-amber-700">Aucune explication IA enregistrée pour cette tentative.</p>
          )}

          {attempt.progressionNote ? (
            <div className="rounded-md border border-cyan-200 bg-cyan-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">
                Complément d&apos;analyse playground
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-cyan-950">
                {attempt.progressionNote}
              </p>
            </div>
          ) : null}

          {attempt.qcm ? (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Réponses QCM
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-800">
                {Object.entries(attempt.qcm.answers).map(([qId, answer]) => (
                  <li key={qId} className="rounded bg-slate-50 px-2 py-1">
                    <span className="font-mono text-xs text-slate-500">{qId}</span>
                    <span className="ml-2">
                      {Array.isArray(answer) ? answer.join(", ") : answer}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {attempt.playgroundAttempts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Playground — prompts & réponses IA
              </p>
              {attempt.playgroundAttempts.map((pg, pgIndex) => (
                <div
                  key={`pg-${attempt.earnerId}-${attempt.attemptIndex}-${pg.attemptNumber}-${pgIndex}`}
                  className="rounded-md border border-slate-200 bg-white p-4 text-sm"
                >
                  <p className="font-medium text-slate-900">
                    Essai {pg.attemptNumber}
                    {pg.promptQuality === "insufficient" ? (
                      <span className="ml-2 text-xs text-amber-700">(prompt faible)</span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">Prompt apprenant</p>
                  <p className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-2 text-slate-800">
                    {pg.prompt}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-500">Réponse IA simulée</p>
                  <p className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-2 text-slate-800">
                    {pg.aiResponse || "(vide)"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BadgeLearnerAttemptsPanel({
  badgeClassId,
  auth,
  organizationId,
}: {
  badgeClassId: string;
  auth: { userId: string; userRole: "SUPER_ADMIN" };
  organizationId: string;
}) {
  const [attempts, setAttempts] = useState<LearnerAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionOpen, setSectionOpen] = useState(false);

  const load = useCallback(async () => {
    if (!badgeClassId || !organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/badgeclasses/${badgeClassId}/learner-attempts?organizationId=${organizationId}`,
        {
          headers: {
            "x-user-id": auth.userId,
            "x-user-role": auth.userRole,
            "x-org-id": organizationId,
          },
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "FETCH_FAILED");
      }
      setAttempts(json.attempts ?? []);
    } catch {
      toast.error("Impossible de charger les tentatives apprenants");
    } finally {
      setLoading(false);
    }
  }, [auth.userId, auth.userRole, badgeClassId, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => setSectionOpen((v) => !v)}
        >
          {sectionOpen ? (
            <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          )}
          <div className="min-w-0">
            <CardTitle className="text-slate-900">Tentatives apprenants</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Réponses, verdict IA et explication d&apos;obtention ou de refus du badge.
              {!sectionOpen && attempts.length > 0 ? (
                <span className="ml-1 text-slate-600">
                  — {attempts.length} tentative{attempts.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </p>
          </div>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void load();
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Actualiser</span>
        </Button>
      </CardHeader>
      {sectionOpen ? (
        <CardContent className="space-y-3 pt-0">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : attempts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aucune tentative enregistrée pour ce badge.
            </p>
          ) : (
            attempts.map((attempt) => (
              <AttemptCard
                key={`${attempt.earnerId}-${attempt.attemptIndex}-${attempt.evaluatedAt ?? "pending"}`}
                attempt={attempt}
              />
            ))
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
