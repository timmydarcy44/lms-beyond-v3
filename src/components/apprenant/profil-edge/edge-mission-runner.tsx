"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { EDGE_MISSION_LABEL } from "@/lib/apprenant/edge-missions";
import type {
  CoachInsight,
  MissionBrief,
  MissionChatMessage,
  MissionCoachReply,
  MissionFinishResult,
} from "@/lib/apprenant/edge-mission-types";
import {
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

type Phase = "loading" | "briefing" | "chat" | "finishing" | "debrief";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.07 } } };

function messagesFromCoachReply(reply: MissionCoachReply): MissionChatMessage[] {
  const out: MissionChatMessage[] = [];
  if (reply.coachIntro?.trim()) {
    out.push({ role: "assistant", kind: "coach", content: reply.coachIntro });
  }
  if (reply.coachInsight) {
    out.push({ role: "assistant", kind: "coach", content: "", coachInsight: reply.coachInsight });
  }
  if (reply.sceneReply?.trim()) {
    out.push({ role: "assistant", kind: "scene", content: reply.sceneReply });
  }
  return out;
}

export function EdgeMissionRunner() {
  const params = useSearchParams();
  const skill = params.get("skill")?.trim() || "";
  const objective = params.get("objective")?.trim() || "";
  const levelCurrent = params.get("level")?.trim() || "Intermédiaire";
  const levelExpected = params.get("target")?.trim() || "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [mission, setMission] = useState<MissionBrief | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MissionChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [proofText, setProofText] = useState("");
  const [sending, setSending] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const [result, setResult] = useState<MissionFinishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const baseBody = useCallback(
    () => ({ skill, objective, levelCurrent, levelExpected, format: "situation" as const }),
    [skill, objective, levelCurrent, levelExpected],
  );

  useEffect(() => {
    if (!skill) {
      setError("Compétence manquante.");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/learner/edge-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate", ...baseBody() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        if (!cancelled) {
          setMission(json.mission as MissionBrief);
          setPhase("briefing");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Impossible de préparer la mission.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skill, baseBody]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const startMission = useCallback(async () => {
    if (!mission) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/learner/edge-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", mission, ...baseBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setRunId(json.runId);
      setMessages(messagesFromCoachReply(json.reply as MissionCoachReply));
      setPhase("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de démarrer la mission.");
    } finally {
      setSending(false);
    }
  }, [mission, baseBody]);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || sending || !mission) return;
    const nextMessages: MissionChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/learner/edge-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", mission, messages: nextMessages, ...baseBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMessages((prev) => [...prev, ...messagesFromCoachReply(json.reply as MissionCoachReply)]);
      setCanFinish(Boolean(json.canFinish));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de communication avec le coach.");
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, mission, baseBody]);

  const finish = useCallback(async () => {
    if (!mission) return;
    setPhase("finishing");
    setError(null);
    try {
      const res = await fetch("/api/learner/edge-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", runId, mission, messages, proofText, ...baseBody() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setResult(json as MissionFinishResult);
      setPhase("debrief");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de finaliser la mission.");
      setPhase("chat");
    }
  }, [runId, messages, proofText, mission, baseBody]);

  if (error && phase === "loading") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackLink />
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (phase === "loading" || !mission) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#8BB4FF]" />
        <p className="text-sm text-white/50">Le Coach EDGE prépare votre mission personnalisée…</p>
      </div>
    );
  }

  /* ----------------------------- Briefing ----------------------------- */
  if (phase === "briefing") {
    return (
      <motion.div
        className="mx-auto max-w-2xl space-y-6"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <BackLink />
        <motion.section variants={fadeUp} className="rounded-2xl border border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/[0.12] to-transparent p-6">
          <p className={APPRENANT_CARD_KICKER}>{EDGE_MISSION_LABEL}</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{mission.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65">{mission.pedagogicalObjective}</p>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1">
              <Clock className="h-3.5 w-3.5" /> {mission.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1">
              <Target className="h-3.5 w-3.5" /> {mission.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1">
              Niveau {mission.level}
            </span>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">
            Pourquoi faisons-nous cette mission ?
          </p>
          <ul className="mt-3 space-y-2">
            {mission.whySelected.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-white/75">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {reason}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Compétences travaillées</p>
          <p className="mt-2 text-sm font-semibold text-white">{mission.primarySkill}</p>
          {mission.secondarySkills.length ? (
            <p className="mt-1 text-xs text-white/50">{mission.secondarySkills.join(" · ")}</p>
          ) : null}
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            À la fin, vous serez capable de
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-white/70">
            {mission.outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
                {o}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Contexte</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{mission.context}</p>
          <p className="mt-3 text-sm text-white/55">
            <span className="font-medium text-white/70">Objectif :</span> {mission.missionGoal}
          </p>
          <p className="mt-2 text-xs text-[#8BB4FF]">Le Coach EDGE jouera : {mission.coachRole}</p>
        </motion.section>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <motion.button
          variants={fadeUp}
          type="button"
          onClick={() => void startMission()}
          disabled={sending}
          className={`${CONNECT_BTN_PRIMARY} inline-flex w-full items-center justify-center gap-2`}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Commencer la mission
        </motion.button>
      </motion.div>
    );
  }

  /* ------------------------------ Débrief ----------------------------- */
  if (phase === "debrief" && result) {
    const { debrief, xpAwarded, totalXp, streak, badge } = result;
    const badgeSoon = badge.progress >= 75;
    return (
      <motion.div
        className="mx-auto max-w-2xl space-y-5"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <BackLink />

        {/* Moment de satisfaction — message personnel du coach */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.12] to-transparent p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">Coach EDGE</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/85">
                {debrief.celebrationMessage}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Récompenses — XP et série */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          <Stat label="XP gagnés" value={`+${xpAwarded}`} accent="text-[#8BB4FF]" delay={0.1} />
          <Stat label="XP total" value={String(totalXp)} accent="text-white" delay={0.2} />
          <Stat label="Série" value={`${streak} j`} accent="text-orange-300" delay={0.3} />
        </motion.div>

        {/* Progression compétence */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.06] p-5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">Progression du jour</p>
          <p className="mt-2 text-base font-semibold text-white">{debrief.progressHighlight}</p>
          <p className="mt-1 text-sm text-white/55">{debrief.summary}</p>
        </motion.section>

        <motion.section variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-5">
          <div className="flex justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Niveau estimé</p>
              <p className="mt-1 text-xl font-bold text-white">{debrief.levelEstimated}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Confiance</p>
              <p className="mt-1 text-xl font-bold text-[#8BB4FF]">{debrief.confidence} %</p>
            </div>
          </div>

          <DebriefBlock title="Vos points forts" items={debrief.strengths} />
          <DebriefBlock title="Vos axes d'amélioration" items={debrief.improvements} />
          <DebriefBlock title="Ce que j'ai observé" items={debrief.observations} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Pourquoi je pense cela</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{debrief.whyThink}</p>
          </div>
          {debrief.examplesFromAnswers.length ? (
            <DebriefBlock title="Exemples issus de vos réponses" items={debrief.examplesFromAnswers} />
          ) : null}
          <DebriefBlock title="Ce qu'il faudra travailler ensuite" items={debrief.whatToWorkNext} />

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-[#8BB4FF]">
              <Award className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Progression vers le badge {badge.skill} — {badge.progress} %
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#3D7BFF]"
                initial={{ width: 0 }}
                animate={{ width: `${badge.progress}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-white/45">
              {badgeSoon
                ? `Votre badge ${badge.skill} est presque disponible — encore quelques missions !`
                : "Les Open Badges restent la seule certification vérifiable."}
            </p>
          </div>

          <div className="rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.06] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">Votre prochaine mission</p>
            <p className="mt-2 text-sm font-semibold text-white">{debrief.recommendedMissionTitle}</p>
            <p className="mt-1 text-xs text-white/50">{debrief.nextAction}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/dashboard/apprenant/mission?skill=${encodeURIComponent(skill)}&objective=${encodeURIComponent(objective)}`}
              className={`${CONNECT_BTN_PRIMARY} inline-flex items-center justify-center gap-2`}
            >
              <Trophy className="h-4 w-4" /> Mission suivante
            </Link>
            <Link href="/dashboard/apprenant/profil" className={`${CONNECT_BTN_SECONDARY} inline-flex items-center justify-center gap-2`}>
              Retour au profil
            </Link>
          </div>
        </motion.section>
      </motion.div>
    );
  }

  /* -------------------------------- Chat -------------------------------- */
  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-4">
      <BackLink />
      <div>
        <p className={APPRENANT_CARD_KICKER}>{EDGE_MISSION_LABEL}</p>
        <h1 className="text-lg font-semibold text-white">{mission.title}</h1>
        <p className="text-xs text-white/45">Coach : {mission.coachRole}</p>
      </div>

      <div ref={scrollRef} className="max-h-[52vh] min-h-[280px] space-y-3 overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && m.coachInsight ? (
                <CoachInsightBubble insight={m.coachInsight} />
              ) : (
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#3D7BFF] text-white"
                      : m.kind === "coach"
                        ? "border border-[#3D7BFF]/25 bg-[#3D7BFF]/[0.08] text-white/85"
                        : "border border-white/[0.08] bg-white/[0.04] text-white/80"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <span
                      className={`mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                        m.kind === "coach" ? "text-[#8BB4FF]" : "text-[#8BB4FF]/70"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {m.kind === "coach" ? "Coach EDGE" : mission.coachRole}
                    </span>
                  ) : null}
                  {m.content}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && phase === "chat" ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          </div>
        ) : null}
        {phase === "finishing" ? (
          <p className="text-center text-sm text-white/45">Le Coach EDGE prépare votre débrief…</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {phase === "chat" ? (
        <>
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
              placeholder="Votre réponse dans la mission…"
              className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
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
              <p className="text-sm text-white/70">Vous pouvez terminer la mission et recevoir votre débrief.</p>
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                rows={2}
                placeholder="Preuve écrite optionnelle (+20 XP)"
                className="mt-3 w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <button type="button" onClick={() => void finish()} className={`${CONNECT_BTN_PRIMARY} mt-3 inline-flex w-full items-center justify-center gap-2`}>
                <Trophy className="h-4 w-4" /> Terminer la mission
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/dashboard/apprenant/profil" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
      <ArrowLeft className="h-4 w-4" /> Retour au Profil EDGE
    </Link>
  );
}

function Stat({
  label,
  value,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center"
    >
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] text-white/55">{label}</p>
    </motion.div>
  );
}

function CoachInsightBubble({ insight }: { insight: CoachInsight }) {
  const rows = [
    { label: "Pourquoi je t'ai posé cette question", value: insight.whyAsked },
    { label: "Ce que j'ai observé", value: insight.whatObserved },
    { label: "Pourquoi je pense cela", value: insight.whyThink },
    { label: "Comment je l'ai évalué", value: insight.howEvaluated },
  ].filter((r) => r.value?.trim());

  return (
    <div className="max-w-[90%] rounded-2xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.06] px-4 py-3">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">
        <Sparkles className="h-3 w-3" /> Coach EDGE — mon analyse
      </span>
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/40">{row.label}</p>
            <p className="text-sm leading-relaxed text-white/75">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebriefBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-white/70">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
