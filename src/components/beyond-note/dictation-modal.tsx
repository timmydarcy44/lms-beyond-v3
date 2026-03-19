"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type DictationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (documentId: string) => void;
};

type SpeechRecognitionType = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

export function DictationModal({ isOpen, onClose, onComplete }: DictationModalProps) {
  const router = useRouter();
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    if (!isOpen) return;
    const SpeechRecognitionConstructor: SpeechRecognitionType | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = finalTextRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          final += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      final = final.trim();
      finalTextRef.current = final;
      setFinalText(final);
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorMessage("Permission micro refusée. Autorisez l'accès au micro.");
      } else {
        setErrorMessage("Erreur de dictée vocale. Réessayez.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFinalText("");
      setInterimText("");
      setErrorMessage(null);
      finalTextRef.current = "";
    }
  }, [isOpen]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    setErrorMessage(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setErrorMessage("Impossible de démarrer la dictée.");
    }
  };

  const handleFinish = async () => {
    const text = finalText.trim();
    if (!text) {
      setErrorMessage("Aucun texte détecté.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/beyond-note/upload-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          title: `Dictee du ${new Date().toLocaleDateString("fr-FR")}`,
          source_type: "dictation",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l'enregistrement");
      }
      const documentId = data.document?.id;
      if (documentId) {
        router.push(`/note-app/${documentId}`);
        onComplete?.(documentId);
      }
    } catch {
      setErrorMessage("Impossible d'enregistrer la dictée.");
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const displayText = `${finalText} ${interimText}`.trim();

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-sm uppercase tracking-[0.3em] text-white/50">Dictée vocale</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 text-center">
        {!isSupported ? (
          <p className="text-white/60 text-lg">Non supporté sur ce navigateur</p>
        ) : (
          <>
            <div className="max-w-3xl text-2xl sm:text-3xl leading-relaxed whitespace-pre-wrap">
              {displayText || "Parlez pour commencer la dictée..."}
            </div>
            {errorMessage && (
              <p className="mt-6 text-sm text-rose-400">{errorMessage}</p>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4">
        {isSupported && (
          <button
            onClick={handleToggleListening}
            className={`h-16 w-16 rounded-full flex items-center justify-center border border-white/20 ${
              isListening ? "bg-rose-500/80 animate-pulse" : "bg-white/10"
            }`}
            aria-label="Microphone"
          >
            <Mic className="h-7 w-7" />
          </button>
        )}
        <Button
          onClick={handleFinish}
          disabled={isSaving}
          className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Terminer"
          )}
        </Button>
      </div>
    </div>
  );
}
