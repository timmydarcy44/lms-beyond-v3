"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyNaturalMaleSpeech } from "@/lib/voice/pick-french-male-voice";
import { prepareTextForSpeech } from "@/lib/voice/prepare-text-for-speech";

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export type ListenResult = {
  text: string;
  error?: "unsupported" | "not-allowed" | "no-speech" | "aborted" | "network" | "unknown";
};

function mapRecognitionError(code: string): ListenResult["error"] {
  if (code === "not-allowed" || code === "service-not-allowed") return "not-allowed";
  if (code === "no-speech") return "no-speech";
  if (code === "aborted") return "aborted";
  if (code === "network") return "network";
  return "unknown";
}

export function useVoiceCoach() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakResolveRef = useRef<(() => void) | null>(null);
  const isSpeakingRef = useRef(false);
  const enabledRef = useRef(true);
  const voicesReadyRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

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
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    speakResolveRef.current?.();
    speakResolveRef.current = null;
  }, []);

  const waitUntilIdle = useCallback(async (maxMs = 12000): Promise<void> => {
    const start = Date.now();
    while (isSpeakingRef.current && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 80));
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
    await new Promise((r) => setTimeout(r, 350));
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!enabledRef.current || typeof window === "undefined" || !text.trim()) {
        resolve();
        return;
      }

      const spoken = prepareTextForSpeech(text);
      if (!spoken) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const start = () => {
        const utterance = new SpeechSynthesisUtterance(spoken);
        applyNaturalMaleSpeech(utterance);

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        speakResolveRef.current = resolve;

        const finish = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          speakResolveRef.current = null;
          resolve();
        };

        utterance.onend = finish;
        utterance.onerror = finish;

        window.speechSynthesis.speak(utterance);
      };

      setTimeout(start, 100);
    });
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {
      recognitionRef.current?.stop();
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const listenOnce = useCallback((): Promise<ListenResult> => {
    return new Promise((resolve) => {
      const Ctor = getSpeechRecognition();
      if (!Ctor) {
        resolve({ text: "", error: "unsupported" });
        return;
      }

      try {
        recognitionRef.current?.abort();
      } catch {
        recognitionRef.current?.stop();
      }
      recognitionRef.current = null;

      const recognition = new Ctor();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let transcript = "";
      let settled = false;

      const done = (result: ListenResult) => {
        if (settled) return;
        settled = true;
        setIsListening(false);
        recognitionRef.current = null;
        resolve(result);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        transcript = "";
        for (let i = 0; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (!transcript && event.results.length > 0) {
          const last = event.results[event.results.length - 1];
          transcript = last[0]?.transcript ?? "";
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        done({
          text: transcript.trim(),
          error: mapRecognitionError(event.error),
        });
      };

      recognition.onend = () => {
        done({ text: transcript.trim() });
      };

      recognitionRef.current = recognition;
      setIsListening(true);

      try {
        recognition.start();
      } catch {
        done({ text: "", error: "unknown" });
      }

      window.setTimeout(() => {
        if (!settled && recognitionRef.current) {
          try {
            recognition.stop();
          } catch {
            done({ text: transcript.trim(), error: "aborted" });
          }
        }
      }, 15000);
    });
  }, []);

  const cleanup = useCallback(() => {
    enabledRef.current = false;
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    try {
      recognitionRef.current?.abort();
    } catch {
      recognitionRef.current?.stop();
    }
    recognitionRef.current = null;
    speakResolveRef.current?.();
    speakResolveRef.current = null;
    isSpeakingRef.current = false;
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
      waitUntilIdle,
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
      waitUntilIdle,
      stopSpeaking,
      stopListening,
      cleanup,
      reset,
    ],
  );
}
