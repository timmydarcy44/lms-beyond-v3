"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Mic } from "lucide-react";

interface ChatViewProps {
  documentId: string;
  extractedText: string;
  subject?: string;
  level?: string;
  folderName?: string;
  folderDocCount?: number;
  onClose: () => void;
}

export function ChatView({
  documentId,
  extractedText,
  subject,
  level,
  folderName,
  folderDocCount,
  onClose,
}: ChatViewProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Bonjour ! Je connais ce cours par cœur. Pose-moi n'importe quelle question 👋" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) setInput(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const send = async () => {
    console.log("[chat] extractedText length:", extractedText?.length);
    if (!input.trim()) return;
    if (!extractedText || extractedText.trim().length === 0) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur : aucun contenu du cours n'est disponible pour répondre." },
      ]);
      return;
    }
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/beyond-note/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          documentId,
          subject,
          level,
          folderName,
          folderDocCount,
          extractedText,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur, réessaie." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <p className="font-semibold">Questions sur ce cours</p>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                m.role === "user" ? "bg-violet-600 text-white" : "bg-white/10 text-white"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-2xl text-white/50 text-sm">...</div>
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-white/10 flex gap-3">
        <Button
          type="button"
          onClick={startDictation}
          className={`h-11 w-11 rounded-xl border border-white/10 ${
            isRecording ? "bg-red-500/30 text-red-200 animate-pulse" : "bg-white/5 text-white/70"
          }`}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pose ta question..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
        />
        <Button onClick={send} disabled={loading} className="bg-violet-600 hover:bg-violet-500 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
