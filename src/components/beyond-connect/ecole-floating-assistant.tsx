"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "bot"; text: string };

function useAssistantName() {
  return useMemo(
    () => (process.env.NEXT_PUBLIC_ECOLE_ASSISTANT_NAME ?? "").trim() || "Assistant",
    [],
  );
}

function AssistantMarkdown({ text }: { text: string }) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  return (
    <div className="max-w-none text-white/90 [&_a]:text-cyan-300 [&_a]:underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/85">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h3 className="mb-2 mt-2 text-base font-semibold text-white">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 mt-2 text-base font-semibold text-white">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold text-white">{children}</h4>,
        }}
      >
        {t}
      </ReactMarkdown>
    </div>
  );
}

export function EcoleFloatingAssistant() {
  const assistantName = useAssistantName();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  const openPanel = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: `Bonjour, je suis ${assistantName}. Vous pouvez me parler naturellement (par exemple pour vérifier que tout fonctionne), ou poser des questions sur votre établissement : apprenants, alternance, entreprises, offres, prospection…`,
        },
      ]);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const historyPayload = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ecole/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyPayload }),
      });
      const json = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      if (!res.ok) {
        throw new Error(json?.error || res.statusText);
      }
      setMessages((m) => [...m, { role: "bot", text: json?.reply || "—" }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-6 right-6 z-[120] flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-500/90 via-blue-600/95 to-indigo-700/95 text-white shadow-[0_0_24px_rgba(34,211,238,0.45),0_12px_40px_rgba(15,23,42,0.35)] transition hover:scale-105 hover:shadow-[0_0_32px_rgba(34,211,238,0.55)] md:bottom-8 md:right-8"
        aria-label={`Ouvrir ${assistantName}`}
      >
        <Sparkles className="h-7 w-7" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[130] flex items-end justify-end p-4 md:items-center md:justify-end md:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[min(520px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#0a0f1a] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-cyan-300" />
                <span className="text-sm font-semibold tracking-wide">{assistantName}</span>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-200">
                  Beta
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
              {messages.map((msg, i) => (
                <div
                  key={`${i}-${msg.role}`}
                  className={`max-w-[92%] rounded-2xl px-3 py-2 leading-relaxed ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600/80 text-white"
                      : "mr-auto border border-white/10 bg-white/5 text-white/90"
                  }`}
                >
                  {msg.role === "bot" ? <AssistantMarkdown text={msg.text} /> : msg.text}
                </div>
              ))}
              {loading ? <p className="text-xs text-cyan-200/80">{assistantName} traite votre question…</p> : null}
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
                  placeholder="Ex. Combien d'apprenants en alternance ?"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={send}
                  className="shrink-0 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
