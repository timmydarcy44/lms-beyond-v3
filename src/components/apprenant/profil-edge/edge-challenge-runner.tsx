"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Award, Loader2, Send, Sparkles, Trophy, Zap } from "lucide-react";
import { EDGE_CHALLENGE_FORMATS } from "@/lib/apprenant/edge-challenges";
import type {
  ChallengeChatMessage,
  ChallengeFinishResult,
  ChallengeFormatId,
} from "@/lib/apprenant/edge-challenge-types";
import {
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

type Phase = "intro" | "chat" | "finishing" | "debrief";

const VALID_FORMATS = EDGE_CHALLENGE_FORMATS.map((f) => f.id) as ChallengeFormatId[];

function formatMeta(id: ChallengeFormatId) {
  return EDGE_CHALLENGE_FORMATS.find((f) => f.id === id) ?? EDGE_CHALLENGE_FORMATS[0];
}

export function EdgeChallengeRunner() {
  const params = useSearchParams();
  const skill = params.get("skill")?.trim() || "votre compétence";
  const objective = params.get("objective")?.trim() || "";
  const levelCurrent = params.get("level")?.trim() || "";
  const levelExpected = params.get("target")?.trim() || "";
  const paramFormat = params.get("format") as ChallengeFormatId | null;

  const [format, setFormat] = useState<ChallengeFormatId>(
    paramFormat && VALID_FORMATS.includes(paramFormat) ? paramFormat : "ai",
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [runId, setRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChallengeChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [proofText, setProofText] = useState("");
  const [sending, setSending] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const [result, setResult] = useState<ChallengeFinishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contextBody = useCallback(
    () => ({ skill, objective, levelCurrent, levelExpected, format }),
    [skill, objective, levelCurrent, levelExpected, format],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const start = useCallback(async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/learner/edge-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", ...contextBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setRunId(json.runId);
      setMessages([{ role: "assistant", content: json.reply }]);
      setPhase("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de lancer le défi.");
    } finally {
      setSending(false);
    }
  }, [contextBody]);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;
    const nextMessages: ChallengeChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/learner/edge-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", messages: nextMessages, ...contextBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      setCanFinish(Boolean(json.canFinish));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de communication avec le coach.");
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, contextBody]);

  const finish = useCallback(async () => {
    setPhase("finishing");
    setError(null);
    try {
      const res = await fetch("/api/learner/edge-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", runId, messages, proofText, ...contextBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setResult(json as ChallengeFinishResult);
      setPhase("debrief");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de finaliser le défi.");
      setPhase("chat");
    }
  }, [runId, messages, proofText, contextBody]);

  const meta = formatMeta(format);

  /* ------------------------------- Intro -------------------------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink />
        <section className="rounded-2xl border border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/[0.12] to-transparent p-6">
          <p className={APPRENANT_CARD_KICKER}>Défi EDGE</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{skill}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Un entretien interactif avec votre coach IA. Répondez naturellement : à la fin, EDGE vous
            donne un débrief, un niveau estimé et des XP. Cette session construit une preuve de compétence.
          </p>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Choisissez votre format
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EDGE_CHALLENGE_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id as ChallengeFormatId)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  format === f.id
                    ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/[0.1]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <span className="text-lg">{f.emoji}</span>
                <span className="flex-1 text-sm text-white/80">{f.label}</span>
                {f.meta ? <span className="text-[11px] text-white/40">{f.meta}</span> : null}
              </button>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

          <button
            type="button"
            onClick={start}
            disabled={sending}
            className={`${CONNECT_BTN_PRIMARY} mt-6 inline-flex w-full items-center justify-center gap-2`}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Lancer le défi
          </button>
        </section>
      </div>
    );
  }

  /* ------------------------------ Débrief ------------------------------- */
  if (phase === "debrief" && result) {
    const { debrief, xpAwarded, totalXp, streak, badge } = result;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink />
        <section className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.1] to-transparent p-6 text-center">
          <Trophy className="mx-auto h-10 w-10 text-emerald-300" />
          <h1 className="mt-3 text-2xl font-bold text-white">Défi terminé !</h1>
          <p className="mt-1 text-sm text-white/60">Compétence : {skill}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="XP gagnés" value={`+${xpAwarded}`} accent="text-[#8BB4FF]" />
            <Stat label="XP total" value={String(totalXp)} accent="text-white" />
            <Stat label="Série" value={`${streak} j`} accent="text-orange-300" />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Niveau estimé</p>
              <p className="mt-1 text-xl font-bold text-white">{debrief.levelEstimated}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Confiance</p>
              <p className="mt-1 text-xl font-bold text-[#8BB4FF]">{debrief.confidence} %</p>
            </div>
          </div>

          <DebriefList title="Vos points forts" items={debrief.strengths} dot="bg-emerald-400" />
          <DebriefList title="Vos axes d'amélioration" items={debrief.improvements} dot="bg-amber-400" />

          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-[#8BB4FF]">
              <Award className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Badge {skill} — {badge.status === "earned" ? "obtenu" : `${badge.progress} %`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${badge.progress}%` }} />
            </div>
            {debrief.skillValidated ? (
              <p className="mt-2 text-xs text-emerald-300">Compétence validée par ce défi.</p>
            ) : null}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Prochaine action</p>
            <p className="mt-1 text-sm text-white/70">{debrief.nextAction}</p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setMessages([]);
                setRunId(null);
                setCanFinish(false);
                setProofText("");
                setPhase("intro");
              }}
              className={`${CONNECT_BTN_PRIMARY} inline-flex items-center justify-center gap-2`}
            >
              <Zap className="h-4 w-4" />
              Nouveau défi
            </button>
            <Link
              href="/dashboard/apprenant/coaching"
              className={`${CONNECT_BTN_SECONDARY} inline-flex items-center justify-center gap-2`}
            >
              Voir mon plan de progression
            </Link>
          </div>
        </section>
      </div>
    );
  }

  /* -------------------------------- Chat -------------------------------- */
  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-4">
      <BackLink />
      <div className="flex items-center gap-2">
        <span className="text-lg">{meta.emoji}</span>
        <div>
          <p className={APPRENANT_CARD_KICKER}>Défi EDGE · {skill}</p>
          <p className="text-xs text-white/45">{meta.label}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[52vh] min-h-[280px] space-y-3 overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#3D7BFF] text-white"
                  : "border border-white/[0.08] bg-white/[0.04] text-white/80"
              }`}
            >
              {m.role === "assistant" ? (
                <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">
                  <Sparkles className="h-3 w-3" /> Coach EDGE
                </span>
              ) : null}
              {m.content}
            </div>
          </div>
        ))}
        {sending && phase === "chat" ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Votre réponse au coach…"
          className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-white/35">Entrée pour envoyer · Maj+Entrée pour un saut de ligne</span>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D7BFF] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#2F6AE8] disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Envoyer
          </button>
        </div>
      </div>

      {canFinish ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
          <p className="text-sm text-white/70">
            Vous avez de quoi être évalué. Vous pouvez ajouter une preuve écrite (optionnel) puis terminer.
          </p>
          <textarea
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            rows={2}
            placeholder="Preuve écrite : résultat, lien, chiffre clé… (optionnel)"
            className="mt-3 w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#3D7BFF]/40"
          />
          <button
            type="button"
            onClick={() => void finish()}
            className={`${CONNECT_BTN_PRIMARY} mt-3 inline-flex w-full items-center justify-center gap-2`}
          >
            <Trophy className="h-4 w-4" /> Terminer et obtenir mon débrief
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/apprenant/profil"
      className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" /> Retour au Profil EDGE
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] text-white/55">{label}</p>
    </div>
  );
}

function DebriefList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-white/70">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
