"use client";

import { useEffect, useRef, useState } from "react";
import { PassageButton } from "@/components/open-badges/passage/passage-chrome";

function preferredMime(kind: "video" | "audio") {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) ?? "";
}

async function keepTake(id: string, blob: Blob) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("byound-badge-takes", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("takes");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("takes", "readwrite");
    tx.objectStore("takes").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dropTake(id: string) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("byound-badge-takes", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve) => {
    const tx = db.transaction("takes", "readwrite");
    tx.objectStore("takes").delete(id);
    tx.oncomplete = () => resolve();
  });
}

async function uploadTake(url: string, blob: Blob, name: string) {
  const body = new FormData();
  body.append("file", blob, name);
  let last = "envoi interrompu";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(url, { method: "POST", body, credentials: "include" });
      if (res.ok) return (await res.json()) as { path?: string; transcript?: string };
      last = await res.text();
    } catch (error) {
      last = error instanceof Error ? error.message : last;
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }
  throw new Error(last);
}

export function PassageVideo({
  prompt,
  uploadUrl,
  preview,
  onSubmit,
}: {
  prompt: string;
  uploadUrl: string;
  preview?: boolean;
  onSubmit: (text: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [phase, setPhase] = useState<"ask" | "denied" | "ready" | "prep" | "record" | "review">("ask");
  const [help, setHelp] = useState("");
  const [prep, setPrep] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState(1);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [level, setLevel] = useState(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || phase === "review") return;
    video.srcObject = stream;
    video.muted = true;
    void video.play().catch(() => undefined);
  }, [phase, cameraId, micId]);

  const attach = async (nextCamera = cameraId, nextMic = micId) => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: nextCamera
          ? { deviceId: { exact: nextCamera }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: nextMic ? { deviceId: { exact: nextMic } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => undefined);
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((device) => device.kind === "videoinput"));
      setMics(devices.filter((device) => device.kind === "audioinput"));
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) setCameraId(videoTrack.getSettings().deviceId || nextCamera);
      if (audioTrack) setMicId(audioTrack.getSettings().deviceId || nextMic);
      setPhase((current) => (current === "ask" || current === "denied" ? "ready" : current));
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (streamRef.current !== stream) {
          void context.close();
          return;
        }
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setLevel(Math.min(100, Math.round(average / 1.2)));
        window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      const agent = navigator.userAgent;
      const browser = /Safari/.test(agent) && !/Chrome/.test(agent) ? "Safari" : /Firefox/.test(agent) ? "Firefox" : "Chrome";
      setHelp(
        browser === "Safari"
          ? "Safari : Réglages du site, puis Caméra et Micro, Autoriser. Revenez ici et réessayez."
          : browser === "Firefox"
            ? "Firefox : l'icône à gauche de l'adresse, autoriser la caméra et le micro, puis réessayez."
            : "Chrome : l'icône à gauche de l'adresse, autoriser la caméra et le micro, puis réessayez.",
      );
      setPhase("denied");
    }
  };

  useEffect(() => {
    if (phase !== "prep") return;
    if (prep <= 0) {
      setPhase("record");
      return;
    }
    const timer = window.setTimeout(() => setPrep((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, prep]);

  useEffect(() => {
    if (phase !== "record") return;
    const stream = streamRef.current;
    if (!stream) return;
    const mime = preferredMime("video");
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const next = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      setBlob(next);
      setPreviewUrl(URL.createObjectURL(next));
      setPhase("review");
      void keepTake(`video-${take}`, next);
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value + 1 >= 180) {
          recorder.stop();
          return value + 1;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, take]);

  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  const live = phase !== "review";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] sm:px-6">
      <aside className="space-y-4">
        <section className="rounded-3xl bg-[#15171E] p-5">
          <p className="text-xs text-[#8A8FA3]">Votre consigne</p>
          <p className="mt-3 text-lg font-semibold">{prompt || "Présentez votre démarche face caméra."}</p>
        </section>
        <section className="space-y-2 rounded-3xl bg-[#15171E] p-5 text-sm">
          <p className="flex justify-between"><span className="text-[#8A8FA3]">Durée</span><span>30 s à 3 min</span></p>
          <p className="flex justify-between"><span className="text-[#8A8FA3]">Préparation</span><span>1 minute avant de filmer</span></p>
          <p className="flex justify-between"><span className="text-[#8A8FA3]">Prises</span><span>2 maximum</span></p>
        </section>
        <p className="text-xs text-[#8A8FA3]">
          Votre vidéo n&apos;est vue que par l&apos;expert Byound qui corrige votre badge. Elle n&apos;est jamais publiée.
        </p>
      </aside>
      <section>
        {live ? (
          <div className="relative overflow-hidden rounded-3xl bg-[#15171E]">
            <video ref={videoRef} muted playsInline autoPlay className="aspect-video w-full object-cover [transform:scaleX(-1)]" />
            {phase === "ask" || phase === "denied" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0B0C10]/80 px-6 text-center">
                <p className="text-sm">{help || "Activez la caméra et le micro pour voir l'aperçu."}</p>
                <PassageButton onClick={() => void attach()}>{phase === "denied" ? "Réessayer" : "Activer la caméra et le micro"}</PassageButton>
              </div>
            ) : null}
            {phase === "record" ? (
              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-[#FF4D5E]" aria-live="assertive">
                Enregistrement · {clock} / 03:00
              </div>
            ) : null}
            {phase === "record" ? (
              <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs">Prise {take} sur 2</span>
            ) : null}
            {phase === "prep" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45">
                <p className="text-6xl font-semibold">{prep}</p>
                <PassageButton onClick={() => setPhase("record")} className="mt-4">Commencer maintenant</PassageButton>
              </div>
            ) : null}
            {phase === "record" ? (
              <div className="absolute inset-x-4 bottom-4 h-1.5 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#FF4D5E]" style={{ width: `${Math.min(100, (elapsed / 180) * 100)}%` }} />
              </div>
            ) : null}
          </div>
        ) : (
          <video src={previewUrl} controls className="aspect-video w-full rounded-3xl bg-black" />
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {cameras.length > 0 ? (
            <select
              value={cameraId}
              onChange={(event) => {
                setCameraId(event.target.value);
                void attach(event.target.value, micId);
              }}
              className="rounded-full bg-[#15171E] px-3 py-2 text-xs"
            >
              {cameras.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label || "Caméra"}</option>
              ))}
            </select>
          ) : null}
          {mics.length > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#15171E] px-3 py-2 text-xs">
              Micro
              <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#1E2130]">
                <span className="block h-full bg-[#2FD08A]" style={{ width: `${level}%` }} />
              </span>
            </span>
          ) : null}
          <span className="ml-auto" />
          {phase === "ready" ? (
            <PassageButton onClick={() => { setPrep(60); setElapsed(0); setPhase("prep"); }}>Préparer la prise</PassageButton>
          ) : null}
          {phase === "record" ? (
            <button
              type="button"
              disabled={elapsed < 30}
              onClick={() => recorderRef.current?.stop()}
              className="rounded-full bg-[#FF4D5E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Arrêter
            </button>
          ) : null}
          {phase === "review" ? (
            <>
              <PassageButton
                disabled={sending}
                onClick={() => {
                  if (!blob) return;
                  if (preview) {
                    onSubmit("Essai : vidéo non envoyée.");
                    return;
                  }
                  setSending(true);
                  setError("");
                  void uploadTake(uploadUrl, blob, `prise-${take}.webm`)
                    .then(async (json) => {
                      await dropTake(`video-${take}`);
                      onSubmit(`Vidéo envoyée${json.path ? ` (${json.path})` : ""}${json.transcript ? `\n\nTranscription : ${json.transcript}` : ""}`);
                    })
                    .catch((reason: unknown) => {
                      setSending(false);
                      setError(reason instanceof Error ? reason.message : "L'envoi reprendra. La prise reste sur cet appareil.");
                    });
                }}
              >
                {sending ? "Envoi…" : "Envoyer cette vidéo"}
              </PassageButton>
              {take < 2 ? (
                <button type="button" className="text-sm text-[#B4B8C8]" onClick={() => { setTake(2); setElapsed(0); setBlob(null); setPhase("ready"); }}>
                  Refaire
                </button>
              ) : null}
            </>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-[#F2C15A]">{error}</p> : null}
        <p className="mt-3 text-xs text-[#8A8FA3]">
          Pas de caméra ?{" "}
          <label className="cursor-pointer text-[#C9C2FF]">
            Envoyer un fichier vidéo
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBlob(file);
                setPreviewUrl(URL.createObjectURL(file));
                setPhase("review");
              }}
            />
          </label>
          {help ? <span className="mt-1 block">{help}</span> : null}
        </p>
      </section>
    </div>
  );
}

export function PassageOral({
  prompt,
  uploadUrl,
  preview,
  onSubmit,
}: {
  prompt: string;
  uploadUrl: string;
  preview?: boolean;
  onSubmit: (text: string) => void;
}) {
  const [phase, setPhase] = useState<"prep" | "record" | "done">("prep");
  const [prep, setPrep] = useState(20);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (phase !== "prep" || prep <= 0) return;
    const timer = window.setTimeout(() => setPrep((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, prep]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = preferredMime("audio");
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setPhase("done");
        if (preview) {
          onSubmit("Essai : réponse orale non envoyée.");
          return;
        }
        void uploadTake(uploadUrl, blob, "reponse-orale.webm")
          .then((json) => {
            onSubmit(`Réponse orale envoyée${json.transcript ? `\n\nTranscription : ${json.transcript}` : ""}`);
          })
          .catch(() => setError("L'envoi reprendra. L'enregistrement reste sur cet appareil."));
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setPhase("record");
    } catch {
      setError("Autorisez le micro, puis réessayez.");
    }
  };

  useEffect(() => {
    if (phase !== "record") return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value + 1 >= 90) {
          recorderRef.current?.stop();
          return value + 1;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center sm:px-6">
      <p className="text-xs text-[#8A8FA3]">Question 1 sur 1 · tirée au hasard</p>
      <h2 className="mt-4 text-2xl font-semibold">{prompt || "Décrivez la situation et le geste que vous feriez."}</h2>
      {phase === "prep" ? (
        <div className="mt-8">
          <p className="text-sm text-[#B4B8C8]">Préparation · {prep} s</p>
          <div className="mt-4">
            <PassageButton onClick={() => void start()}>{prep > 0 ? "Commencer maintenant" : "Enregistrer"}</PassageButton>
          </div>
        </div>
      ) : null}
      {phase === "record" ? (
        <div className="mt-8">
          <div className="mx-auto flex h-16 items-end justify-center gap-1" aria-hidden>
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} className="w-1 animate-pulse rounded-full bg-[#6E5BFF]" style={{ height: 12 + ((index * 17) % 40) }} />
            ))}
          </div>
          <p className="mt-4 text-sm" aria-live="polite">
            {clock} / 01:30
          </p>
          <button type="button" onClick={() => recorderRef.current?.stop()} className="mt-4 rounded-full bg-[#FF4D5E] px-4 py-2 text-sm font-semibold text-white">
            Terminer ma réponse
          </button>
        </div>
      ) : null}
      {phase === "done" ? <p className="mt-8 text-sm text-[#B4B8C8]">Envoi de la réponse…</p> : null}
      {error ? <p className="mt-4 text-sm text-[#F2C15A]">{error}</p> : null}
    </div>
  );
}
