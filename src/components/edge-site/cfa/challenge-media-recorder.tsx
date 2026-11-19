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

function pickRecorderMime(mode: Mode): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  const candidates =
    mode === "video"
      ? [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4;codecs=avc1,mp4a.40.2",
          "video/mp4",
        ]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionForMime(mime: string, mode: Mode) {
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("webm")) return ".webm";
  return mode === "video" ? ".webm" : ".webm";
}

function baseMime(mime: string | undefined, mode: Mode) {
  if (mime?.startsWith("video/")) return mime.split(";")[0] || "video/webm";
  if (mime?.startsWith("audio/")) return mime.split(";")[0] || "audio/webm";
  return mode === "video" ? "video/webm" : "audio/webm";
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
  const mimeRef = useRef<string | undefined>(undefined);

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
      if (typeof MediaRecorder === "undefined") {
        setError(
          mode === "audio"
            ? "Enregistrement audio non supporté sur ce navigateur. Passe à l’écrit."
            : "Enregistrement vidéo non supporté sur ce navigateur. Passe à l’écrit ou à l’audio.",
        );
        return;
      }

      const mimeType = pickRecorderMime(mode);
      if (mode === "video" && !mimeType) {
        setError("Vidéo non supportée sur ce navigateur. Passe à l’audio ou à l’écrit.");
        return;
      }
      mimeRef.current = mimeType;

      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "audio" ? { audio: true } : { audio: true, video: { facingMode: "user" } },
      );
      streamRef.current = stream;
      if (mode === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        void liveVideoRef.current.play().catch(() => undefined);
      }

      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;
      options.audioBitsPerSecond = 128_000;
      if (mode === "video") options.videoBitsPerSecond = 1_500_000;

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("Enregistrement interrompu. Réessaie ou passe à l’écrit.");
        stop();
      };
      recorder.onstop = async () => {
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const recordedMime = baseMime(
          mimeRef.current || chunksRef.current[0]?.type || recorder.mimeType,
          mode,
        );
        const blob = new Blob(chunksRef.current, { type: recordedMime });
        if (!blob.size) {
          setError("Fichier vide. Réessaie l’enregistrement.");
          setRecording(false);
          return;
        }
        const file = new File(
          [blob],
          `challenge-${mode}-${Date.now()}${extensionForMime(recordedMime, mode)}`,
          { type: recordedMime },
        );
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
      // Request data every second — more reliable for video than 250ms on Safari/Chrome.
      recorder.start(1_000);
      timerRef.current = setInterval(() => {
        const next = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(next);
        if (next >= maxSec) stop();
      }, 250);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        /Permission|NotAllowed|denied/i.test(message)
          ? mode === "audio"
            ? "Micro inaccessible. Autorise l’accès ou passe à l’écrit."
            : "Caméra inaccessible. Autorise l’accès ou passe à l’écrit."
          : mode === "audio"
            ? "Micro inaccessible. Autorise l’accès ou passe à l’écrit."
            : "Caméra inaccessible ou format vidéo non supporté. Passe à l’audio ou à l’écrit.",
      );
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try {
        if (mediaRef.current.state === "recording") mediaRef.current.requestData();
      } catch {
        /* ignore */
      }
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
            <video controls playsInline src={previewUrl} className="aspect-video w-full rounded-xl bg-black" />
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
