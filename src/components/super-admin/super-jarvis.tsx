"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "bot"; text: string };

function isCrmPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/super/utilisateurs") ||
    pathname.startsWith("/super/crm") ||
    pathname.startsWith("/super/organisations")
  );
}

export function SuperJarvis() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  const greeting = useMemo(
    () =>
      "Bonjour, je suis JARVIS Super. Je connais l’espace /super : CRM, pipeline, Open Badges, organisations, emails Resend… Comment puis-je vous aider ?",
    [],
  );

  const openPanel = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: "bot", text: greeting }]);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/jarvis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const json = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      setMessages((m) => [...m, { role: "bot", text: json.reply ?? "…" }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur JARVIS");
      setMessages((m) => [...m, { role: "bot", text: "Désolé, une erreur est survenue." }]);
    } finally {
      setLoading(false);
    }
  };

  if (isCrmPath(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition",
          "bg-gradient-to-br from-violet-600 to-indigo-700 text-white hover:scale-105",
        )}
        title="JARVIS Super"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-[60] flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-violet-600 to-indigo-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">JARVIS Super</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex max-h-[360px] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm leading-relaxed",
                  m.role === "user" ? "ml-8 bg-violet-50 text-gray-900" : "mr-4 bg-gray-50 text-gray-800",
                )}
              >
                {m.text}
              </div>
            ))}
            {loading ? <p className="text-xs text-gray-400">Réflexion…</p> : null}
          </div>
          <div className="border-t border-gray-100 p-3 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur /super…"
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button onClick={() => void send()} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
              Envoyer
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
