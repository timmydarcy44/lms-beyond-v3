"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyNaturalMaleSpeech } from "@/lib/voice/pick-french-male-voice";

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useVoiceCoach() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakResolveRef = useRef<(() => void) | null>(null);
  const enabledRef = useRef(true);
  const voicesReadyRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => {
      voicesReadyRef.current = window.speechSynthesis.getVoices().length > 0;
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    speakResolveRef.current?.();
    speakResolveRef.current = null;
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!enabledRef.current || typeof window === "undefined" || !text.trim()) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      applyNaturalMaleSpeech(utterance);

      setIsSpeaking(true);
      speakResolveRef.current = resolve;

      utterance.onend = () => {
        setIsSpeaking(false);
        speakResolveRef.current = null;
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        speakResolveRef.current = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const listenOnce = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const Ctor = getSpeechRecognition();
      if (!Ctor) {
        resolve("");
        return;
      }

      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);

      const recognition = new Ctor();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = false;

      let transcript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
        resolve(transcript.trim());
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        resolve(transcript.trim());
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    });
  }, []);

  /** Identité stable — ne pas mettre dans les deps d'un useEffect. */
  const cleanup = useCallback(() => {
    enabledRef.current = false;
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    speakResolveRef.current?.();
    speakResolveRef.current = null;
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    enabledRef.current = true;
  }, []);

  return useMemo(
    () => ({
      isSpeaking,
      isListening,
      speak,
      listenOnce,
      stopSpeaking,
      stopListening,
      cleanup,
      reset,
      speechSupported: typeof window !== "undefined" && !!getSpeechRecognition(),
    }),
    [
      isSpeaking,
      isListening,
      speak,
      listenOnce,
      stopSpeaking,
      stopListening,
      cleanup,
      reset,
    ],
  );
}
