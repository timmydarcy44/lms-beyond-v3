"use client";

import { useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";

const MAX_TTS_CHARS = 300;

type AudioButtonProps = {
  text: string;
  voice?: string;
  className?: string;
};

export function AudioButton({ text, voice = "nova", className }: AudioButtonProps) {
  const cacheRef = useRef(new Map<string, string>());
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const input = trimmed.slice(0, MAX_TTS_CHARS);
    const cacheKey = `${voice}:${input}`;

    let url = cacheRef.current.get(cacheKey);
    if (!url) {
      setLoading(true);
      try {
        const response = await fetch("/api/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input, voice }),
        });

        if (!response.ok) {
          let details = "";
          try {
            const data = await response.json();
            details = data?.error ? `: ${data.error}` : "";
          } catch {
            // ignore json parse errors
          }
          throw new Error(`Audio generation failed (${response.status})${details}`);
        }

        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        cacheRef.current.set(cacheKey, url);
      } catch (error) {
        console.error("[audio-button] Failed to generate speech", error);
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      console.error("[audio-button] Playback failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full border border-[#E8E9F0] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] transition-colors h-9 w-9 ${className || ""}`}
      aria-label="Ecouter la prononciation"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
