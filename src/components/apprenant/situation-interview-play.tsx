"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SituationPublic } from "@/lib/interview/situation-schema";
import { cn } from "@/lib/utils";

type DisplayMessage = { role: "user" | "assistant"; content: string };
type Result = {
  score: number;
  criteria: Record<string, number>;
  endingTitle: string;
  passed: boolean;
  feedback: string;
  criteriaMeta?: SituationPublic["criteria"];
};

type SessionPayload = {
  id: string;
  status: string;
  messages?: DisplayMessage[];
  user_turn_count?: number;
  score?: number | null;
  criteria?: Record<string, number> | null;
  ending?: string | null;
  passed?: boolean | null;
  feedback_md?: string | null;
};

export function SituationInterviewPlay({
  courseId,
  lessonId,
  returnHref,
  scenario,
  theme = "edge",
}: {
  courseId: string;
  lessonId: string;
  returnHref: string;
  scenario: SituationPublic;
  theme?: "edge" | "jessica";
}) {
  const light = theme === "jessica";
  const [phase, setPhase] = useState<"loading" | "intro" | "chat" | "result">("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [turns, setTurns] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [shownScore, setShownScore] = useState(0);

  const canFinish = turns >= scenario.minTurns;

  useEffect(() => {
    let ignore = false;
    void fetch(`/api/ai/experiential-interview/situation/resume?lessonId=${encodeURIComponent(lessonId)}`)
      .then((response) => response.json())
      .then((data: { session?: SessionPayload | null }) => {
        if (ignore) return;
        const session = data.session;
        if (!session) {
          setPhase("intro");
          return;
        }
        setSessionId(session.id);
        setMessages(session.messages ?? []);
        setTurns(session.user_turn_count ?? 0);
        if (session.status === "completed") {
          setResult(resultFromSession(session, scenario));
          setPhase("result");
          return;
        }
        if (session.status === "evaluation_pending") {
          setPending(true);
          setPhase("result");
          return;
        }
        setPhase("chat");
      })
      .catch(() => {
        if (!ignore) setPhase("intro");
      });
    return () => {
      ignore = true;
    };
  }, [lessonId, scenario]);

  useEffect(() => {
    if (!result) return;
    const target = result.score;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 900);
      setShownScore(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  const characterLabel = scenario.character.name;

  const begin = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/experiential-interview/situation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de commencer");
      const session = data.session as SessionPayload;
      setSessionId(session.id);
      setMessages(session.messages ?? []);
      setTurns(session.user_turn_count ?? 0);
      setPhase("chat");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || !sessionId || writing) return;
    setDraft("");
    setWriting(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await fetch("/api/ai/experiential-interview/situation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, courseId, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Message refusé");
      setMessages((current) => [...current, { role: "assistant", content: String(data.reply ?? "") }]);
      setTurns(Number(data.turns ?? turns + 1));
      if (data.closed) void finish(sessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setWriting(false);
    }
  };

  const finish = async (id = sessionId) => {
    if (!id) return;
    setPhase("result");
    setBusy(true);
    setPending(false);
    setError(null);
    try {
      const response = await fetch("/api/ai/experiential-interview/situation/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Évaluation impossible");
      if (data.pending) {
        setPending(true);
        return;
      }
      setResult(data.result as Result);
    } catch (cause) {
      setPending(true);
      setError(cause instanceof Error ? cause.message : "Évaluation en attente");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/experiential-interview/situation/retry-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (data.pending) {
        setPending(true);
        setError("L'évaluation n'a pas abouti. La transcription est conservée.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Évaluation impossible");
      setPending(false);
      setResult(data.result as Result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const bars = useMemo(() => scenario.criteria, [scenario.criteria]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className={cn("flex min-h-dvh items-center justify-center px-4 py-10", light ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050208] text-white")}>
        <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white p-8 text-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {scenario.character.initials}
            </div>
            <div>
              <p className="text-lg font-bold">{scenario.character.name}</p>
              <p className="text-sm text-slate-500">{scenario.character.role}</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700">
            <ReactMarkdown>{scenario.learnerBrief}</ReactMarkdown>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <Button type="button" disabled={busy} onClick={() => void begin()} className="rounded-full bg-slate-900 text-white">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Commencer
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="situation-result min-h-dvh bg-white px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-2xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Résultat</p>
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Évaluation en cours…
            </p>
          ) : null}
          {pending ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p>Évaluation en attente. Votre transcription est conservée.</p>
              <Button type="button" onClick={() => void retry()} className="rounded-full">
                Relancer l&apos;évaluation
              </Button>
            </div>
          ) : null}
          {result ? (
            <>
              <div className="text-center">
                <p className="text-6xl font-black tabular-nums">{shownScore}</p>
                <p className="mt-1 text-lg font-semibold">{result.endingTitle}</p>
              </div>
              <div className="space-y-3">
                {(result.criteriaMeta ?? bars).map((criterion) => {
                  const value = result.criteria[criterion.id] ?? 0;
                  return (
                    <div key={criterion.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{criterion.label}</span>
                        <span className="tabular-nums">
                          {value} / {criterion.max}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (value / criterion.max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{result.feedback}</ReactMarkdown>
              </div>
            </>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" onClick={() => window.print()} className="rounded-full">
              Télécharger en PDF
            </Button>
            <Button
              type="button"
              onClick={() => {
                setResult(null);
                setPending(false);
                setSessionId(null);
                setMessages([]);
                setTurns(0);
                setPhase("intro");
              }}
              className="rounded-full"
            >
              Recommencer
            </Button>
            <Button type="button" variant="ghost" onClick={() => (window.location.href = returnHref)}>
              Continuer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-dvh flex-col", light ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050208] text-white")}>
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{characterLabel}</p>
          <p className="text-xs opacity-60">
            {turns} / {scenario.maxTurns}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setBriefOpen((open) => !open)} className="rounded-full text-xs">
            Revoir la consigne
          </Button>
          <Button type="button" disabled={!canFinish || busy} onClick={() => void finish()} className="rounded-full text-xs">
            Terminer l&apos;entretien
          </Button>
        </div>
      </header>
      {briefOpen ? (
        <div className="max-h-48 overflow-y-auto border-b border-white/10 bg-white px-4 py-3 text-sm text-slate-800">
          <ReactMarkdown>{scenario.learnerBrief}</ReactMarkdown>
        </div>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", message.role === "user" ? "ml-auto bg-violet-600 text-white" : "bg-white text-slate-900")}>
            {message.content}
          </div>
        ))}
        {writing ? <p className="text-sm opacity-70">{characterLabel} est en train d&apos;écrire…</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
      <form
        className="flex gap-2 border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Textarea
          value={draft}
          maxLength={800}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Votre message"
          className="bg-white text-slate-900"
        />
        <Button type="submit" disabled={writing || !draft.trim()} className="rounded-full">
          Envoyer
        </Button>
      </form>
    </div>
  );
}

function resultFromSession(session: SessionPayload, scenario: SituationPublic): Result {
  const ending = scenario.endings.find((item) => item.id === session.ending);
  return {
    score: Number(session.score ?? 0),
    criteria: session.criteria ?? {},
    endingTitle: ending?.title ?? String(session.ending ?? ""),
    passed: Boolean(session.passed),
    feedback: String(session.feedback_md ?? ""),
    criteriaMeta: scenario.criteria,
  };
}
