"use client";

import { useCallback, useRef, useState } from "react";

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

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    speakResolveRef.current?.();
    speakResolveRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!enabledRef.current || typeof window === "undefined" || !text.trim()) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        utterance.rate = 1.05;
        utterance.pitch = 1;

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
    },
    [],
  );

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

      stopListening();
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
  }, [stopListening]);

  const cleanup = useCallback(() => {
    enabledRef.current = false;
    stopSpeaking();
    stopListening();
  }, [stopSpeaking, stopListening]);

  return {
    isSpeaking,
    isListening,
    speak,
    listenOnce,
    stopSpeaking,
    stopListening,
    cleanup,
    speechSupported: typeof window !== "undefined" && !!getSpeechRecognition(),
  };
}
