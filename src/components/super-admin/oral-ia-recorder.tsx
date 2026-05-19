"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OralIaRecorderProps = {
  /** Texte retranscrit (contrôlé par le parent pour l’édition) */
  transcript: string;
  onTranscriptChange: (text: string) => void;
  className?: string;
};

/** Utilise l’API Web Speech (Chrome/Edge) pour un aperçu temps réel ; fallback : saisie manuelle. */
export function OralIaRecorder({ transcript, onTranscriptChange, className }: OralIaRecorderProps) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void; start: () => void } | null>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => WebSpeechRec;
      webkitSpeechRecognition?: new () => WebSpeechRec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      toast.error("La reconnaissance vocale du navigateur n’est pas disponible. Utilisez Chrome ou Edge, ou saisissez le texte à la main.");
      return;
    }
    stop();
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev: WebSpeechRecEvent) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        chunk += ev.results[i][0].transcript;
      }
      if (chunk.trim()) {
        onTranscriptChange((transcript ? `${transcript.trim()} ` : "") + chunk.trim());
      }
    };
    rec.onerror = () => {
      toast.error("Erreur micro / reconnaissance vocale.");
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    toast.message("Écoute… parlez près du micro.");
  }, [onTranscriptChange, stop, transcript]);

  return (
    <div className={cn("space-y-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4", className)}>
      <p className="text-xs font-semibold text-indigo-900">
        Oral — retranscription locale (navigateur). Pour une STT serveur (Whisper), branchez un endpoint dédié côté backend.
      </p>
      <div className="flex flex-wrap gap-2">
        {!listening ? (
          <Button type="button" variant="default" className="bg-indigo-600 hover:bg-indigo-500" onClick={start}>
            <Mic className="mr-2 h-4 w-4" />
            Démarrer l’écoute
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={stop}>
            <Square className="mr-2 h-4 w-4" />
            Arrêter
          </Button>
        )}
      </div>
    </div>
  );
}

type WebSpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: WebSpeechRecEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WebSpeechRecEvent = { resultIndex: number; results: Array<Array<{ transcript: string }>> };
