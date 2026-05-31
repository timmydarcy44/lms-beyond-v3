"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ExperientialInterviewViewProps = {
  contextText: string;
  interviewObjectives?: string;
  chapterTitle: string;
  courseTitle?: string;
  className?: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** When false, the AI conversation does not start until the learner confirms readiness. */
  conversationActive?: boolean;
  /** Premier message préchargé pendant l’écran de choix (évite « Préparation… » au démarrage). */
  initialAssistantMessage?: string | null;
};

export function ExperientialInterviewView({
  contextText,
  interviewObjectives,
  chapterTitle,
  courseTitle,
  className,
  onMessagesChange,
  conversationActive = true,
  initialAssistantMessage,
}: ExperientialInterviewViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const sendToApi = useCallback(
    async (history: ChatMessage[]) => {
      const res = await fetch("/api/ai/experiential-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          contextText,
          interviewObjectives: interviewObjectives?.trim() || undefined,
          chapterTitle,
          courseTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de l'assistant");
      return String(data.reply ?? "").trim();
    },
    [contextText, interviewObjectives, chapterTitle, courseTitle],
  );

  const bootstrap = useCallback(async () => {
    setInitializing(true);
    setMessages([]);
    if (!contextText.trim() || contextText.trim().length < 40) {
      setMessages([
        {
          role: "assistant",
          content:
            "Le contexte de cet entretien est incomplet. Le formateur doit enregistrer la formation après avoir créé l'entretien, ou mettre à jour le contexte IA du bloc.",
        },
      ]);
      setInitializing(false);
      return;
    }
    const cached = String(initialAssistantMessage ?? "").trim();
    if (cached) {
      setMessages([{ role: "assistant", content: cached }]);
      setInitializing(false);
      return;
    }
    try {
      const reply = await sendToApi([]);
      setMessages([{ role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([
        {
          role: "assistant",
          content:
            e instanceof Error
              ? `Désolé, l'entretien n'a pas pu démarrer : ${e.message}`
              : "Désolé, l'entretien n'a pas pu démarrer.",
        },
      ]);
    } finally {
      setInitializing(false);
    }
  }, [sendToApi, contextText, initialAssistantMessage]);

  useEffect(() => {
    if (!conversationActive) {
      setInitializing(false);
      setMessages([]);
      return;
    }
    void bootstrap();
  }, [bootstrap, conversationActive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const reply = await sendToApi(nextHistory);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Une erreur est survenue.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleRestart = () => {
    setDraft("");
    void bootstrap();
  };

  return (
    <div
      className={cn(
        "flex h-[100dvh] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg",
        className,
      )}
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <aside className="relative hidden flex-col justify-between border-r border-violet-900/30 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#12081f] p-6 text-white lg:flex">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">EDGE AI</p>
            <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight text-white">
              Entretien expérientiel
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Entretien expérientiel guidé : questions courtes, réponses écrites ou à l&apos;oral pour ancrer vos
              apprentissages.
            </p>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/55">
            Contexte : <span className="font-medium text-white/85">{chapterTitle}</span>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-5">
            <div className="lg:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-700">Entretien</p>
              <p className="text-sm font-semibold text-slate-900">{chapterTitle}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              disabled={initializing || loading}
              className="ml-auto gap-2 text-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              Recommencer
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 lg:px-6">
            {initializing ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                Connexion à l&apos;assistant…
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[min(100%,520px)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-white text-slate-900 ring-1 ring-slate-200"
                        : "bg-slate-200/80 text-slate-900",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-200/80 px-4 py-3 text-sm text-slate-600">
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Réflexion…
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ta réponse…"
                rows={2}
                disabled={!conversationActive || initializing || loading}
                className="min-h-[48px] resize-none rounded-2xl border-slate-200 bg-slate-50 text-slate-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full text-slate-500"
                aria-label="Saisie vocale (bientôt)"
                disabled
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                disabled={!conversationActive || !draft.trim() || loading || initializing}
                onClick={() => void handleSend()}
                className="h-11 w-11 shrink-0 rounded-full bg-violet-600 text-white hover:bg-violet-500"
                aria-label="Envoyer"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
