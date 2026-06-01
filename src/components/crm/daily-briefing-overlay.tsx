"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Mail,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  Send,
  SkipForward,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FluidEnergyOrb } from "@/components/crm/fluid-energy-orb";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import {
  scriptAvoid,
  scriptIntroGreeting,
  scriptIntroPriorityLine,
  scriptPipeline,
  scriptPriority,
  scriptTip,
} from "@/lib/crm/briefing-coach-scripts";
import type { ListenResult } from "@/hooks/use-voice-coach";
import type {
  BriefingApiResponse,
  BriefingPriority,
  DailyBriefing,
} from "@/lib/crm/daily-briefing-types";
import { stripMarkdownForSpeech } from "@/lib/voice/prepare-text-for-speech";

type DailyBriefingOverlayProps = {
  open: boolean;
  onClose: () => void;
};

type CoachPhase = "loading" | "coaching" | "dialogue";
type CoachStepKind = "intro" | "pipeline" | "priority" | "avoid" | "tip";

type CoachStep = {
  kind: CoachStepKind;
  priorityIndex?: number;
};

type DialogueMsg = { role: "user" | "assistant"; content: string };

function buildSteps(briefing: DailyBriefing): CoachStep[] {
  const steps: CoachStep[] = [
    { kind: "intro" },
    { kind: "pipeline" },
    ...briefing.priorities.map((_, i) => ({ kind: "priority" as const, priorityIndex: i })),
    { kind: "avoid" },
    { kind: "tip" },
  ];
  return steps;
}

function stepScript(step: CoachStep, briefing: DailyBriefing, dateLabel: string): string {
  switch (step.kind) {
    case "intro":
      return "";
    case "pipeline":
      return scriptPipeline(briefing);
    case "priority": {
      const p = briefing.priorities[step.priorityIndex ?? 0];
      return p ? scriptPriority(p) : "";
    }
    case "avoid":
      return scriptAvoid(briefing);
    case "tip":
      return scriptTip(briefing);
    default:
      return "";
  }
}

export function DailyBriefingOverlay({ open, onClose }: DailyBriefingOverlayProps) {
  const voice = useVoiceCoach();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [phase, setPhase] = useState<CoachPhase>("loading");
  const [steps, setSteps] = useState<CoachStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [coachPaused, setCoachPaused] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [emailDraft, setEmailDraft] = useState<{
    priority: BriefingPriority;
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [visiblePriorityCount, setVisiblePriorityCount] = useState(0);
  const coachRunningRef = useRef(false);
  const spokenStepRef = useRef(-1);
  const introRunRef = useRef(false);
  const voiceModeRef = useRef(false);
  const chatLoadingRef = useRef(false);
  const briefingRef = useRef<DailyBriefing | null>(null);
  const dialogueRef = useRef<DialogueMsg[]>([]);
  const phaseRef = useRef<CoachPhase>("loading");
  const openRef = useRef(open);
  const voiceCleanupRef = useRef(voice.cleanup);
  const voiceResetRef = useRef(voice.reset);
  const voiceListenRef = useRef(voice.listenOnce);
  const voiceSpeakRef = useRef(voice.speak);
  const voiceWaitIdleRef = useRef(voice.waitUntilIdle);
  voiceCleanupRef.current = voice.cleanup;
  voiceResetRef.current = voice.reset;
  voiceListenRef.current = voice.listenOnce;
  voiceSpeakRef.current = voice.speak;
  voiceWaitIdleRef.current = voice.waitUntilIdle;
  chatLoadingRef.current = chatLoading;
  openRef.current = open;
  phaseRef.current = phase;
  dialogueRef.current = dialogue;

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentStep = steps[stepIndex];
  const currentPriority =
    currentStep?.kind === "priority" && briefing
      ? briefing.priorities[currentStep.priorityIndex ?? 0]
      : null;

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhase("loading");
    setStepIndex(0);
    setDialogue([]);
    setEmailDraft(null);
    try {
      const res = await fetch("/api/ai-assistant/briefing");
      const json = (await res.json()) as BriefingApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur réseau");
      setBriefing(json.briefing);
      briefingRef.current = json.briefing;
      setSteps(buildSteps(json.briefing));
      spokenStepRef.current = -1;
      introRunRef.current = false;
      setVisiblePriorityCount(0);
      voiceModeRef.current = false;
      setPhase("coaching");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    voiceResetRef.current();
    coachRunningRef.current = true;
    void fetchBriefing();
    return () => {
      coachRunningRef.current = false;
      voiceCleanupRef.current();
    };
  }, [open, fetchBriefing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!currentPriority || currentPriority.action_type !== "email" || !currentPriority.email) {
      setEmailDraft(null);
      return;
    }
    setEmailDraft({
      priority: currentPriority,
      to: currentPriority.contact_email ?? "",
      subject: currentPriority.email.subject,
      body: currentPriority.email.body,
    });
  }, [currentPriority?.company, currentPriority?.rank, currentStep?.kind]);

  const enterDialogueMode = useCallback(() => {
    setPhase("dialogue");
    phaseRef.current = "dialogue";
    voiceModeRef.current = true;
  }, []);

  const reportListenError = useCallback((result: ListenResult) => {
    if (!result.error || result.error === "aborted") return;
    if (result.error === "not-allowed") {
      toast.error("Micro refusé — autorise l'accès au micro pour ce site.");
      return;
    }
    if (result.error === "unsupported") {
      toast.error("Reconnaissance vocale non supportée (Chrome recommandé).");
      return;
    }
    if (result.error === "no-speech") {
      toast.message("Je n'ai rien entendu — réessaie.");
      return;
    }
    toast.message("Problème micro — réessaie.");
  }, []);

  const listenUser = useCallback(async (): Promise<string> => {
    await voiceWaitIdleRef.current();
    const result = await voiceListenRef.current();
    if (result.text.trim()) return result.text.trim();
    reportListenError(result);
    return "";
  }, [reportListenError]);

  const goNextStep = useCallback(() => {
    voice.stopSpeaking();
    if (stepIndex >= steps.length - 1) {
      enterDialogueMode();
      void (async () => {
        await voice.speak("Mode libre. Parle-moi.");
        if (!coachRunningRef.current) return;
        const heard = await listenUser();
        if (heard) await askCoachRef.current(heard);
      })();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [stepIndex, steps.length, voice, enterDialogueMode, listenUser]);

  const askCoachRef = useRef<(text: string, opts?: { autoListenAfter?: boolean }) => Promise<void>>(
    async () => {},
  );

  useEffect(() => {
    if (phase !== "coaching" || loading || !briefing || coachPaused || !coachRunningRef.current) {
      return;
    }
    const step = steps[stepIndex];
    if (!step || step.kind === "intro") return;
    if (spokenStepRef.current === stepIndex) return;
    spokenStepRef.current = stepIndex;

    void (async () => {
      const text = stepScript(step, briefing, dateLabel);
      if (text) await voice.speak(text);
    })();
  }, [phase, loading, briefing, coachPaused, stepIndex, steps, dateLabel, voice]);

  useEffect(() => {
    if (phase !== "coaching" || loading || !briefing || coachPaused || !coachRunningRef.current) {
      return;
    }
    const step = steps[stepIndex];
    if (step?.kind !== "intro" || introRunRef.current) return;
    introRunRef.current = true;
    spokenStepRef.current = stepIndex;

    void (async () => {
      setVisiblePriorityCount(0);
      await voiceSpeakRef.current(scriptIntroGreeting(briefing));
      if (!coachRunningRef.current || coachPaused) return;

      for (let i = 0; i < briefing.priorities.length; i += 1) {
        setVisiblePriorityCount(i + 1);
        await new Promise((r) => setTimeout(r, 400));
        if (!coachRunningRef.current || coachPaused) return;
        await voiceSpeakRef.current(scriptIntroPriorityLine(briefing.priorities[i]));
        await new Promise((r) => setTimeout(r, 500));
      }
    })();
  }, [phase, loading, briefing, coachPaused, stepIndex, steps]);

  const askCoach = useCallback(
    async (userText: string, options?: { autoListenAfter?: boolean }) => {
      const trimmed = userText.trim();
      if (!trimmed || chatLoadingRef.current) return;

      const lower = trimmed.toLowerCase();
      const wasCoaching = phaseRef.current === "coaching";
      if (wasCoaching) {
        if (lower.includes("suivant") || lower.includes("passer") || lower.includes("continue")) {
          goNextStep();
          return;
        }
        if (lower.includes("répète") || lower.includes("repete")) {
          spokenStepRef.current = -1;
          const step = steps[stepIndex];
          if (step && briefingRef.current) {
            await voiceSpeakRef.current(stepScript(step, briefingRef.current, dateLabel));
          }
          return;
        }
      }

      enterDialogueMode();
      voiceModeRef.current = true;
      setCoachPaused(true);

      const historyBefore = dialogueRef.current.slice(-10);
      const userMsg: DialogueMsg = { role: "user", content: trimmed };
      const withUser = [...dialogueRef.current, userMsg];
      dialogueRef.current = withUser;
      setDialogue(withUser);
      setChatInput("");
      setLiveTranscript(trimmed);
      chatLoadingRef.current = true;
      setChatLoading(true);

      try {
        const res = await fetch("/api/ai-assistant/briefing-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            briefing: briefingRef.current,
            conversationHistory: historyBefore,
          }),
        });
        const json = (await res.json()) as { reply?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Erreur");

        const reply = stripMarkdownForSpeech(json.reply ?? "Je n'ai pas de réponse.");
        const withReply = [...dialogueRef.current, { role: "assistant" as const, content: reply }];
        dialogueRef.current = withReply;
        setDialogue(withReply);

        await voiceSpeakRef.current(reply);

        const shouldAutoListen =
          options?.autoListenAfter !== false &&
          openRef.current &&
          voiceModeRef.current &&
          coachRunningRef.current;
        if (shouldAutoListen) {
          const heard = await listenUser();
          if (heard) {
            setLiveTranscript(heard);
            await askCoachRef.current(heard, { autoListenAfter: true });
          }
        }
      } catch (e) {
        const err = e instanceof Error ? e.message : "Erreur";
        toast.error(err);
        await voiceSpeakRef.current("Désolé, une erreur. Réessaie.");
      } finally {
        chatLoadingRef.current = false;
        setChatLoading(false);
      }
    },
    [goNextStep, steps, stepIndex, dateLabel, enterDialogueMode, listenUser],
  );

  askCoachRef.current = askCoach;

  const toggleListen = async () => {
    if (voice.isListening) {
      voice.stopListening();
      return;
    }
    voice.stopSpeaking();
    setCoachPaused(true);
    enterDialogueMode();
    voiceModeRef.current = true;
    const heard = await listenUser();
    if (heard) {
      setLiveTranscript(heard);
      await askCoach(heard);
    }
  };

  const startDialogueFromButton = () => {
    enterDialogueMode();
    voiceModeRef.current = true;
    setCoachPaused(true);
    voice.stopSpeaking();
    void (async () => {
      await voice.speak("OK, on discute. Parle-moi.");
      const heard = await listenUser();
      if (heard) await askCoach(heard);
    })();
  };

  const confirmSendEmail = async () => {
    if (!emailDraft?.priority.prospect_id) {
      toast.error("Prospect introuvable dans le CRM.");
      return;
    }
    const { to, subject, body, priority } = emailDraft;
    if (!to.trim()) {
      toast.error("Indique l'email du destinataire.");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch("/api/resend/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject,
          body,
          from: "Timmy Darcy <darcy@edgebs.fr>",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");

      const actionRes = await fetch("/api/ai-assistant/briefing-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: priority.prospect_id,
          actionType: "email_sent",
          emailSubject: subject,
        }),
      });
      if (!actionRes.ok) throw new Error("CRM non mis à jour");

      window.dispatchEvent(new CustomEvent("crm-updated"));
      toast.success("Email envoyé — CRM mis à jour");
      setEmailDraft(null);
      await voice.speak(`Envoyé à ${to}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#070b1a] text-white"
      role="dialog"
      aria-modal="true"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-900/40 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-violet-700/25 blur-3xl" />
      </div>

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-violet-300/80">
            Commercial Beyond
          </p>
          <h1 className="text-lg font-bold sm:text-xl">Briefing du jour</h1>
          <p className="text-sm text-white/50 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            disabled={loading}
            onClick={() => void fetchBriefing()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col items-center px-4 py-6 sm:px-8">
          <FluidEnergyOrb active={voice.isSpeaking || voice.isListening || chatLoading || loading} />

          <p className="mt-6 max-w-xl text-center text-sm text-white/70 sm:text-base">
            {loading
              ? "Chargement…"
              : currentStep?.kind === "intro"
                ? "Bonjour Timmy, voici tes priorités aujourd'hui"
                : voice.isSpeaking
                  ? "…"
                  : voice.isListening
                    ? "Je t'écoute"
                    : phase === "coaching"
                      ? `Étape ${stepIndex + 1} / ${steps.length}`
                      : "Parle ou écris"}
          </p>

          {liveTranscript ? (
            <p className="mt-2 text-center text-sm italic text-violet-200">« {liveTranscript} »</p>
          ) : null}

          {error && !loading ? (
            <div className="mt-6 text-center">
              <p className="text-red-300">{error}</p>
              <Button className="mt-4" onClick={() => void fetchBriefing()}>
                Réessayer
              </Button>
            </div>
          ) : null}

          {!loading && briefing && phase === "coaching" && currentStep ? (
            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              {currentStep.kind === "intro" ? (
                <div className="space-y-4 text-center">
                  <p className="text-xl font-semibold text-white sm:text-2xl">
                    Bonjour Timmy,
                    <br />
                    <span className="text-violet-300">voici tes priorités aujourd&apos;hui</span>
                  </p>
                  <ul className="space-y-2 text-left text-sm text-white/85">
                    {briefing.priorities.slice(0, visiblePriorityCount).map((p, i) => (
                      <li
                        key={`${p.rank}-${p.company}`}
                        className="rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-2 opacity-0 animate-[briefing-priority-in_0.5s_ease-out_forwards]"
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <strong className="text-violet-200">#{p.rank}</strong> {p.company}
                        <span className="text-white/50"> — {p.why_today}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {currentStep.kind === "pipeline" ? (
                <div className="text-sm text-white/90">
                  <p className="font-semibold text-violet-200">État du pipeline</p>
                  <p className="mt-2">{briefing.pipeline_status.top_insight}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
                    <span>{briefing.pipeline_status.total} prospects</span>
                    {briefing.pipeline_status.actions_overdue > 0 ? (
                      <span className="text-red-300">
                        {briefing.pipeline_status.actions_overdue} en retard
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {currentPriority ? (
                <div className="space-y-2">
                  <p className="text-lg font-bold text-white">
                    Priorité {currentPriority.rank} — {currentPriority.company}
                  </p>
                  <p className="text-sm italic text-white/60">{currentPriority.why_today}</p>
                  {currentPriority.linkedin_message && currentPriority.action_type === "linkedin" ? (
                    <p className="rounded-lg bg-black/30 p-3 text-sm text-white/80">
                      {currentPriority.linkedin_message}
                    </p>
                  ) : null}
                  {currentPriority.call_script && currentPriority.action_type === "call" ? (
                    <ul className="space-y-1 text-sm text-white/80">
                      <li>
                        <strong>Accroche :</strong> {currentPriority.call_script.hook}
                      </li>
                      <li>
                        <strong>Objectif :</strong> {currentPriority.call_script.goal}
                      </li>
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {currentStep.kind === "avoid" && briefing.do_not_contact_today.length > 0 ? (
                <ul className="space-y-2 text-sm text-amber-100/90">
                  {briefing.do_not_contact_today.map((x) => (
                    <li key={x.company}>
                      <strong>{x.company}</strong> — {x.reason}
                    </li>
                  ))}
                </ul>
              ) : null}

              {currentStep.kind === "tip" ? (
                <p className="text-sm text-white/80">
                  <strong className="text-violet-200">Conseil :</strong> {briefing.daily_tip}
                </p>
              ) : null}
            </div>
          ) : null}

          {emailDraft ? (
            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-violet-400/30 bg-violet-950/40 p-4">
              <p className="mb-3 text-sm font-semibold text-violet-200">
                Brouillon email — validation requise avant envoi
              </p>
              <div className="space-y-2">
                <Input
                  className="border-white/20 bg-black/30 text-white"
                  placeholder="Destinataire"
                  value={emailDraft.to}
                  onChange={(e) =>
                    setEmailDraft((d) => (d ? { ...d, to: e.target.value } : d))
                  }
                />
                <Input
                  className="border-white/20 bg-black/30 text-white"
                  value={emailDraft.subject}
                  onChange={(e) =>
                    setEmailDraft((d) => (d ? { ...d, subject: e.target.value } : d))
                  }
                />
                <Textarea
                  className="border-white/20 bg-black/30 text-white"
                  rows={5}
                  value={emailDraft.body}
                  onChange={(e) =>
                    setEmailDraft((d) => (d ? { ...d, body: e.target.value } : d))
                  }
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-[#6633CC] hover:bg-[#5528b0]"
                  disabled={sendingEmail}
                  onClick={() => void confirmSendEmail()}
                >
                  <Mail className="mr-1 h-4 w-4" />
                  {sendingEmail ? "Envoi…" : "Valider et envoyer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setEmailDraft(null);
                    void voice.speak("OK, brouillon gardé.");
                  }}
                >
                  Pas maintenant
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {phase === "coaching" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setCoachPaused((p) => !p)}
                >
                  {coachPaused ? (
                    <>
                      <Play className="mr-1 h-4 w-4" /> Reprendre
                    </>
                  ) : (
                    <>
                      <Pause className="mr-1 h-4 w-4" /> Pause
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="bg-violet-600 hover:bg-violet-500"
                  onClick={goNextStep}
                >
                  <SkipForward className="mr-1 h-4 w-4" />
                  Suivant
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="lg"
              className={cn(
                "rounded-full",
                voice.isListening
                  ? "bg-red-600 hover:bg-red-500 animate-pulse"
                  : "bg-[#6633CC] hover:bg-[#5528b0]",
              )}
              onClick={() => void toggleListen()}
              disabled={chatLoading || !voice.speechSupported}
            >
              {voice.isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            {phase === "coaching" ? (
              <Button
                type="button"
                variant="ghost"
                className="text-white/70"
                onClick={startDialogueFromButton}
              >
                Passer au dialogue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {!voice.speechSupported ? (
            <p className="mt-4 text-center text-xs text-amber-200/80">
              Micro vocal : utilise Chrome ou Edge sur HTTPS pour parler au coach.
            </p>
          ) : null}
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-white/10 bg-black/20 sm:max-h-[42vh] lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
          <p className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">
            Conversation
          </p>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {dialogue.length === 0 ? (
              <p className="text-sm text-white/40">
                Parle via le micro ou écris en bas — l&apos;historique s&apos;affiche ici.
              </p>
            ) : null}
            {dialogue.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-4 bg-violet-600/40 text-white"
                    : "mr-2 bg-white/10 text-white/90",
                )}
              >
                {m.content}
              </div>
            ))}
            {chatLoading ? (
              <p className="text-xs text-white/40">Réflexion…</p>
            ) : null}
          </div>
          <div className="shrink-0 border-t border-white/10 p-3">
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn(
                  "shrink-0 border-white/20",
                  voice.isListening && "border-red-400 bg-red-600/30 animate-pulse",
                )}
                disabled={chatLoading || !voice.speechSupported}
                onClick={() => void toggleListen()}
                aria-label="Microphone"
              >
                {voice.isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Input
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                placeholder="Parle ou écris…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void askCoach(chatInput);
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0 bg-[#6633CC]"
                disabled={chatLoading || !chatInput.trim()}
                onClick={() => void askCoach(chatInput)}
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
