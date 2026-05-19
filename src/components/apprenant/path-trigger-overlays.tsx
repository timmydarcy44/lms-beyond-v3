"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Loader2, Mic, Pause, Play, Video, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LearnerPathTrigger =
  | {
      kind: "case_study";
      pathId: string;
      stepId: string;
      prevCourseId: string | null;
      minScore: number;
      context: string;
      consigne: string;
    }
  | {
      kind: "oral";
      pathId: string;
      stepId: string;
      prevCourseId: string | null;
      minScore: number;
    }
  | {
      kind: "video";
      pathId: string;
      stepId: string;
      prevCourseId: string | null;
      minScore: number;
    }
  | {
      kind: "pdf";
      pathId: string;
      stepId: string;
      prevCourseId: string | null;
      minScore: number;
    };

/** Texte lisible à voix haute (retire markdown courant). */
function textForSpeech(raw: string) {
  return String(raw ?? "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Voix supportées par l’API OpenAI `audio.speech` (tts-1 / tts-1-hd). Voir la doc officielle Text-to-Speech. */
const OPENAI_TTS_VOICE_OPTIONS = [
  { id: "nova", label: "Nova — claire, chaleureuse (défaut)" },
  { id: "shimmer", label: "Shimmer — douce, posée" },
  { id: "coral", label: "Coral — ton conversationnel" },
  { id: "sage", label: "Sage — calme, pédagogique" },
  { id: "verse", label: "Verse — expressive, narrative" },
  { id: "ballad", label: "Ballad — posée, storytelling" },
  { id: "ash", label: "Ash — neutre, sobre" },
  { id: "alloy", label: "Alloy — équilibrée" },
  { id: "echo", label: "Echo — masculine, nette" },
  { id: "fable", label: "Fable — légèrement britannique" },
  { id: "onyx", label: "Onyx — grave, autoritaire" },
] as const;

const DEFAULT_ORAL_TTS_VOICE = "nova";
const ORAL_TTS_VOICE_STORAGE_KEY = "learner-path-oral-tts-voice";

function normalizeOralTtsVoice(id: string) {
  return OPENAI_TTS_VOICE_OPTIONS.some((v) => v.id === id) ? id : DEFAULT_ORAL_TTS_VOICE;
}

function useSpeechPlayer(voice: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "paused">("idle");

  const cleanupAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = "";
      a.onended = null;
      a.onerror = null;
    }
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const safeSetPhase = useCallback((next: "idle" | "loading" | "playing" | "paused") => {
    if (mountedRef.current) setPhase(next);
  }, []);

  const stop = useCallback(() => {
    cleanupAudio();
    safeSetPhase("idle");
  }, [cleanupAudio, safeSetPhase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const playText = useCallback(
    async (raw: string) => {
      const t = textForSpeech(raw);
      if (!t) return;
      stop();
      safeSetPhase("loading");
      try {
        const res = await fetch("/api/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t.slice(0, 4500), voice }),
        });
        if (!mountedRef.current) return;
        if (!res.ok) throw new Error("TTS_FAILED");
        const buf = await res.arrayBuffer();
        if (!mountedRef.current) return;
        const blob = new Blob([buf], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanupAudio();
          safeSetPhase("idle");
        };
        audio.onerror = () => {
          cleanupAudio();
          safeSetPhase("idle");
        };
        try {
          await audio.play();
          safeSetPhase("playing");
        } catch {
          cleanupAudio();
          safeSetPhase("idle");
        }
      } catch {
        safeSetPhase("idle");
      }
    },
    [voice, stop, cleanupAudio, safeSetPhase],
  );

  const togglePause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (phase === "playing") {
      a.pause();
      safeSetPhase("paused");
    } else if (phase === "paused") {
      void a.play().then(
        () => safeSetPhase("playing"),
        () => safeSetPhase("idle"),
      );
    }
  }, [phase, safeSetPhase]);

  return { playText, stop, togglePause, phase };
}

async function blobToFile(blob: Blob, filename: string): Promise<File> {
  return new File([blob], filename, { type: blob.type || "application/octet-stream" });
}

/** Extraits JPEG espacés dans la durée pour analyse vision (démo écran, Glide, etc.). */
async function extractVideoPreviewFrames(blob: Blob, maxFrames = 5): Promise<Blob[]> {
  const url = URL.createObjectURL(blob);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("VIDEO_LOAD"));
      setTimeout(() => reject(new Error("VIDEO_TIMEOUT")), 18000);
    });
    const dur = Math.max(0.5, video.duration || 1);
    const ratios = [0.12, 0.32, 0.52, 0.72, 0.88].slice(0, maxFrames);
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return [];
    const scale = Math.min(1, 960 / Math.max(vw, vh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const out: Blob[] = [];
    for (const r of ratios) {
      const t = Math.min(Math.max(0.08, dur * r), dur - 0.08);
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        setTimeout(() => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        }, 2000);
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.72),
      );
      if (jpeg && jpeg.size > 0) out.push(jpeg);
    }
    return out;
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}

function MarkdownBlock({ text, className }: { text: string; className?: string }) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  return (
    <div className={cn("max-w-none text-white/85 [&_a]:text-sky-300 [&_a]:underline", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-white">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-white">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold text-white">{children}</h4>,
        }}
      >
        {t}
      </ReactMarkdown>
    </div>
  );
}

export function LearnerTriggerCTA({
  trigger,
  satisfied,
  disabled,
  className,
}: {
  trigger: LearnerPathTrigger;
  satisfied: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [drillAnswers, setDrillAnswers] = useState<string[]>([]);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[] | null>(null);
  const [flashBusy, setFlashBusy] = useState(false);
  const [flashError, setFlashError] = useState<string | null>(null);
  type OralPresentationPhase = "record" | "feedback" | "questions" | "complete";
  const [oralPresentationPhase, setOralPresentationPhase] = useState<OralPresentationPhase>("record");
  const [ttsVoice, setTtsVoice] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_ORAL_TTS_VOICE;
    try {
      return normalizeOralTtsVoice(localStorage.getItem(ORAL_TTS_VOICE_STORAGE_KEY) || DEFAULT_ORAL_TTS_VOICE);
    } catch {
      return DEFAULT_ORAL_TTS_VOICE;
    }
  });
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback?: string;
    transcript?: string;
    followUpQuestion?: string | null;
    reviewQuestions?: string[];
    chaptersToReview?: string[];
  } | null>(null);

  const title = useMemo(() => {
    if (trigger.kind === "case_study") return "Étude de cas";
    if (trigger.kind === "oral") return "Présentation orale";
    if (trigger.kind === "video") return "Présentation vidéo";
    return "Dépôt PDF";
  }, [trigger.kind]);

  const introText = useMemo(() => {
    if (trigger.kind === "oral") {
      return "Tu es prêt pour me décrire ce que tu as appris ? Clique sur « micro », enregistre puis envoie. Tu recevras un retour au centre de l’écran avec les chapitres à revoir, puis un bouton pour passer aux questions : elles sont uniquement écrites (pas de réponse orale aux questions). Un envoi regroupe toutes tes réponses pour une nouvelle évaluation. Tu peux aussi générer dix flashcards si besoin.";
    }
    if (trigger.kind === "video") {
      return "Enregistre ta démo (écran + micro conseillé). Des images clés de la vidéo sont envoyées pour analyse : montre bien l’interface ou l’automation. Après le retour, les questions sont uniquement écrites ; pas de nouvel enregistrement oral pour y répondre.";
    }
    if (trigger.kind === "pdf") {
      return "Dépose ton PDF. Après vérification automatique, la suite se débloque si c’est validé.";
    }
    return "Ouvre l'étude de cas pour rédiger et envoyer ta réponse.";
  }, [trigger.kind]);

  /** Version courte pour le premier TTS (moins de latence réseau). Le bouton lecture relance le texte complet via `ttsCue`. */
  const introTtsQuick = useMemo(() => {
    const t = introText.trim();
    const dot = t.search(/[.!?]/);
    if (dot >= 30 && dot <= 200) return t.slice(0, dot + 1).trim();
    return t.slice(0, 200).trim() + (t.length > 200 ? "…" : "");
  }, [introText]);

  useEffect(() => {
    try {
      localStorage.setItem(ORAL_TTS_VOICE_STORAGE_KEY, normalizeOralTtsVoice(ttsVoice));
    } catch {
      /* ignore */
    }
  }, [ttsVoice]);

  const { playText, stop: stopSpeech, togglePause, phase: speechPhase } = useSpeechPlayer(ttsVoice);
  const isOralLike = trigger.kind === "oral" || trigger.kind === "video";

  const reviewQuestionList = useMemo(() => {
    if (!result || result.passed) return [];
    const rq = Array.isArray(result.reviewQuestions)
      ? result.reviewQuestions.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 5)
      : [];
    if (rq.length > 0) return rq;
    const fq = result.followUpQuestion?.trim();
    return fq ? [fq] : [];
  }, [result]);

  /** Flashcards uniquement après échec définitif (plus de questions écrites en attente). */
  const showFlashcardsRemediation = useMemo(() => {
    if (!result || result.passed || !trigger.prevCourseId) return false;
    if (!isOralLike) return false;
    if (reviewQuestionList.length > 0) return false;
    return true;
  }, [result, trigger.prevCourseId, reviewQuestionList.length, isOralLike]);

  const ttsCue = useMemo(() => {
    if (!isOralLike) return introText;
    if (result?.passed || oralPresentationPhase === "complete") {
      return "Félicitations, ta présentation est validée. Tu peux fermer cette fenêtre.";
    }
    if (oralPresentationPhase === "questions" && result && reviewQuestionList.length > 0) {
      const i = drillAnswers.length;
      return `Question ${i + 1} sur ${reviewQuestionList.length}. ${reviewQuestionList[i] ?? ""}`;
    }
    if (result?.feedback && oralPresentationPhase !== "questions") {
      return `Retour sur ta prestation. ${textForSpeech(result.feedback).slice(0, 2000)}`;
    }
    return introText;
  }, [isOralLike, result, reviewQuestionList, drillAnswers.length, introText, oralPresentationPhase]);

  const barHeadline = useMemo(() => {
    if (!isOralLike) return { title: title, subtitle: "" as string };
    if (result?.passed || oralPresentationPhase === "complete") {
      return { title: "Validé", subtitle: "Parcours débloqué." };
    }
    if (oralPresentationPhase === "feedback") {
      return { title: "Retour", subtitle: "Lis le bloc central, puis passe aux questions si besoin." };
    }
    if (oralPresentationPhase === "questions" && reviewQuestionList.length > 0) {
      const i = drillAnswers.length;
      return {
        title: `Question ${i + 1} / ${reviewQuestionList.length}`,
        subtitle: reviewQuestionList[i] ?? "",
      };
    }
    return { title: "Consigne", subtitle: introText };
  }, [isOralLike, result, reviewQuestionList, drillAnswers.length, introText, title, oralPresentationPhase]);

  /** Texte affiché au centre (lecture DYS) : cohérent avec ce que dicte l’IA, version complète pour l’intro. */
  const readAlongMainText = useMemo(() => {
    if (!isOralLike) return "";
    if (oralPresentationPhase === "record" && !result) return introText;
    if (oralPresentationPhase === "complete" || result?.passed) return ttsCue;
    if (oralPresentationPhase === "feedback") {
      const ch = (result?.chaptersToReview ?? []).filter(Boolean);
      const chLine = ch.length ? `À reprendre — titres du cours : ${ch.join(" · ")}` : "";
      const fb = result?.feedback?.trim() ? textForSpeech(result.feedback) : "";
      return [chLine, fb].filter(Boolean).join("\n\n") || introText;
    }
    if (oralPresentationPhase === "questions" && reviewQuestionList.length > 0) {
      if (drillAnswers.length >= reviewQuestionList.length) {
        return "Envoi de tes réponses écrites en cours…";
      }
      const i = drillAnswers.length;
      const q = reviewQuestionList[i] ?? "";
      return `Question ${i + 1} sur ${reviewQuestionList.length}\n\n${q}\n\nRéponds uniquement par écrit dans la zone prévue.`;
    }
    return introText;
  }, [isOralLike, result, reviewQuestionList, drillAnswers.length, introText, ttsCue, oralPresentationPhase]);

  useEffect(() => {
    if (!open || !isOralLike) return;
    if (oralPresentationPhase !== "record") return;
    if (result) return;
    const id = window.setTimeout(() => {
      void playText(introTtsQuick);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, isOralLike, result, introTtsQuick, playText, oralPresentationPhase]);

  useEffect(() => {
    if (!open || !isOralLike || !result || result.passed) return;
    if (oralPresentationPhase !== "questions") return;
    if (reviewQuestionList.length === 0) return;
    const t = `Question ${drillAnswers.length + 1} sur ${reviewQuestionList.length}. ${reviewQuestionList[drillAnswers.length] ?? ""}`;
    const id = window.setTimeout(() => {
      void playText(t);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, isOralLike, result, oralPresentationPhase, reviewQuestionList, drillAnswers.length, playText]);

  // Audio recording (oral)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state !== "inactive") mr.stop();
  }, []);

  const resetToRecording = useCallback(() => {
    stopSpeech();
    setResult(null);
    setOralPresentationPhase("record");
    setFollowUpDraft("");
    setDrillAnswers([]);
    setFlashcards(null);
    setFlashError(null);
  }, [stopSpeech]);

  const startAudioRecording = useCallback(async () => {
    if (oralPresentationPhase !== "record") return;
    setResult(null);
    setFollowUpDraft("");
    setDrillAnswers([]);
    setFlashcards(null);
    setFlashError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      mediaRecorderRef.current = mr;
      setRecording(true);
      mr.start();
    } catch {
      setRecording(false);
    }
  }, [oralPresentationPhase]);

  const submitRecordedMedia = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      stopRecording();
      await new Promise((r) => setTimeout(r, 250));
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "application/octet-stream" });
      const isVideo = trigger.kind === "video";
      const file = await blobToFile(blob, isVideo ? "presentation.webm" : "oral.webm");

      const fd = new FormData();
      fd.set("audio", file);
      if (isVideo) {
        fd.set("submissionType", "video");
        const frames = await extractVideoPreviewFrames(blob);
        frames.forEach((frameBlob, i) => {
          fd.append(`visionFrame${i}`, frameBlob, `frame-${i}.jpg`);
        });
      }
      fd.set("pathId", trigger.pathId);
      fd.set("stepId", trigger.stepId);
      fd.set("minScore", String(trigger.minScore));
      if (trigger.prevCourseId) fd.set("prevCourseId", trigger.prevCourseId);

      const res = await fetch("/api/path-triggers/submit-oral", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as {
        passed?: unknown;
        score?: unknown;
        feedback?: unknown;
        transcript?: unknown;
        followUpQuestion?: unknown;
        reviewQuestions?: unknown;
        chaptersToReview?: unknown;
      };
      if (!res.ok) throw new Error(String((json as { error?: string })?.error ?? "SUBMIT_FAILED"));
      const rqRaw = Array.isArray(json?.reviewQuestions) ? json.reviewQuestions : [];
      const fromArr = rqRaw
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
        .slice(0, 5);
      const fq =
        typeof json?.followUpQuestion === "string" && json.followUpQuestion.trim().length > 0
          ? json.followUpQuestion.trim()
          : null;
      const mergedRq = fromArr.length > 0 ? fromArr : fq ? [fq] : [];
      const chRaw = Array.isArray(json?.chaptersToReview) ? json.chaptersToReview : [];
      const chaptersToReview = chRaw
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
        .slice(0, 10);
      setResult({
        score: Number(json?.score ?? 0),
        passed: Boolean(json?.passed),
        feedback: String(json?.feedback ?? ""),
        transcript: String(json?.transcript ?? ""),
        reviewQuestions: mergedRq,
        followUpQuestion: mergedRq[0] ?? null,
        chaptersToReview,
      });
      setFollowUpDraft("");
      setDrillAnswers([]);
      setFlashcards(null);
      setFlashError(null);
      if (Boolean(json?.passed)) {
        setOralPresentationPhase("complete");
        router.refresh();
      } else {
        setOralPresentationPhase("feedback");
      }
    } finally {
      setBusy(false);
    }
  }, [busy, stopRecording, trigger, router]);

  const submitWrittenSupplement = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (busy || !result?.transcript) return;
      if (trimmed.length < 15) return;
      if (trigger.kind !== "oral" && trigger.kind !== "video") return;
      setBusy(true);
      try {
        const fd = new FormData();
        fd.set("pathId", trigger.pathId);
        fd.set("stepId", trigger.stepId);
        fd.set("minScore", String(trigger.minScore));
        if (trigger.prevCourseId) fd.set("prevCourseId", trigger.prevCourseId);
        fd.set("priorTranscript", result.transcript);
        fd.set("textSupplement", trimmed);
        if (trigger.kind === "video") fd.set("submissionType", "video");

        const res = await fetch("/api/path-triggers/submit-oral", { method: "POST", body: fd });
        const json = (await res.json().catch(() => ({}))) as {
          passed?: unknown;
          score?: unknown;
          feedback?: unknown;
          transcript?: unknown;
          followUpQuestion?: unknown;
          reviewQuestions?: unknown;
        };
        if (!res.ok) throw new Error(String((json as { error?: string })?.error ?? "SUBMIT_FAILED"));
        const rqAfter = Array.isArray(json?.reviewQuestions)
          ? (json.reviewQuestions as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 5)
          : [];
        setResult((prev) => ({
          score: Number(json?.score ?? 0),
          passed: Boolean(json?.passed),
          feedback: String(json?.feedback ?? ""),
          transcript: prev?.transcript ?? String(json?.transcript ?? ""),
          reviewQuestions: rqAfter,
          followUpQuestion: null,
          chaptersToReview: prev?.chaptersToReview ?? [],
        }));
        setFollowUpDraft("");
        setDrillAnswers([]);
        setFlashcards(null);
        setFlashError(null);
        if (Boolean(json?.passed)) {
          setOralPresentationPhase("complete");
          router.refresh();
        } else {
          setOralPresentationPhase("feedback");
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, result?.transcript, trigger, router],
  );

  const loadReviewFlashcards = useCallback(async () => {
    const courseId = trigger.prevCourseId;
    if (!courseId || flashBusy) return;
    setFlashBusy(true);
    setFlashError(null);
    try {
      const res = await fetch("/api/path-triggers/generate-oral-review-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = (await res.json().catch(() => ({}))) as { cards?: unknown; error?: string };
      if (!res.ok) throw new Error(String(json?.error ?? "FLASH_FAILED"));
      const raw = Array.isArray(json?.cards) ? json.cards : [];
      const cards = raw
        .map((row) => ({
          front: String((row as { front?: unknown })?.front ?? "").trim(),
          back: String((row as { back?: unknown })?.back ?? "").trim(),
        }))
        .filter((c) => c.front && c.back);
      setFlashcards(cards.length > 0 ? cards.slice(0, 10) : null);
      if (cards.length === 0) setFlashError("Aucune carte reçue.");
    } catch (e) {
      setFlashError(e instanceof Error ? e.message : "Erreur");
      setFlashcards(null);
    } finally {
      setFlashBusy(false);
    }
  }, [trigger.prevCourseId, flashBusy]);

  const startCaptureRecording = useCallback(async () => {
    if (trigger.kind !== "video") return;
    if (oralPresentationPhase !== "record") return;
    setResult(null);
    setFollowUpDraft("");
    setDrillAnswers([]);
    setFlashcards(null);
    setFlashError(null);
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      micStream = null;
    }

    const tracks = [...displayStream.getTracks(), ...(micStream ? micStream.getAudioTracks() : [])];
    const combined = new MediaStream(tracks);

    const mr = new MediaRecorder(combined, { mimeType: "video/webm;codecs=vp8,opus" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      tracks.forEach((t) => t.stop());
      setRecording(false);
    };
    mediaRecorderRef.current = mr;
    setRecording(true);
    mr.start();
  }, [trigger.kind, oralPresentationPhase]);

  const submitPdf = useCallback(
    async (file: File) => {
      if (busy) return;
      setBusy(true);
      setResult(null);
      try {
        const fd = new FormData();
        fd.set("pdf", file);
        fd.set("pathId", trigger.pathId);
        fd.set("stepId", trigger.stepId);
        fd.set("minScore", String(trigger.minScore));
        if (trigger.prevCourseId) fd.set("prevCourseId", trigger.prevCourseId);

        const res = await fetch("/api/path-triggers/submit-pdf", { method: "POST", body: fd });
        const json = (await res.json().catch(() => ({}))) as {
          error?: unknown;
          score?: unknown;
          passed?: unknown;
          feedback?: unknown;
        };
        if (!res.ok) throw new Error(String(json?.error ?? "SUBMIT_FAILED"));
        setResult({
          score: Number(json?.score ?? 0),
          passed: Boolean(json?.passed),
          feedback: String(json?.feedback ?? ""),
        });
        if (Boolean(json?.passed)) {
          router.refresh();
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, trigger, router],
  );

  const triggerButton = (
    <Button
      type="button"
      disabled={Boolean(disabled)}
      onClick={() => {
        setOpen(true);
      }}
      className={cn(
        "rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/18",
        className,
      )}
    >
      {trigger.kind === "oral" ? <Mic className="mr-2 h-4 w-4" /> : null}
      {trigger.kind === "video" ? <Video className="mr-2 h-4 w-4" /> : null}
      {trigger.kind === "pdf" ? <FileUp className="mr-2 h-4 w-4" /> : null}
      {trigger.kind === "case_study" ? "Ouvrir" : satisfied ? "Rejouer" : "Démarrer"}
    </Button>
  );

  if (trigger.kind === "case_study") {
    const qs = new URLSearchParams({
      kind: "case_study",
      pathId: trigger.pathId,
      stepId: trigger.stepId,
      minScore: String(trigger.minScore),
      ...(trigger.prevCourseId ? { prevCourseId: trigger.prevCourseId } : {}),
    });
    if (trigger.context.trim()) qs.set("context", trigger.context);
    if (trigger.consigne.trim()) qs.set("consigne", trigger.consigne);
    return (
      <Link
        href={`/dashboard/student/tools/drive/new?${qs.toString()}`}
        className={cn("inline-flex", disabled ? "pointer-events-none opacity-50" : "")}
      >
        <span className={cn("inline-flex", className)}>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/18">
            Ouvrir
          </span>
        </span>
      </Link>
    );
  }

  const showAnalysisOverlay =
    busy && (trigger.kind === "oral" || trigger.kind === "video" || trigger.kind === "pdf");
  const analysisTitle =
    trigger.kind === "pdf"
      ? "Nous analysons ton document, merci de patienter quelques secondes."
      : "Nous analysons ta présentation, merci de patienter quelques secondes.";

  return (
    <>
      {triggerButton}
      {showAnalysisOverlay ? (
        <div className="fixed inset-0 z-[320] flex flex-col items-center justify-center gap-4 bg-zinc-950/70 px-8 text-center backdrop-blur-md">
          <Loader2 className="h-10 w-10 animate-spin text-[#00C6FF]" aria-hidden />
          <p className="max-w-md text-sm font-medium text-white">{analysisTitle}</p>
          <p className="max-w-sm text-xs text-white/55">
            {trigger.kind === "pdf"
              ? "La lecture et la vérification peuvent prendre quelques secondes selon la taille du fichier."
              : "La transcription et l&apos;évaluation peuvent prendre un peu de temps selon la durée de l&apos;enregistrement."}
          </p>
        </div>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v && (recording || busy)) return;
          setOpen(v);
          if (!v) {
            stopSpeech();
            setDrillAnswers([]);
            setFollowUpDraft("");
            setFlashcards(null);
            setFlashError(null);
            setOralPresentationPhase("record");
          }
        }}
      >
        <DialogContent
          className="relative !top-4 !mt-0 flex max-h-[calc(100dvh-7.5rem)] !translate-y-0 flex-col gap-0 overflow-hidden border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-3xl"
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (t?.closest?.("[data-oral-player-bar]")) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (t?.closest?.("[data-oral-player-bar]")) e.preventDefault();
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute -left-[18%] -top-[25%] h-[min(70vmin,520px)] w-[min(70vmin,520px)] rounded-full bg-[#00C6FF]/[0.18] blur-[100px]" />
            <div className="absolute -right-[12%] top-[20%] h-[min(55vmin,420px)] w-[min(55vmin,420px)] rounded-full bg-[#0072FF]/[0.14] blur-[90px]" />
            <div className="absolute bottom-[-20%] left-[25%] h-[min(60vmin,480px)] w-[min(60vmin,480px)] rounded-full bg-cyan-300/[0.08] blur-[110px]" />
            <div className="absolute left-[40%] top-[45%] h-[min(35vmin,260px)] w-[min(35vmin,260px)] rounded-full bg-white/[0.04] blur-[80px]" />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-white/10 px-6 pb-3 pt-5">
              <DialogHeader>
                <DialogTitle className="text-white">{title}</DialogTitle>
                <DialogDescription className="sr-only">{introText}</DialogDescription>
              </DialogHeader>
            </div>

            {isOralLike ? (
              <div className="relative z-10 shrink-0 border-b border-cyan-500/20 bg-gradient-to-b from-black/40 to-zinc-950/80 px-4 py-4 sm:px-6">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-300/95">
                  Lecture simultanée (voix IA + texte)
                </p>
                <div className="mx-auto mt-3 max-h-[min(36vh,320px)] min-h-[120px] overflow-y-auto rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-center sm:text-left">
                  <p className="whitespace-pre-wrap text-base font-medium leading-[1.55] tracking-tight text-white sm:text-lg">
                    {readAlongMainText}
                  </p>
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-center text-[10px] leading-relaxed text-white/45">
                  Le retour détaillé sur ton oral, la transcription et les questions écrites sont affichés dans la zone
                  fixe <span className="text-sky-200/90">au-dessus du bandeau</span> dès que l&apos;analyse est prête.
                </p>
              </div>
            ) : null}

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4",
                isOralLike ? "pb-32" : "pb-4",
              )}
            >
              {isOralLike ? (
                <details className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 open:bg-black/25">
                  <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Consigne complète (rappel)
                  </summary>
                  <div className="mt-3 text-sm text-white/75">
                    <MarkdownBlock text={introText} />
                  </div>
                </details>
              ) : null}

              {isOralLike && result ? (
                <div className="mb-6 rounded-2xl border border-cyan-500/25 bg-black/35 p-4 sm:p-6">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-300/95 sm:text-left">
                    {result.passed || oralPresentationPhase === "complete" ? "Bilan" : "Analyse de ta présentation"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      Score {result.score}%
                    </span>
                    {result.passed || oralPresentationPhase === "complete" ? (
                      <span className="text-sm font-medium text-emerald-300">Validé — suite du parcours débloquée.</span>
                    ) : (
                      <span className="text-sm font-medium text-amber-200/95">À consolider avant la suite du parcours.</span>
                    )}
                  </div>

                  {result.passed || oralPresentationPhase === "complete" ? (
                    <p className="mt-5 text-center text-sm text-emerald-200/95 sm:text-left">
                      Tu peux fermer cette fenêtre et continuer.
                    </p>
                  ) : oralPresentationPhase === "feedback" ? (
                    <div className="mt-5 space-y-4">
                      {(result.chaptersToReview ?? []).filter(Boolean).length > 0 ? (
                        <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/95">
                            Chapitres à revoir en priorité
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/90">
                            {(result.chaptersToReview ?? [])
                              .filter(Boolean)
                              .map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                      {result.feedback?.trim() ? (
                        <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            Retour pédagogique
                          </p>
                          <div className="mt-2 text-sm text-white/90">
                            <MarkdownBlock text={result.feedback} />
                          </div>
                        </div>
                      ) : null}
                      {result.transcript?.trim() ? (
                        <details className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                            Transcription de ton enregistrement
                          </summary>
                          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-white/85">
                            {result.transcript.trim()}
                          </p>
                        </details>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {!result.passed && reviewQuestionList.length > 0 ? (
                          <Button
                            type="button"
                            className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-white hover:opacity-90"
                            onClick={() => setOralPresentationPhase("questions")}
                          >
                            Passer aux questions
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => resetToRecording()}
                        >
                          Ré-enregistrer
                        </Button>
                      </div>
                      {showFlashcardsRemediation ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                            Révision — 10 flashcards
                          </p>
                          <p className="mt-2 text-xs text-white/60">
                            La validation n&apos;est pas atteinte : révise avec 10 cartes générées à partir du cours, puis tu
                            pourras ré-enregistrer une nouvelle présentation.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-3 rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10"
                            disabled={flashBusy}
                            onClick={() => void loadReviewFlashcards()}
                          >
                            {flashBusy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <BookOpen className="mr-2 h-4 w-4" />
                            )}
                            Générer les 10 flashcards
                          </Button>
                          {flashError ? <p className="mt-2 text-xs text-rose-300">{flashError}</p> : null}
                          {flashcards && flashcards.length > 0 ? (
                            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                              {flashcards.map((c, i) => (
                                <div
                                  key={`${c.front}-${i}`}
                                  className="rounded-lg border border-white/10 bg-zinc-900/80 p-2.5 text-sm"
                                >
                                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                                    Carte {i + 1}/10
                                  </div>
                                  <div className="mt-1 font-medium text-white">{c.front}</div>
                                  <div className="mt-1.5 border-t border-white/10 pt-1.5 text-xs text-white/75">{c.back}</div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {!result.passed && reviewQuestionList.length === 0 && !trigger.prevCourseId ? (
                        <p className="text-xs text-white/55">
                          Sans cours lié, les flashcards automatiques ne sont pas disponibles. Réécoute le retour, puis
                          enregistre une nouvelle version pour améliorer ton score.
                        </p>
                      ) : null}
                    </div>
                  ) : oralPresentationPhase === "questions" && !result.passed && reviewQuestionList.length > 0 ? (
                    <div className="mt-5 space-y-4">
                      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/90">
                        Question {drillAnswers.length + 1} / {reviewQuestionList.length}
                      </p>
                      <p className="text-center text-base font-semibold leading-snug text-white sm:text-lg">
                        {reviewQuestionList[drillAnswers.length] ?? ""}
                      </p>
                      <p className="text-center text-xs text-white/50">
                        Réponse uniquement par écrit (pas d&apos;enregistrement vocal pour ces questions).
                      </p>
                      {drillAnswers.length > 0 ? (
                        <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                            Tes réponses
                          </p>
                          <ul className="mt-2 space-y-2 text-xs text-white/80">
                            {drillAnswers.map((a, idx) => (
                              <li key={idx} className="border-l-2 border-sky-500/60 pl-2">
                                <span className="text-white/40">Q{idx + 1}.</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <label className="block">
                        <span className="text-[10px] font-semibold text-white/55">
                          Ta réponse (question {drillAnswers.length + 1})
                        </span>
                        <textarea
                          value={followUpDraft}
                          onChange={(e) => setFollowUpDraft(e.target.value)}
                          rows={4}
                          className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-zinc-900/90 px-3 py-2 text-sm text-white placeholder:text-white/35"
                          placeholder="Écris ta réponse (minimum 12 caractères). Utilise le bouton lecture du bandeau pour réentendre la question."
                        />
                      </label>
                      <Button
                        type="button"
                        className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90 sm:w-auto"
                        disabled={
                          busy ||
                          followUpDraft.trim().length < 12 ||
                          drillAnswers.length >= reviewQuestionList.length
                        }
                        onClick={() => {
                          const t = followUpDraft.trim();
                          if (t.length < 12) return;
                          const idx = drillAnswers.length;
                          if (idx >= reviewQuestionList.length) return;
                          const isLast = idx === reviewQuestionList.length - 1;
                          if (!isLast) {
                            setDrillAnswers((prev) => [...prev, t]);
                            setFollowUpDraft("");
                            return;
                          }
                          const all = [...drillAnswers, t];
                          const block = reviewQuestionList
                            .map((q, i) => `Question ${i + 1} : ${q}\nRéponse : ${all[i] ?? ""}`)
                            .join("\n\n---\n\n");
                          void submitWrittenSupplement(block);
                        }}
                      >
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {drillAnswers.length >= reviewQuestionList.length - 1
                          ? "Envoyer toutes mes réponses"
                          : "Valider et question suivante"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {trigger.kind === "pdf" ? (
                <div className="mb-6">
                  <label className={cn("inline-flex", busy ? "opacity-60" : "")}>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) submitPdf(f);
                      }}
                    />
                    <span className="cursor-pointer rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white hover:opacity-90">
                      {busy ? "Analyse…" : "Choisir un PDF"}
                    </span>
                  </label>
                  <p className="mt-3 text-sm text-white/55">{introText}</p>
                </div>
              ) : null}
            {result && !isOralLike ? (
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  result.passed ? "border-emerald-400/20 bg-emerald-500/10" : "border-amber-400/20 bg-amber-500/10",
                )}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                  Score {result.score}% — {result.passed ? "Validé" : "À améliorer"}
                </div>
                {result.feedback ? (
                  <div className="mt-2 text-sm">
                    <MarkdownBlock text={result.feedback} />
                  </div>
                ) : null}
              </div>
            ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {open &&
        isOralLike &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-[10050] flex max-h-[85dvh] flex-col border-t border-white/10 bg-zinc-950/98 shadow-[0_-16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div
              data-oral-player-bar
              className="shrink-0 bg-zinc-950/98 px-3 py-3 backdrop-blur-md sm:px-6"
              role="region"
              aria-label="Contrôles audio et enregistrement"
            >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00C6FF] to-[#0072FF] shadow-lg">
                  {trigger.kind === "oral" ? (
                    <Mic className="h-6 w-6 text-white" aria-hidden />
                  ) : (
                    <Video className="h-6 w-6 text-white" aria-hidden />
                  )}
                  {recording ? (
                    <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-sky-400/80 ring-offset-2 ring-offset-zinc-950 motion-safe:animate-pulse" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Écoute et enregistrement
                  </p>
                  <p className="truncate text-sm font-semibold text-white">{barHeadline.title}</p>
                  <p className="line-clamp-2 text-xs text-white/55">{barHeadline.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <label className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">Voix OpenAI</span>
                  <select
                    value={ttsVoice}
                    onChange={(e) => {
                      stopSpeech();
                      setTtsVoice(normalizeOralTtsVoice(e.target.value));
                    }}
                    className="h-9 max-w-[11rem] rounded-lg border border-white/15 bg-zinc-900/95 px-2 text-[10px] font-medium text-white"
                    aria-label="Choisir la voix de synthèse vocale"
                  >
                    {OPENAI_TTS_VOICE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15"
                  disabled={speechPhase === "loading"}
                  onClick={() => {
                    if (speechPhase === "playing" || speechPhase === "paused") togglePause();
                    else void playText(ttsCue);
                  }}
                  aria-label={speechPhase === "playing" ? "Pause lecture" : "Lecture voix"}
                >
                  {speechPhase === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : speechPhase === "playing" ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </Button>

                {trigger.kind === "oral" ? (
                  oralPresentationPhase === "record" ? (
                    <>
                      <Button
                        type="button"
                        className="h-11 rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:opacity-90"
                        disabled={recording || busy}
                        onClick={() => startAudioRecording()}
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        Micro
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/12"
                        disabled={!recording || busy}
                        onClick={() => submitRecordedMedia()}
                      >
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Envoyer
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                        disabled={!recording || busy}
                        onClick={() => stopRecording()}
                      >
                        Stop
                      </Button>
                    </>
                  ) : null
                ) : oralPresentationPhase === "record" ? (
                  <>
                    <Button
                      type="button"
                      className="h-11 rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
                      disabled={recording || busy}
                      onClick={() => startCaptureRecording()}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Écran
                    </Button>
                    <Button
                      type="button"
                      className="h-11 rounded-full bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/15"
                      disabled={recording || busy}
                      onClick={() => startAudioRecording()}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Micro
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/12"
                      disabled={!recording || busy}
                      onClick={() => submitRecordedMedia()}
                    >
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Envoyer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                      disabled={!recording || busy}
                      onClick={() => stopRecording()}
                    >
                      Stop
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

