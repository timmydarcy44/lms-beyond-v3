"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { NeoVoiceOverlay } from "@/components/beyond-note/neo-voice-overlay";

type TryButtonProps = {
  targetText: string;
  className?: string;
};

const MAX_RECORDING_MS = 15000;
const NEO_COACH_EMAIL = "timdarcypro@gmail.com";

export function TryButton({ targetText, className }: TryButtonProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<number | null>(null);

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<"recording" | "analyzing" | "speaking" | "result">("recording");
  const [score, setScore] = useState<number | null>(null);
  const [neoCoachEnabled, setNeoCoachEnabled] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        const email = data?.user?.email?.toLowerCase();
        setNeoCoachEnabled(email === NEO_COACH_EMAIL);
      } catch (error) {
        console.error("[try-button] Failed to load user", error);
      }
    };
    loadUser();
  }, []);

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    recorderRef.current?.stop();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startRecording = async () => {
    if (recording || loading) return;
    setFeedback(null);
    setTranscription(null);
    setScore(null);
    if (neoCoachEnabled) {
      setOverlayStatus("recording");
      setShowOverlay(true);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await sendRecording(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      timeoutRef.current = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch (error) {
      console.error("[try-button] Microphone permission error", error);
      setFeedback("Micro refusé. Autorise le micro pour t'entraîner.");
      setShowOverlay(false);
    }
  };

  const sendRecording = async (blob: Blob) => {
    setLoading(true);
    if (neoCoachEnabled) {
      setOverlayStatus("analyzing");
    }
    try {
      const file = new File([blob], "speech.webm", { type: blob.type || "audio/webm" });
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("targetText", targetText);

      const response = await fetch("/api/audio/transcribe-and-feedback", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Transcription failed");
      }

      const nextFeedback = data.feedback || "";
      setFeedback(nextFeedback);
      setTranscription(data.transcription || "");
      setScore(typeof data.score === "number" ? data.score : null);
      if (neoCoachEnabled && nextFeedback) {
        await playFeedbackAudio(nextFeedback);
      }
    } catch (error) {
      console.error("[try-button] Failed to transcribe", error);
      setFeedback("Erreur lors de l'analyse. Réessaie.");
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  };

  const playFeedbackAudio = async (text: string) => {
    try {
      setOverlayStatus("speaking");
      const response = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });

      if (!response.ok) {
        throw new Error(`Audio feedback failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setOverlayStatus("result");
      };
    } catch (error) {
      console.error("[try-button] Failed to play feedback", error);
      setOverlayStatus("result");
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={neoCoachEnabled ? startRecording : undefined}
        onMouseDown={!neoCoachEnabled ? startRecording : undefined}
        onMouseUp={!neoCoachEnabled ? stopRecording : undefined}
        onTouchStart={!neoCoachEnabled ? startRecording : undefined}
        onTouchEnd={!neoCoachEnabled ? stopRecording : undefined}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-full border border-[#E8E9F0] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] transition-colors h-9 w-9 ${className || ""}`}
        aria-label="S'entraîner à la prononciation"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className={`h-4 w-4 ${recording ? "text-[#be1354]" : ""}`} />}
      </button>

      {!neoCoachEnabled && feedback ? (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-[#E8E9F0] bg-white shadow-lg p-3 text-xs text-[#374151] z-10">
          {transcription ? (
            <p className="mb-2 text-[11px] text-[#6B7280]">
              <span className="font-semibold">Transcription :</span> {transcription}
            </p>
          ) : null}
          <p>{feedback}</p>
        </div>
      ) : null}

      {neoCoachEnabled ? (
        <NeoVoiceOverlay
          open={showOverlay}
          status={overlayStatus}
          targetText={targetText}
          transcription={transcription}
          score={score}
          onAnalyze={() => {
            if (recording) {
              stopRecording();
              setOverlayStatus("analyzing");
            }
          }}
          onClose={() => setShowOverlay(false)}
        />
      ) : null}
    </div>
  );
}
