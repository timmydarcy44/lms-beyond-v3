"use client";

import { useEffect, useRef, useState } from "react";
import { CircleStop, Loader2, Mic, Video } from "lucide-react";

import { AUDIO_MAX_SEC, VIDEO_MAX_SEC } from "@/lib/cfa/admission-challenge";
import { cn } from "@/lib/utils";

type Mode = "audio" | "video";

type Props = {
  mode: Mode;
  busy?: boolean;
  existingUrl?: string | null;
  existingDurationSec?: number;
  onRecorded: (file: File, durationSec: number) => Promise<boolean>;
};

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ChallengeMediaRecorder({
  mode,
  busy,
  existingUrl,
  existingDurationSec,
  onRecorded,
}: Props) {
  const maxSec = mode === "audio" ? AUDIO_MAX_SEC : VIDEO_MAX_SEC;
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);
  const [durationSec, setDurationSec] = useState(existingDurationSec ?? 0);
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setPreviewUrl(existingUrl ?? null);
    setDurationSec(existingDurationSec ?? 0);
  }, [existingUrl, existingDurationSec]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "audio" ? { audio: true } : { audio: true, video: true },
      );
      streamRef.current = stream;
      if (mode === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        void liveVideoRef.current.play();
      }
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? mode === "video"
            ? "video/webm;codecs=vp9,opus"
            : "audio/webm"
          : undefined,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: mode === "video" ? 1_500_000 : undefined,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: mode === "video" ? "video/webm" : "audio/webm",
        });
        const file = new File([blob], `challenge-${mode}-${Date.now()}.webm`, {
          type: blob.type,
        });
        const localUrl = URL.createObjectURL(blob);
        setPreviewUrl(localUrl);
        setDurationSec(duration);
        const ok = await onRecorded(file, duration);
        if (!ok) setError("Enregistrement non enregistré. Réessaie.");
      };
      mediaRef.current = recorder;
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
      recorder.start(250);
      timerRef.current = setInterval(() => {
        const next = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(next);
        if (next >= maxSec) stop();
      }, 250);
    } catch {
      setError(
        mode === "audio"
          ? "Micro inaccessible. Autorise l’accès ou passe à l’écrit."
          : "Caméra inaccessible. Autorise l’accès ou passe à l’écrit.",
      );
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }

  function reset() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDurationSec(0);
    setError("");
  }

  return (
    <div className="space-y-3">
      {mode === "video" && recording ? (
        <video ref={liveVideoRef} muted playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" />
      ) : null}

      {previewUrl && !recording ? (
        <div className="rounded-2xl border border-[#1F2850] bg-[#0E1430] p-4">
          {mode === "audio" ? (
            <audio controls src={previewUrl} className="w-full" />
          ) : (
            <video controls src={previewUrl} className="aspect-video w-full rounded-xl bg-black" />
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[#9AA3BD]">{formatSec(durationSec)}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold text-[#F2F4FA] hover:bg-white/5"
            >
              {mode === "audio" ? "Réenregistrer" : "Refaire"}
            </button>
          </div>
        </div>
      ) : null}

      {!previewUrl || recording ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => (recording ? stop() : void start())}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold",
            recording
              ? "bg-[#F2CF6B] text-[#070C1C]"
              : "bg-white text-[#070C1C] hover:bg-white/90",
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {recording ? (
            <>
              <CircleStop className="h-4 w-4" /> Arrêter · {formatSec(elapsed)}
            </>
          ) : mode === "audio" ? (
            <>
              <Mic className="h-4 w-4" /> Enregistrer (max {Math.floor(maxSec / 60)} min)
            </>
          ) : (
            <>
              <Video className="h-4 w-4" /> Me filmer (max {Math.floor(maxSec / 60)} min)
            </>
          )}
        </button>
      ) : null}

      <p className="text-[12.5px] text-[#6C7593]">1 à 2 minutes suffisent</p>
      {error ? <p className="text-sm text-[#F2CF6B]">{error}</p> : null}
    </div>
  );
}
