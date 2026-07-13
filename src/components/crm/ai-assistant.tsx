"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssistantHistoryMessage, AssistantResponse } from "@/lib/crm/ai-assistant-types";
import { applyNaturalMaleSpeech } from "@/lib/voice/pick-french-male-voice";
import { prepareTextForSpeech, stripMarkdownForSpeech } from "@/lib/voice/prepare-text-for-speech";
import { useAiAssistant } from "@/components/crm/ai-assistant-provider";
import { DailyBriefingOverlay } from "@/components/crm/daily-briefing-overlay";

const VOICE_REPLY_KEY = "crm-ai-voice-reply";
const MAX_HISTORY = 10;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  );
}

export function AiAssistant() {
  const { isOpen, setIsOpen, toggle } = useAiAssistant();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceReply, setVoiceReply] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendOnEndRef = useRef(false);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
    try {
      setVoiceReply(localStorage.getItem(VOICE_REPLY_KEY) === "1");
    } catch {
      setVoiceReply(false);
    }
  }, []);

  useEffect(() => {
    const onOpenBriefing = () => {
      setIsOpen(false);
      setShowBriefing(true);
    };
    window.addEventListener("jarvis-open-briefing", onOpenBriefing);
    return () => window.removeEventListener("jarvis-open-briefing", onOpenBriefing);
  }, [setIsOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceReply || typeof window === "undefined") return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(prepareTextForSpeech(text));
      applyNaturalMaleSpeech(utterance);
      window.speechSynthesis.speak(utterance);
    },
    [voiceReply],
  );

  const toggleVoiceReply = () => {
    setVoiceReply((v) => {
      const next = !v;
      try {
        localStorage.setItem(VOICE_REPLY_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  };

  const buildHistory = useCallback((): AssistantHistoryMessage[] => {
    return messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: buildHistory(),
          }),
        });

        const json = (await res.json()) as AssistantResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Erreur réseau");

        const failed = json.actionResults?.find((r) => !r.success);
        if (failed) {
          toast.error(failed.message || "Je n'ai pas pu effectuer l'action.");
        } else if (json.actionResults?.some((r) => r.success && r.type !== "none")) {
          toast.success(json.actionResults.find((r) => r.success)?.message ?? "Action effectuée");
          window.dispatchEvent(new CustomEvent("crm-updated"));
        }

        const cleanReply = stripMarkdownForSpeech(json.reply ?? "");
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: cleanReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speak(cleanReply);
      } catch (e) {
        const errText =
          e instanceof Error ? e.message : "Désolé, une erreur est survenue. Réessaie.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: errText,
            timestamp: new Date(),
          },
        ]);
        toast.error(errText);
      } finally {
        setLoading(false);
      }
    },
    [loading, buildHistory, speak],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error(
        "Reconnaissance vocale non disponible sur ce navigateur. Utilisez Chrome.",
      );
      return;
    }

    stopListening();
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    sendOnEndRef.current = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === "not-allowed") {
        toast.error("Micro non autorisé. Autorisez l'accès au micro dans les paramètres du navigateur.");
      } else if (event.error !== "aborted") {
        toast.error("Erreur de reconnaissance vocale.");
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (sendOnEndRef.current) {
        sendOnEndRef.current = false;
        const t = transcriptRef.current.trim();
        if (t) void sendMessage(t);
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [stopListening, sendMessage]);

  const toggleMic = () => {
    if (listening) {
      sendOnEndRef.current = false;
      stopListening();
      return;
    }
    startListening();
  };

  const resetConversation = () => {
    setMessages([]);
    setInput("");
    stopListening();
    window.speechSynthesis?.cancel();
  };

  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis?.cancel();
    };
  }, [stopListening]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105",
          "bg-[#6633CC] text-white hover:bg-[#5528b0]",
          isOpen && "scale-95 opacity-90",
        )}
        title="Assistant Beyond CRM"
        aria-expanded={isOpen}
      >
        <Mic className="h-6 w-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-6 z-[70] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ height: isOpen ? 520 : 0 }}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#6633CC] to-indigo-700 px-4 py-3 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-5 w-5 shrink-0" />
            <span className="font-semibold truncate">Assistant Beyond</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowBriefing(true);
              }}
              className="todo-btn ml-1 shrink-0 rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
            >
              ✅ Todo
            </button>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleVoiceReply}
              className="rounded-lg px-2 py-1 text-xs hover:bg-white/20"
              title={voiceReply ? "Désactiver la réponse vocale" : "Activer la réponse vocale"}
            >
              {voiceReply ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="sr-only">Réponse vocale</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 hover:bg-white/20"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500 px-2 py-8">
              Pipeline BTOB : pose une question ou dicte une action. Ex. « Ajoute Lactalis, priorité haute ».
            </p>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col gap-0.5", m.role === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-[#6633CC] text-white"
                    : "bg-gray-100 text-gray-900",
                )}
              >
                {m.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{formatTime(m.timestamp)}</span>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 p-3 space-y-2">
          {!speechSupported ? (
            <p className="text-xs text-amber-700">
              Reconnaissance vocale non disponible sur ce navigateur. Utilisez Chrome.
            </p>
          ) : null}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ta demande CRM…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={loading || !speechSupported}
              onClick={toggleMic}
              className={cn(listening && "border-red-500 bg-red-50 text-red-600 animate-pulse")}
              title={listening ? "Arrêter le micro" : "Parler"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => void sendMessage(input)}
              className="bg-[#6633CC] hover:bg-[#5528b0]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={resetConversation}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-800"
          >
            Nouvelle conversation
          </button>
        </div>
      </div>

      <DailyBriefingOverlay open={showBriefing} onClose={() => setShowBriefing(false)} />
    </>
  );
}
