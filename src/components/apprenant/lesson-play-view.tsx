'use client';

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

import { LessonSmartAssist } from "@/components/apprenant/lesson-smart-assist";
import { InterviewLessonCard } from "@/components/apprenant/interview-lesson-card";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";
import { CaseStudyWorkspace } from "@/components/apprenant/CaseStudyWorkspace";
import { FlashcardPlayer, type FlashcardItem } from "@/components/beyond-flash/FlashcardPlayer";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { usePomodoro } from "@/components/apprenant/pomodoro-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  groupLessonsForOutline,
  outlineKeysContainingLesson,
} from "@/lib/apprenant/lesson-outline-groups";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  Cone,
  CircleCheck,
  FileText,
  Headphones,
  PlayCircle,
  ClipboardCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  SquareArrowOutUpRight,
  Trophy,
  MessageCircle,
} from "lucide-react";
import type {
  LearnerDetail,
  LearnerFlashcard,
  LearnerLesson,
  LearnerModule,
} from "@/lib/queries/apprenant";
import TestFlow from "@/app/dashboard/student/learning/tests/[slug]/test-flow";
import type { TestQuestion } from "@/hooks/use-test-sessions";
import { normalizeTestQuestions } from "@/lib/tests/normalize-test-questions";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractLinkedQuizTestId = (lesson: any): string | null => {
  if (lesson?.quiz_id) return String(lesson.quiz_id);
  const raw = String(lesson?.description ?? lesson?.content ?? "");
  const match = raw.match(/testId=([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
};

function isInterviewLikeLesson(lesson: unknown): boolean {
  const L = lesson as Record<string, unknown> | null;
  if (!L) return false;
  if (L.kind === "experiential_interview") return true;
  if (String(L.interview_context ?? "").trim()) return true;
  return /entretien\s+exp[eé]rientiel/i.test(String(L.title ?? ""));
}

const extractYouTubeId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/')[2];
        if (id && id.length >= 11) {
          return id.slice(0, 11);
        }
      }
      const v = parsed.searchParams.get('v');
      if (v) {
        return v;
      }
    }

    if (host.includes('youtu.be')) {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0]) {
        return pathParts[0];
      }
    }
  } catch {
    // Fallback to regex below
  }

  const fallbackMatch = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[&?]|\b|$)/);
  return fallbackMatch ? fallbackMatch[1] : null;
};

const CHAPTER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Identifiants à utiliser pour API flashcards + clés localStorage (`flashcards-{course}-{id}`).
 * Fait le pont id snapshot (ex. chapter-…) ↔ UUID chapitre en base.
 */
async function resolveFlashcardStorageScopeIds(
  courseId: string,
  lesson: LearnerLesson,
): Promise<string[]> {
  const ids = new Set<string>();
  ids.add(String(lesson.id));
  const db = lesson.dbChapterId?.trim();
  if (db) ids.add(db);

  const lid = String(lesson.id);
  if (courseId && !CHAPTER_UUID_RE.test(lid)) {
    try {
      const res = await fetch("/api/chapters/find-by-local-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, localChapterId: lid }),
      });
      if (res.ok) {
        const j = (await res.json()) as { chapterId?: string };
        const found = j?.chapterId?.trim();
        if (found && CHAPTER_UUID_RE.test(found)) ids.add(found);
      }
    } catch {
      // ignore
    }
  }
  return [...ids];
}

const LESSON_OUTLINE_COLLAPSED_KEY = "lms-lesson-outline-collapsed";
const LESSON_OUTLINE_EXPANDED_GROUPS_KEY = "lms-lesson-outline-expanded-groups";

function flashcardsFetchUrl(courseId: string, scopeId: string): string {
  const base = `/api/flashcards?courseId=${encodeURIComponent(courseId)}`;
  return `${base}&chapterKey=${encodeURIComponent(scopeId)}`;
}

const normalizeVideoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const videoId = extractYouTubeId(trimmed);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  }

  return trimmed;
};

const stripYoutubeLinkFromContent = (content: string, url: string): string => {
  if (!content || !url) return content;
  let updated = content;

  const escapedUrl = escapeRegExp(url);
  const htmlEncodedUrl = escapeRegExp(url.replace(/&/g, '&amp;'));

  const anchorRegex = new RegExp(
    `<a[^>]*href="[^"]*${escapedUrl}[^"]*"[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  );
  const anchorRegexEncoded = new RegExp(
    `<a[^>]*href="[^"]*${htmlEncodedUrl}[^"]*"[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  );

  updated = updated.replace(anchorRegex, '');
  updated = updated.replace(anchorRegexEncoded, '');

  const plainRegex = new RegExp(escapedUrl, 'g');
  const plainRegexEncoded = new RegExp(htmlEncodedUrl, 'g');

  updated = updated.replace(plainRegex, '');
  updated = updated.replace(plainRegexEncoded, '');

  // Nettoyer les paragraphes vides créés par la suppression
  updated = updated.replace(/<p>\s*<\/p>/g, '');

  return updated.trim();
};

/**
 * Le lecteur dédié affiche déjà la vidéo. Le HTML CMS peut encore contenir iframe / div 16:9 /
 * figure WordPress → même hauteur que le lecteur = gros blanc sous la vidéo du haut.
 */
const stripYoutubeEmbedsFromHtml = (html: string): string => {
  if (!html) return html;
  const hints =
    /youtube\.com|youtu\.be|youtube-nocookie/i.test(html) ||
    /<iframe/i.test(html) ||
    /<embed/i.test(html) ||
    /<object/i.test(html);
  if (!hints) return html;

  let s = html;
  // Toute iframe dont le bloc cite YouTube (embed, watch, shorts, nocookie, youtu.be) — laisse Vimeo etc.
  for (let r = 0; r < 24; r += 1) {
    const next = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, (block) =>
      /youtube\.com|youtu\.be|youtube-nocookie/i.test(block) ? "" : block,
    );
    if (next === s) break;
    s = next;
  }
  s = s.replace(
    /<iframe\b[^>]*(?:youtube\.com|youtu\.be|youtube-nocookie)[^>]*\/>\s*/gi,
    "",
  );
  for (let round = 0; round < 8; round += 1) {
    s = s.replace(
      /<iframe\b[^>]*\b(?:src|data-src)\s*=\s*["'][^"']*(?:youtube\.com|youtu\.be|youtube-nocookie)[^"']*["'][^>]*(?:\/>|>\s*<\/iframe\s*>)/gi,
      "",
    );
  }
  s = s.replace(/<embed\b[^>]*(?:youtube|youtu)[^>]*\/?>/gi, "");
  s = s.replace(/<object\b[^>]*(?:youtube|youtu)[^>]*>[\s\S]*?<\/object\s*>/gi, "");

  for (let i = 0; i < 12; i += 1) {
    const before = s;
    s = s.replace(/<figure\b[^>]*(?:wp-block-embed|is-type-video|wp-block-embed-youtube)[^>]*>[\s\S]*?<\/figure>/gi, "");
    s = s.replace(
      /<div\b[^>]*\bstyle\s*=\s*["'][^"']*padding-bottom\s*:\s*56\.25%[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      "",
    );
    s = s.replace(
      /<div\b[^>]*\bstyle\s*=\s*["'][^"']*height\s*:\s*0[^"']*padding-bottom[^"']*56\.25%[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      "",
    );
    s = s.replace(
      /<div\b[^>]*\bstyle\s*=\s*["'][^"']*padding-bottom[^"']*56\.25%[^"']*height\s*:\s*0[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      "",
    );
    s = s.replace(/<div\b[^>]*>\s*<\/div>/gi, "");
    s = s.replace(/<p\b[^>]*>\s*<\/p>/gi, "");
    if (s === before) break;
  }
  return s.trim();
};

type LessonPlayViewProps = {
  detail: LearnerDetail;
  modules: LearnerModule[];
  activeLesson: LearnerLesson;
  activeModule?: LearnerModule;
  videoSrc?: string | null;
  cardHref: string;
  flashcards: LearnerFlashcard[];
  previousLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  courseId: string;
  courseTitle: string;
};

export function LessonPlayView({
  detail,
  modules,
  activeLesson,
  activeModule,
  videoSrc,
  cardHref,
  flashcards,
  previousLesson,
  nextLesson,
  courseId,
  courseTitle,
}: LessonPlayViewProps) {
  const [mounted, setMounted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showLearningStrategyModal, setShowLearningStrategyModal] = useState(false);
  const [showMobileOutline, setShowMobileOutline] = useState(false);
  const [showCertificationOverlay, setShowCertificationOverlay] = useState(false);
  const [badgeConfig, setBadgeConfig] = useState<any>(null);
  const [caseAiAnalysis, setCaseAiAnalysis] = useState<string | null>(null);
  const [caseAiLoading, setCaseAiLoading] = useState(false);
  const [badgeDraft, setBadgeDraft] = useState({
    caseStudy: "",
    audioNotes: "",
    videoNotes: "",
    deliverableNotes: "",
  });
  const [pitchPreviewUrl, setPitchPreviewUrl] = useState<string | null>(null);
  const [pitchUploadedUrl, setPitchUploadedUrl] = useState<string | null>(null);
  const [pitchRecording, setPitchRecording] = useState(false);
  const [pitchUploading, setPitchUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [badgeSubmitted, setBadgeSubmitted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testFlowMeta, setTestFlowMeta] = useState<{ title: string; minScore: number }>({ title: "", minScore: 70 });
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [quizNavTick, setQuizNavTick] = useState(0);
  const [isBeyondFlashOpen, setIsBeyondFlashOpen] = useState(false);
  const [beyondFlashStorageEpoch, setBeyondFlashStorageEpoch] = useState(0);
  const [fetchedFlashcards, setFetchedFlashcards] = useState<LearnerFlashcard[]>([]);
  const [flashcardScopeIds, setFlashcardScopeIds] = useState<string[]>(() => {
    const s = new Set<string>([String(activeLesson.id)]);
    const db = activeLesson.dbChapterId?.trim();
    if (db) s.add(db);
    return [...s];
  });
  const [outlineCollapsed, setOutlineCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LESSON_OUTLINE_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [outlineCollapsedReady, setOutlineCollapsedReady] = useState(false);
  const [expandedOutlineGroups, setExpandedOutlineGroups] = useState<Set<string>>(() => new Set());
  const { state: pomodoroState } = usePomodoro();
  const router = useRouter();
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();

  useEffect(() => {
    setOutlineCollapsedReady(true);
  }, []);

  useEffect(() => {
    const init = new Set<string>([String(activeLesson.id)]);
    const db = activeLesson.dbChapterId?.trim();
    if (db) init.add(db);
    setFlashcardScopeIds([...init]);

    if (!courseId) return;

    let cancelled = false;
    void resolveFlashcardStorageScopeIds(courseId, activeLesson).then((ids) => {
      if (!cancelled) setFlashcardScopeIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, activeLesson.id, activeLesson.dbChapterId]);

  useEffect(() => {
    if (!outlineCollapsedReady) return;
    try {
      localStorage.setItem(LESSON_OUTLINE_COLLAPSED_KEY, outlineCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [outlineCollapsed, outlineCollapsedReady]);

  useEffect(() => {
    const keysToOpen = new Set<string>();
    for (const module of modules) {
      const groups = groupLessonsForOutline(module.lessons ?? []);
      for (const k of outlineKeysContainingLesson(groups, activeLesson.id)) {
        keysToOpen.add(k);
      }
    }
    if (keysToOpen.size === 0) {
      const first = modules[0]?.lessons?.[0];
      if (first) keysToOpen.add(String(first.parentChapterId || first.id));
    }
    setExpandedOutlineGroups((prev) => {
      const next = new Set(prev);
      for (const k of keysToOpen) next.add(k);
      return next;
    });
  }, [activeLesson.id, modules]);

  useEffect(() => {
    if (!outlineCollapsedReady) return;
    try {
      localStorage.setItem(
        LESSON_OUTLINE_EXPANDED_GROUPS_KEY,
        JSON.stringify([...expandedOutlineGroups]),
      );
    } catch {
      // ignore
    }
  }, [expandedOutlineGroups, outlineCollapsedReady]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LESSON_OUTLINE_EXPANDED_GROUPS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setExpandedOutlineGroups(new Set(parsed.map(String)));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!courseId || flashcards.length > 0) {
      setFetchedFlashcards([]);
      return;
    }
    const ids = flashcardScopeIds.length > 0 ? flashcardScopeIds : [String(activeLesson.id)];
    void Promise.all(
      ids.map((scopeId) =>
        fetch(flashcardsFetchUrl(courseId, scopeId))
          .then((r) => (r.ok ? r.json() : { flashcards: [] }))
          .catch(() => ({ flashcards: [] })),
      ),
    ).then((jsons) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const merged: LearnerFlashcard[] = [];
      for (const j of jsons) {
        const rows = Array.isArray(j?.flashcards) ? j.flashcards : [];
        for (const row of rows) {
          const id = String((row as any).id ?? "");
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push({
            id,
            front: String((row as any).front ?? (row as any).question ?? ""),
            back: String((row as any).back ?? (row as any).answer ?? ""),
          });
        }
      }
      setFetchedFlashcards(merged);
    });
    return () => {
      cancelled = true;
    };
  }, [activeLesson.id, courseId, flashcards.length, flashcardScopeIds.join("\0")]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // ignore
      }
      if (pitchPreviewUrl) {
        URL.revokeObjectURL(pitchPreviewUrl);
      }
    };
  }, [pitchPreviewUrl]);

  const beyondFlashCards = useMemo<FlashcardItem[]>(() => {
    const mergedIn = [...(flashcards ?? []), ...fetchedFlashcards];
    const fromDb = mergedIn.map((c) => ({
      id: String(c.id),
      front: String((c as any).front ?? (c as any).question ?? ""),
      back: String((c as any).back ?? (c as any).answer ?? ""),
    }));

    const scopeSet = new Set(
      flashcardScopeIds.length > 0 ? flashcardScopeIds : [String(activeLesson.id)],
    );
    let fromLocal: FlashcardItem[] = [];
    try {
      const storageKeys = [...new Set([...scopeSet].map((id) => `flashcards-${courseId}-${id}`))];
      for (const k1 of storageKeys) {
        const raw = localStorage.getItem(k1);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        const chunk = parsed
          .filter(
            (f: any) =>
              scopeSet.has(String(f.chapter_id ?? "")) ||
              scopeSet.has(String(f.local_chapter_ref ?? "")),
          )
          .map((f: any, idx: number) => ({
            id: String(f.id ?? `local-${scopeId}-${idx}`),
            front: String(f.front ?? f.question ?? ""),
            back: String(f.back ?? f.answer ?? ""),
          }))
          .filter((x) => x.front.trim() && x.back.trim());
        fromLocal = fromLocal.concat(chunk);
      }
    } catch {
      // ignore
    }

    const merged = [...fromDb, ...fromLocal];
    const seen = new Set<string>();
    return merged.filter((c) => {
      const key = `${c.front}||${c.back}`.trim();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    flashcards,
    fetchedFlashcards,
    courseId,
    activeLesson.id,
    beyondFlashStorageEpoch,
    flashcardScopeIds.join("\0"),
  ]);

  useEffect(() => {
    const bump = () => setBeyondFlashStorageEpoch((n) => n + 1);
    bump();
    const prefixes =
      flashcardScopeIds.length > 0
        ? flashcardScopeIds.map((id) => `flashcards-${courseId}-${id}`)
        : [`flashcards-${courseId}-${String(activeLesson.id)}`];
    const onStorage = (e: StorageEvent) => {
      if (e.key && prefixes.includes(e.key)) bump();
    };
    const onLocalWrite = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (key && prefixes.includes(key)) bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("flashcards-storage-updated", onLocalWrite as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("flashcards-storage-updated", onLocalWrite as EventListener);
    };
  }, [courseId, activeLesson.id, flashcardScopeIds.join("\0")]);

  const handleReturnToOverview = () => {
    if (cardHref) {
      router.push(cardHref);
    } else {
      router.back();
    }
  };
  const handleOpenLearningStrategy = () => {
    setShowLearningStrategyModal(true);
  };

  const openCertificationOverlay = async () => {
    setShowCertificationOverlay(true);
    setBadgeSubmitted(false);
    setBadgeConfig(null);
    try {
      const res = await fetch(`/api/earner/certification/badge?courseId=${encodeURIComponent(courseId)}`);
      const json = await res.json();
      setBadgeConfig(json?.badge ?? null);
    } catch {
      setBadgeConfig(null);
    }
  };

  const fireConfetti = async () => {
    // Best-effort confetti: uses canvas-confetti if available, else fallback particles.
    try {
      const mod: any = await import("canvas-confetti");
      const confetti = mod?.default ?? mod;
      if (typeof confetti === "function") {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#D4AF37", "#C0C0C0", "#7C3AED", "#E50914"],
        });
        return;
      }
    } catch {
      // fallback below
    }
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const particles = Array.from({ length: 120 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height * 0.65,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 12 - 6,
      r: Math.random() * 4 + 2,
      a: 1,
      c: ["#D4AF37", "#C0C0C0", "#7C3AED", "#E50914"][Math.floor(Math.random() * 4)],
    }));
    const start = performance.now();
    const tick = (t: number) => {
      const dt = (t - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += 20 * 0.016;
        p.x += p.vx;
        p.y += p.vy;
        p.a = Math.max(0, 1 - dt / 1.2);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (dt < 1.2) requestAnimationFrame(tick);
      else canvas.remove();
    };
    requestAnimationFrame(tick);
  };
  
  const linkedQuizTestId = useMemo(() => extractLinkedQuizTestId(activeLesson as any), [activeLesson]);
  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons ?? []), [modules]);

  const isExperientialInterviewLesson = useMemo(() => {
    const L = activeLesson as Record<string, unknown>;
    const kind = String(L.kind ?? "");
    if (kind === "experiential_interview") return true;
    if (String(L.interview_context ?? "").trim()) return true;
    return /entretien\s+expérientiel/i.test(String(L.title ?? ""));
  }, [activeLesson]);

  const interviewContext = useMemo(() => {
    const direct = String((activeLesson as any).interview_context ?? "").trim();
    if (direct) return direct;
    if (!isExperientialInterviewLesson) return "";
    const parentId = String((activeLesson as any).parentChapterId ?? "");
    const parts: string[] = [];
    for (const lesson of flatLessons) {
      const L = lesson as Record<string, unknown>;
      if (parentId && String(L.parentChapterId ?? "") !== parentId) continue;
      if (L.id === activeLesson.id) continue;
      if (L.kind === "quiz" || L.kind === "experiential_interview") continue;
      const text = String(L.description ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) parts.push(text);
    }
    return parts.join("\n\n").trim().slice(0, 14_000);
  }, [activeLesson, flatLessons, isExperientialInterviewLesson]);

  const isQuizLesson =
    (activeLesson as any).kind === "quiz" || Boolean(linkedQuizTestId) || (activeLesson as any).type === "quiz";
  const isTestLessonKind = (activeLesson as any).kind === "test" || activeLesson.type === "test";
  const isTestFlow = (isTestLessonKind || isQuizLesson) && !isExperientialInterviewLesson;
  
  // Le mode focus est géré automatiquement par PomodoroFocusManager
  // On garde focusMode pour l'affichage local (masquer les flashcards, etc.)
  useEffect(() => {
    const isPomodoroFocus = pomodoroState.phase === "work" && pomodoroState.isActive;
    setFocusMode(isPomodoroFocus);
  }, [pomodoroState.phase, pomodoroState.isActive]);

  const lessonHref = useMemo(() => (lessonId: string) => `${cardHref}/play/${lessonId}`, [cardHref]);
  const entretienHref = `${lessonHref(activeLesson.id)}/entretien`;

  const isQuizLikeLesson = (lesson: unknown) => {
    const L = lesson as Record<string, unknown> | null;
    if (!L) return false;
    return L.kind === "quiz" || L.type === "quiz" || Boolean(extractLinkedQuizTestId(L));
  };

  const getQuizTestIdFromLesson = (lesson: unknown): string | null => {
    const L = lesson as Record<string, unknown>;
    const linked = extractLinkedQuizTestId(L);
    if (linked) return linked;
    if (L.quiz_id) return String(L.quiz_id);
    if (typeof L.id === "string" && L.id.startsWith("test-")) return L.id.replace(/^test-/, "");
    return null;
  };

  const readQuizDoneClient = (testId: string | null) => {
    if (!testId || typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(`lms:quiz-done:${testId}`) === "1";
    } catch {
      return false;
    }
  };

  const readInterviewDoneClient = (lessonId: string | null) => {
    if (!lessonId || typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(`lms:interview-done:${lessonId}`) === "1";
    } catch {
      return false;
    }
  };

  const activeFlatIdx = useMemo(() => flatLessons.findIndex((l) => l.id === activeLesson.id), [flatLessons, activeLesson.id]);
  const nextFlatLesson = activeFlatIdx >= 0 && activeFlatIdx < flatLessons.length - 1 ? flatLessons[activeFlatIdx + 1] : null;

  const activeQuizTestId = useMemo(() => getQuizTestIdFromLesson(activeLesson), [activeLesson]);

  const quizDoneForActiveLesson = useMemo(() => {
    if (!isQuizLikeLesson(activeLesson)) return true;
    void quizNavTick;
    // Align first client paint with SSR: sessionStorage is unavailable on the server,
    // so reading it before mount causes hydration mismatches on quiz lesson nav links.
    if (!mounted) return false;
    return readQuizDoneClient(activeQuizTestId);
  }, [activeLesson, activeQuizTestId, quizNavTick, mounted]);

  const interviewDoneForActiveLesson = useMemo(() => {
    if (!isInterviewLikeLesson(activeLesson)) return true;
    void quizNavTick;
    if (!mounted) return false;
    return readInterviewDoneClient(activeLesson.id);
  }, [activeLesson, quizNavTick, mounted]);

  const nextLessonIsQuiz = Boolean(nextFlatLesson && isQuizLikeLesson(nextFlatLesson));
  const nextLessonIsInterview = Boolean(nextFlatLesson && isInterviewLikeLesson(nextFlatLesson));
  const accessQuizTestId =
    nextLessonIsQuiz && !isQuizLikeLesson(activeLesson) ? getQuizTestIdFromLesson(nextFlatLesson) : null;
  const accessQuizHref = accessQuizTestId
    ? `/quiz?testId=${encodeURIComponent(accessQuizTestId)}`
    : nextLessonIsQuiz && nextFlatLesson && !isQuizLikeLesson(activeLesson)
      ? lessonHref(nextFlatLesson.id)
      : null;

  const accessInterviewHref =
    nextLessonIsInterview && nextFlatLesson && !isInterviewLikeLesson(activeLesson)
      ? `${lessonHref(nextFlatLesson.id)}/entretien`
      : null;

  const showAccessQuizButton = Boolean(accessQuizHref && nextLessonIsQuiz && !isQuizLikeLesson(activeLesson));
  const showAccessInterviewButton = Boolean(
    accessInterviewHref && nextLessonIsInterview && !isInterviewLikeLesson(activeLesson),
  );
  const showChapterNextButton = Boolean(
    nextLesson &&
      !showAccessQuizButton &&
      !showAccessInterviewButton &&
      (!isQuizLikeLesson(activeLesson) || quizDoneForActiveLesson) &&
      (!isInterviewLikeLesson(activeLesson) || interviewDoneForActiveLesson),
  );

  useEffect(() => {
    const bump = () => setQuizNavTick((n) => n + 1);
    window.addEventListener("focus", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const handleQuizCompletedForNav = (testId: string) => {
    try {
      sessionStorage.setItem(`lms:quiz-done:${testId}`, "1");
    } catch {
      /* ignore */
    }
    setQuizNavTick((n) => n + 1);
  };

  const rawContent = (activeLesson as any).content || (activeLesson as any).description || '';

  useEffect(() => {
    setTestStarted(false);
    setTestQuestions([]);
    setTestFlowMeta({ title: "", minScore: 70 });
  }, [activeLesson.id]);

  const { normalizedVideoSrc, sanitizedContent } = useMemo(() => {
    const urlsInContent = rawContent ? rawContent.match(/https?:\/\/[^\s"'<>]+/g) ?? [] : [];
    const youtubeUrls = urlsInContent.filter((url: string) => Boolean(extractYouTubeId(url)));

    let candidateUrl = videoSrc ?? null;
    let cleanedContent = rawContent;

    if (youtubeUrls.length > 0) {
      cleanedContent = youtubeUrls.reduce(
        (acc: string, url: string) => stripYoutubeLinkFromContent(acc, url),
        cleanedContent,
      );
      if (!candidateUrl) {
        candidateUrl = youtubeUrls[0];
      }
    }

    const normalized = normalizeVideoUrl(candidateUrl);

    // Si candidateUrl n'était pas une URL YouTube, vérifier malgré tout si le contenu contient cette URL pour éviter d'afficher le lien brut
    if (candidateUrl) {
      cleanedContent = stripYoutubeLinkFromContent(cleanedContent, candidateUrl);
    }

    if (
      /<iframe/i.test(cleanedContent) ||
      /<embed/i.test(cleanedContent) ||
      /<object/i.test(cleanedContent) ||
      /youtube\.com|youtu\.be|youtube-nocookie/i.test(cleanedContent)
    ) {
      cleanedContent = stripYoutubeEmbedsFromHtml(cleanedContent);
    }

    return {
      normalizedVideoSrc: normalized,
      sanitizedContent: cleanedContent,
    };
  }, [videoSrc, rawContent]);

  // Déterminer si le contenu est vidéo/audio ou textuel
  const hasMedia = normalizedVideoSrc && (
    normalizedVideoSrc.startsWith('http://') ||
    normalizedVideoSrc.startsWith('https://') ||
    normalizedVideoSrc.includes('.mp4') ||
    normalizedVideoSrc.includes('.webm') ||
    normalizedVideoSrc.includes('.mov') ||
    normalizedVideoSrc.includes('.mp3') ||
    normalizedVideoSrc.includes('.wav') ||
    normalizedVideoSrc.includes('.ogg') ||
    normalizedVideoSrc.includes('.m4a')
  );

  const isMediaContent = Boolean(
    normalizedVideoSrc &&
      ((activeLesson.type === 'video' && hasMedia) ||
        normalizedVideoSrc.includes('.mp4') ||
        normalizedVideoSrc.includes('.webm') ||
        normalizedVideoSrc.includes('.mov') ||
        normalizedVideoSrc.includes('.mp3') ||
        normalizedVideoSrc.includes('.wav') ||
        normalizedVideoSrc.includes('.ogg') ||
        normalizedVideoSrc.includes('.m4a') ||
        normalizedVideoSrc.includes('youtube.com')),
  );

  /** Lecteur YouTube en haut : le HTML du chapitre ne doit plus réserver de hauteur pour un doublon. */
  const hideYoutubeEmbedDupesInBody =
    isMediaContent &&
    Boolean(normalizedVideoSrc) &&
    /youtube\.com|youtu\.be|youtube-nocookie/i.test(String(normalizedVideoSrc));

  const hasTextContent = useMemo(() => {
    const raw = String(sanitizedContent ?? "").trim();
    if (!raw) return false;
    const withoutTags = raw
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return withoutTags.length > 0;
  }, [sanitizedContent]);

  const showBeyondFlashCta = beyondFlashCards.length > 0;

  const isHtmlContent = useMemo(() => /<\/?[a-z][\s\S]*>/i.test(sanitizedContent ?? ""), [sanitizedContent]);

  useEffect(() => {
    const { body } = document;
    if (!body) return;
    const previousOverflow = body.style.overflow;
    if (focusMode) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = previousOverflow || '';
    }
    return () => {
      body.style.overflow = previousOverflow || '';
    };
  }, [focusMode]);

  const toggleOutlineGroup = (key: string) => {
    setExpandedOutlineGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderOutlineLessonLink = (moduleLesson: LearnerLesson) => {
    const isActive = moduleLesson.id === activeLesson.id;
    const isSubchapter = moduleLesson.kind === "subchapter";
    const lessonQuizId = extractLinkedQuizTestId(moduleLesson as any);
    const isQuizOutline = moduleLesson.kind === "quiz" || Boolean(lessonQuizId) || moduleLesson.type === "quiz";
    const isInterviewOutline = isInterviewLikeLesson(moduleLesson);
    const lessonHrefForItem = isInterviewOutline
      ? `${lessonHref(moduleLesson.id)}/entretien`
      : lessonHref(moduleLesson.id);
    const lessonRaw = String((moduleLesson as any).content || (moduleLesson as any).description || "");
    const hasVideoHint =
      moduleLesson.type === "video" ||
      Boolean(extractYouTubeId(lessonRaw)) ||
      /\.(mp4|webm|mov)\b/i.test(lessonRaw);
    const LessonIcon = isQuizOutline
      ? Trophy
      : isInterviewOutline
        ? MessageCircle
        : (moduleLesson as any).kind === "test" || moduleLesson.type === "test"
          ? ClipboardCheck
          : hasVideoHint
            ? PlayCircle
            : FileText;
    const isTestLesson = (moduleLesson as any).kind === "test" || moduleLesson.type === "test";

    return (
      <li key={moduleLesson.id}>
        <Link
          href={lessonHrefForItem}
          prefetch={true}
          className={cn(
            "relative block rounded-2xl border border-transparent py-3 text-sm text-white/75 transition-colors hover:text-white",
            (isSubchapter || isQuizOutline || isInterviewOutline)
              ? "pl-9 pr-4 before:absolute before:left-4 before:top-3 before:bottom-3 before:w-px before:bg-white/10"
              : "px-4",
            isActive && "border-l-2 border-purple-500 border-white/10 bg-white/10 pl-3 text-white",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex flex-shrink-0 items-center justify-center rounded-lg",
                isQuizOutline
                  ? "h-7 w-7 bg-gradient-to-br from-blue-400 via-purple-500 to-fuchsia-500 text-white shadow-sm"
                  : isInterviewOutline
                    ? "h-7 w-7 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-sm"
                    : cn("h-4 w-4 text-white/70", isSubchapter && "text-white/45"),
                isActive && !isQuizOutline && !isInterviewOutline && "text-white",
                isTestLesson && !isQuizOutline && "text-sky-400",
              )}
            >
              <LessonIcon
                className={cn("h-3.5 w-3.5", (isSubchapter || isQuizOutline || isInterviewOutline) && "h-3 w-3")}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "block leading-tight",
                    (isQuizOutline || isInterviewOutline) &&
                      "rounded-lg bg-slate-900/50 px-2 py-1 font-bold text-white ring-1 ring-white/10",
                    !isQuizOutline && !isInterviewOutline && "font-medium text-white",
                    isActive &&
                      !isQuizOutline &&
                      !isInterviewOutline &&
                      "bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text font-bold text-transparent",
                    isActive &&
                      isQuizOutline &&
                      "bg-gradient-to-r from-blue-400 via-purple-500 to-fuchsia-500 bg-clip-text font-bold text-transparent ring-1 ring-white/20",
                    isActive &&
                      isInterviewOutline &&
                      "bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 bg-clip-text font-bold text-transparent ring-1 ring-white/20",
                  )}
                >
                  {moduleLesson.title}
                </span>
                {isQuizOutline ? (
                  <span className="inline-flex items-center rounded-full border border-indigo-300/40 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-100">
                    Quiz
                  </span>
                ) : null}
                {isInterviewOutline ? (
                  <span className="inline-flex items-center rounded-full border border-violet-300/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">
                    Entretien
                  </span>
                ) : null}
                {isTestLesson ? (
                  <span className="inline-flex items-center rounded-full border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                    Évaluation
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-white/55">{moduleLesson.duration}</span>
            </div>
          </div>
        </Link>
      </li>
    );
  };

  const renderOutline = () => (
    <div className="space-y-5 font-['SF_Pro_Display',_sans-serif] text-white">
      <div className="text-white">
        <p className="text-xs uppercase tracking-[0.3em]">Sommaire</p>
        <h2 className="text-lg font-semibold md:text-2xl">{detail.title}</h2>
        <p className="mt-1 text-xs text-white/70">Naviguez librement entre les chapitres</p>
      </div>
      <div className="space-y-4">
        {modules.map((module) => {
          const isModuleActive = module.id === activeModule?.id;
          const groups = groupLessonsForOutline(module.lessons ?? []);
          return (
            <div
              key={module.id}
              className={cn(
                "space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition text-white",
                isModuleActive && "border-white/20 shadow-sm",
              )}
            >
              <div className="mb-4">
                <div className="text-base font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {module.title}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs uppercase tracking-wide text-white/70">
                  <span className="text-white/70">Chapitres</span>
                  <span>{module.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {groups.map((group) => {
                  const hasChildren = group.items.length > 0;
                  const isExpanded = expandedOutlineGroups.has(group.key);
                  const chapterLesson = group.chapter;
                  const groupHasActive =
                    chapterLesson?.id === activeLesson.id ||
                    group.items.some((i) => i.id === activeLesson.id);

                  if (!hasChildren && chapterLesson) {
                    return renderOutlineLessonLink(chapterLesson);
                  }

                  const headerTitle =
                    chapterLesson?.title?.trim() ||
                    group.items[0]?.title?.trim() ||
                    "Chapitre";

                  return (
                    <div
                      key={group.key}
                      className={cn(
                        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]",
                        groupHasActive && "border-white/20",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOutlineGroup(group.key)}
                        className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-white/60 transition-transform",
                            !isExpanded && "-rotate-90",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 leading-tight">{headerTitle}</span>
                        {hasChildren ? (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                            {group.items.length}
                          </span>
                        ) : null}
                      </button>
                      {isExpanded ? (
                        <ul className="space-y-1 border-t border-white/10 px-1 pb-2 pt-1">
                          {chapterLesson && chapterLesson.kind === "chapter"
                            ? renderOutlineLessonLink(chapterLesson)
                            : null}
                          {group.items.map((item) => renderOutlineLessonLink(item))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Validation de la formation</p>
              <p className="mt-1 text-sm text-white/80">Obtenez votre badge en validant la formation.</p>
            </div>
            {badgeConfig?.label ? (
              <div className="flex flex-col items-end gap-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  <CircleCheck className="h-4 w-4" />
                  {String(badgeConfig.label)}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">À obtenir</div>
              </div>
            ) : (
              <div className="text-xs text-white/50">Aucun badge</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNeuroToggle = (variant: "light" | "glass") => (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-2 shadow-sm",
        variant === "glass"
          ? "border-white/20 bg-white/10 text-white backdrop-blur-md"
          : "border-slate-200 bg-white text-slate-900",
      )}
    >
      <div className="flex flex-col">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.3em]",
            variant === "glass" ? "text-white/90" : "text-slate-500",
          )}
        >
          Mode neuro-adapté
        </span>
        <span className={cn("text-[11px]", variant === "glass" ? "text-white/65" : "text-slate-400")}>
          DYS / Accessibilité
        </span>
      </div>
      <Switch
        checked={isDyslexiaMode}
        onCheckedChange={(checked) => {
          if (checked !== isDyslexiaMode) {
            toggleDyslexiaMode();
            if (!checked) {
              setShowLearningStrategyModal(false);
              setFocusMode(false);
            }
          }
        }}
        aria-label="Activer le mode neuro-adapté"
      />
    </div>
  );

  const neuroToggle = renderNeuroToggle("light");

  const renderLayout = (isFocus: boolean) => {
    const showDesktopOutline = !isFocus && !outlineCollapsed;

    return (
      <>
      <style jsx global>{`
        @keyframes lessonFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .lesson-fade-in {
          animation: lessonFadeIn 240ms ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .apprenant-sidebar,
        .apprenant-sidebar * {
          color: white;
        }

        /* Pro reading: tight spacing + contrast */
        .prose {
          color: #0f172a !important;
          font-weight: 300 !important;
        }
        .prose p {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          color: #0f172a !important;
          opacity: 1 !important;
          font-weight: 300 !important;
        }
        .prose li,
        .prose strong {
          color: #0f172a !important;
          opacity: 1 !important;
        }
        .prose strong {
          font-weight: 600 !important;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        .prose table {
          border: 1px solid rgba(15, 23, 42, 0.12) !important;
          border-collapse: collapse !important;
        }
        .prose td,
        .prose th {
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          color: #0f172a !important;
        }
        .prose dt {
          margin-bottom: 0px !important;
          font-weight: 700 !important;
        }
        .prose dd {
          margin-top: 0px !important;
          margin-bottom: 0.5rem !important;
        }
        .prose blockquote {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose .bg-red-50,
        .prose .bg-green-50 {
          border-radius: 1rem !important;
        }
        /* Filet si un embed CMS / rehypeRaw échappe encore au strip (évite le grand blanc sous la vidéo du haut) */
        .lesson-body-dedupe-youtube .prose iframe,
        .lesson-body-dedupe-youtube .prose embed,
        .lesson-body-dedupe-youtube .prose object {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          max-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          overflow: hidden !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .lesson-body-dedupe-youtube .prose div[style*="padding-bottom"][style*="56.25"] {
          display: none !important;
          min-height: 0 !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Button
          variant="outline"
          className="flex-1 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
          onClick={() => setShowMobileOutline(true)}
        >
          Sommaire du cours
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => toggleDyslexiaMode()}
          className={cn(
            "rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] shadow-sm",
            isDyslexiaMode
              ? "border-blue-500/40 bg-blue-500/15 text-blue-700"
              : "border-slate-200 bg-white text-slate-600",
          )}
          aria-pressed={isDyslexiaMode}
        >
          Neuro
        </Button>
      </div>

      <div
        className={cn(
          "flex flex-col font-['SF_Pro_Display',_sans-serif] transition-[gap] duration-300 ease-in-out lg:flex-row lg:items-stretch",
          showDesktopOutline ? "gap-6 lg:gap-6" : "gap-6 lg:gap-3",
        )}
      >
        <aside
          className={cn(
            "relative order-1 rounded-3xl border border-slate-200 bg-[#0F111A] text-white shadow-sm backdrop-blur-xl lg:order-1",
            isFocus ? "hidden" : "hidden lg:flex lg:flex-col",
            "before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-40 before:bg-gradient-to-b before:from-red-600/30 before:via-red-600/5 before:to-transparent before:pointer-events-none",
            "after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-64 after:w-64 after:bg-red-500/10 after:blur-[80px] after:pointer-events-none",
            "shrink-0 overflow-hidden transition-[width,min-width,max-width,padding,opacity] duration-300 ease-in-out",
            showDesktopOutline
              ? "p-5 opacity-100 lg:min-w-[260px] lg:max-w-[360px] lg:w-[min(360px,32vw)]"
              : "p-2 opacity-100 lg:min-w-[3.5rem] lg:max-w-[3.5rem] lg:w-14",
            !isFocus && !showDesktopOutline && "lg:border-slate-200",
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:3px_3px]" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2">
            {!isFocus ? (
              <div
                className={cn(
                  "flex w-full shrink-0",
                  showDesktopOutline ? "justify-end pr-0 pt-0" : "justify-center pt-1",
                )}
              >
                <button
                  type="button"
                  aria-expanded={showDesktopOutline}
                  aria-label={showDesktopOutline ? "Rétracter le sommaire" : "Déployer le sommaire"}
                  onClick={() => setOutlineCollapsed((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/18"
                >
                  {showDesktopOutline ? (
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            ) : null}
            <div
              className={cn(
                "apprenant-sidebar scrollbar-hide min-h-0 flex-1 scroll-smooth overflow-y-auto",
                !showDesktopOutline && "hidden lg:hidden",
              )}
            >
              {renderOutline()}
            </div>
          </div>
        </aside>

        <section
          className={cn(
            "relative order-2 min-w-0 flex-1 space-y-8 rounded-3xl border border-slate-200 !bg-white p-4 sm:p-6 lg:order-2 shadow-sm",
            "transition-[max-width,margin] duration-300 ease-in-out",
            showDesktopOutline ? "lg:max-w-[calc(100vw-min(360px,32vw)-3rem)]" : "lg:max-w-none",
            isFocus && "ring-1 ring-slate-900/10",
          )}
        >
          <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-[#E50914] via-purple-600 to-pink-500" />
          <div className="flex w-full max-w-6xl flex-col items-start gap-3 pl-1 text-left apprenant-force-text text-slate-500 sm:pl-2 lg:pl-11">
            <div className="flex w-full items-center justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                {activeModule ? "Module" : detail.tags && detail.tags.length > 0 ? detail.tags.join(" • ") : "Formation"}
              </p>
              <Button
                type="button"
                onClick={handleReturnToOverview}
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 self-center rounded-full border border-slate-200 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Retour à la présentation"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Retour
              </Button>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{activeLesson.title}</h2>
            {activeModule && activeModule.title !== activeLesson.title ? (
              <p className="text-sm font-medium text-slate-600">{activeModule.title}</p>
            ) : null}
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-600" />
              {activeLesson.duration}
            </p>
          </div>

          <div className="flex w-full max-w-6xl flex-wrap items-start justify-start gap-3 pl-1 sm:pl-2 lg:pl-11">
            {previousLesson ? (
              <Link
                href={lessonHref(previousLesson.id)}
                prefetch={true}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
              >
                Chapitre précédent
              </Link>
            ) : null}
            {showAccessQuizButton && accessQuizHref ? (
              <Link
                href={accessQuizHref}
                prefetch={true}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
              >
                Accéder au Quiz
                <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            ) : null}
            {showAccessInterviewButton && accessInterviewHref ? (
              <Link
                href={accessInterviewHref}
                prefetch={true}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-900 shadow-sm transition-colors hover:bg-violet-100"
              >
                Accéder à l&apos;entretien
                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            ) : null}
            {showChapterNextButton && nextLesson ? (
              <Link
                href={lessonHref(nextLesson.id)}
                prefetch={true}
                className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Chapitre suivant
              </Link>
            ) : null}
            {!nextLesson ? (
              <Button
                type="button"
                onClick={openCertificationOverlay}
                className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-black shadow-[0_20px_60px_-35px_rgba(212,175,55,0.6)] hover:opacity-95"
              >
                Passer la certification
              </Button>
            ) : null}
          </div>

          {isMediaContent && normalizedVideoSrc ? (
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-black transition">
              {normalizedVideoSrc &&
              (normalizedVideoSrc.includes('.mp3') ||
                normalizedVideoSrc.includes('.wav') ||
                normalizedVideoSrc.includes('.ogg') ||
                normalizedVideoSrc.includes('.m4a')) ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-slate-50 p-8">
                  <div className="w-full max-w-md">
                    <audio controls className="w-full">
                      <source src={normalizedVideoSrc} type="audio/mpeg" />
                      <source src={normalizedVideoSrc} type="audio/wav" />
                      <source src={normalizedVideoSrc} type="audio/ogg" />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                  <p className="text-sm text-slate-600">Contenu audio</p>
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden">
                  {normalizedVideoSrc && (normalizedVideoSrc.startsWith('http://') || normalizedVideoSrc.startsWith('https://')) ? (
                    <iframe
                      src={normalizedVideoSrc}
                      className="absolute inset-0 h-full w-full rounded-3xl border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Vidéo du cours"
                    />
                  ) : (
                    <video controls playsInline className="aspect-video w-full rounded-3xl">
                      <source src={normalizedVideoSrc ?? undefined} type="video/mp4" />
                      <source src={normalizedVideoSrc ?? undefined} type="video/webm" />
                      <source src={normalizedVideoSrc ?? undefined} type="video/quicktime" />
                      <source src={normalizedVideoSrc ?? undefined} type="video/x-m4v" />
                      Votre navigateur ne supporte pas la lecture vidéo.
                      {normalizedVideoSrc && (
                        <p className="mt-4 text-center text-slate-500">
                          <a
                            href={normalizedVideoSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 underline"
                          >
                            Cliquez ici pour ouvrir la vidéo
                          </a>
                        </p>
                      )}
                    </video>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {isExperientialInterviewLesson ? (
            <div className="apprenant-studio-light">
              {interviewDoneForActiveLesson ? (
                <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-8 text-slate-900">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-800">
                    Entretien terminé
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">Bilan enregistré</h3>
                  <p className="text-sm leading-relaxed text-slate-700">
                    Vous avez complété l&apos;entretien expérientiel. Poursuivez la formation pour la suite du
                    parcours.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {nextLesson ? (
                      <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                        <Link href={lessonHref(nextLesson.id)}>Chapitre suivant</Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" className="rounded-full border-slate-300 text-slate-800">
                      <Link href={entretienHref}>Revoir le bilan</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <InterviewLessonCard
                  entretienHref={entretienHref}
                  chapterTitle={activeLesson.title || undefined}
                />
              )}
            </div>
          ) : isTestFlow ? (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              {!testStarted ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Contenu du chapitre</h3>
                    <p className="text-slate-600">
                      {isQuizLesson
                        ? "Ce quiz vérifie votre compréhension des notions vues dans ce module."
                        : "Ce test a pour objectif d'évaluer votre compréhension du contenu que vous venez de voir."}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={async () => {
                        setIsLoadingTest(true);
                        try {
                          const testId =
                            linkedQuizTestId ||
                            (isTestLessonKind ? activeLesson.id.replace(/^test-/, "") : "");
                          if (!testId) {
                            throw new Error("Quiz introuvable");
                          }
                          const response = await fetch(`/api/tests/${testId}`);
                          if (!response.ok) {
                            throw new Error("Impossible de charger le test");
                          }
                          const data = await response.json();
                          const test = data.test;

                          if (test && test.questions && Array.isArray(test.questions)) {
                            setTestQuestions(test.questions);
                            const sm = test?.scoring?.score_minimum ?? test?.scoring?.scoreMinimum;
                            setTestFlowMeta({
                              title: String(test.title ?? activeLesson.title ?? "Quiz"),
                              minScore: typeof sm === "number" && !Number.isNaN(sm) ? Math.min(100, Math.max(0, sm)) : 70,
                            });
                            setTestStarted(true);
                          } else {
                            throw new Error("Aucune question trouvée dans ce test");
                          }
                        } catch (error) {
                          console.error("Erreur lors du chargement du test:", error);
                          alert("Erreur lors du chargement du test. Veuillez réessayer.");
                        } finally {
                          setIsLoadingTest(false);
                        }
                      }}
                      disabled={isLoadingTest}
                      className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isLoadingTest ? "Chargement..." : isQuizLesson ? "Démarrer le quiz" : "Démarrer l'évaluation"}
                    </Button>
                  </div>
                </div>
              ) : (
                <TestFlowInline
                  testId={linkedQuizTestId || activeLesson.id.replace(/^test-/, "")}
                  title={testFlowMeta.title || activeLesson.title}
                  minScorePercent={testFlowMeta.minScore}
                  questions={testQuestions}
                  onClose={() => setTestStarted(false)}
                  onQuizCompleted={handleQuizCompletedForNav}
                />
              )}
            </div>
          ) : hasTextContent ? (
            <LessonSmartAssist
              hideAssistantPanel={isFocus}
              courseId={courseId}
              lessonId={activeLesson.id}
              courseTitle={courseTitle}
              lessonTitle={activeLesson.title}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, filter: "blur(20px)", scale: 0.98 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(20px)", scale: 1.02 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "mx-auto w-full max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
                    hideYoutubeEmbedDupesInBody && "lesson-body-dedupe-youtube",
                  )}
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Contenu du chapitre</h3>
                    {isHtmlContent ? (
                      <div
                        data-dyslexia-content="true"
                        className="text-slate-900 font-['SF_Pro_Display',_sans-serif] prose prose-slate max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1 prose-table:border prose-p:!text-slate-900 prose-li:!text-slate-900 prose-strong:!text-slate-900 prose-th:!text-slate-900 prose-td:!text-slate-900 [&_p]:!text-slate-900 [&_p]:opacity-100"
                        style={{
                          isolation: "isolate",
                          whiteSpace: "pre-wrap",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: sanitizedContent,
                        }}
                      />
                    ) : (
                      <div
                        data-dyslexia-content="true"
                        className="text-slate-900 font-['SF_Pro_Display',_sans-serif] prose prose-slate max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1 prose-table:border prose-p:!text-slate-900 prose-li:!text-slate-900 prose-strong:!text-slate-900 prose-th:!text-slate-900 prose-td:!text-slate-900 [&_p]:!text-slate-900 [&_p]:opacity-100"
                        style={{
                          isolation: "isolate",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                          remarkPlugins={[remarkGfm, remarkMath]}
                          components={{
                            h1: (props) => <h1 {...props} className="font-bold text-slate-900 tracking-tight mb-4" />,
                            h2: (props) => <h2 {...props} className="font-bold text-slate-900 tracking-tight mb-3" />,
                            h3: (props) => <h3 {...props} className="font-bold text-slate-900 mb-3" />,
                            p: (props) => <p {...props} className="font-light text-slate-900 opacity-100 leading-relaxed mb-2" />,
                            strong: (props) => <strong {...props} className="font-semibold text-slate-900" />,
                            li: (props) => <li {...props} className="text-slate-900 opacity-100" />,
                          }}
                        >
                          {sanitizedContent}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </LessonSmartAssist>
          ) : !isMediaContent ? (
            <LessonSmartAssist
              hideAssistantPanel={isFocus}
              courseId={courseId}
              lessonId={activeLesson.id}
              courseTitle={courseTitle}
              lessonTitle={activeLesson.title}
            >
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-slate-500">
                  <p className="text-base text-slate-700">Ce chapitre sera disponible prochainement.</p>
                  <span className="text-xs uppercase tracking-wide">Contenu en préparation</span>
                </div>
              </div>
            </LessonSmartAssist>
          ) : // Média déjà affiché au-dessus (vidéo / audio) : ne pas dupliquer un bloc aspect-video « finalisation »
          isMediaContent && normalizedVideoSrc ? null : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 text-center text-slate-600">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Cone className="h-6 w-6 text-amber-500" aria-hidden="true" />
              </div>
              <p className="text-base font-semibold text-slate-900">🚧 Chapitre en cours de finalisation</p>
              <p className="max-w-md px-6 text-sm text-slate-600">
                Nos équipes peaufinent le contenu pour vous offrir la meilleure expérience possible. Revenez très vite !
              </p>
            </div>
          )}

          {showBeyondFlashCta ? (
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={() => setIsBeyondFlashOpen(true)}
                className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-6 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white hover:opacity-95"
              >
                Réviser avec Beyond Flash
              </Button>
            </div>
          ) : null}

          <div className="flex w-full max-w-5xl flex-wrap items-start justify-start gap-3 pl-1 sm:pl-2 lg:pl-11">
            {previousLesson ? (
              <Link
                href={lessonHref(previousLesson.id)}
                prefetch={true}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
              >
                Chapitre précédent
              </Link>
            ) : null}
            {showAccessQuizButton && accessQuizHref ? (
              <Link
                href={accessQuizHref}
                prefetch={true}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
              >
                Accéder au Quiz
                <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            ) : null}
            {showAccessInterviewButton && accessInterviewHref ? (
              <Link
                href={accessInterviewHref}
                prefetch={true}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-900 shadow-sm transition-colors hover:bg-violet-100"
              >
                Accéder à l&apos;entretien
                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            ) : null}
            {showChapterNextButton && nextLesson ? (
              <Link
                href={lessonHref(nextLesson.id)}
                prefetch={true}
                className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Chapitre suivant
              </Link>
            ) : null}
            {!nextLesson ? (
              <Button
                type="button"
                onClick={openCertificationOverlay}
                className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-black shadow-[0_20px_60px_-35px_rgba(212,175,55,0.6)] hover:opacity-95"
              >
                Passer la certification
              </Button>
            ) : null}
          </div>
          <div className="hidden justify-end lg:flex">
            {neuroToggle}
          </div>

        </section>

      </div>

      <Dialog open={showCertificationOverlay} onOpenChange={setShowCertificationOverlay}>
        <DialogContent className="max-w-5xl rounded-3xl border border-white/10 bg-slate-950/80 p-0 text-white backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={badgeSubmitted ? "submitted" : "form"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-6"
            >
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Certification & Open Badge
                </div>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {badgeConfig?.label ? `Passer la certification · ${badgeConfig.label}` : "Passer la certification"}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Déposez votre preuve. Notre équipe (et EDGE AI) la vérifie avant attribution.
                </p>
              </div>

              {badgeSubmitted ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] text-xl">
                    ★
                  </div>
                  <div className="text-lg font-semibold">Félicitations !</div>
                  <div className="mt-1 text-sm text-white/70">
                    Votre preuve est en cours d&apos;analyse par EDGE AI.
                  </div>
                </div>
              ) : !badgeConfig ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/80">
                  Aucun badge actif n&apos;est configuré pour cette formation.
                </div>
              ) : badgeConfig?.evaluation_type === "case_study" ? (
                <div className="space-y-4">
                  <CaseStudyWorkspace
                    value={badgeDraft.caseStudy}
                    onChange={(next) => setBadgeDraft((p) => ({ ...p, caseStudy: next }))}
                    storageKey={`beyond:case-draft:${courseId}:${String(badgeConfig?.id ?? "")}`}
                    prompt={String(badgeConfig?.case_prompt ?? "").trim() || null}
                    expectedProofs={
                      Array.isArray((badgeConfig as any)?.modalities?.expected_proofs)
                        ? ((badgeConfig as any).modalities.expected_proofs as unknown[])
                            .map((x) => String(x ?? "").trim())
                            .filter(Boolean)
                        : []
                    }
                    onSubmitToAi={async ({ text, expectedProofs }) => {
                      if (!text.trim()) return;
                      setCaseAiLoading(true);
                      try {
                        const res = await fetch("/api/ai/analyze-case-study", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text,
                            expectedProofs,
                            courseTitle,
                            badgeTitle: String(badgeConfig?.label ?? "").trim() || undefined,
                          }),
                        });
                        const json = await res.json().catch(() => null);
                        if (!res.ok) throw new Error(String(json?.error ?? `Erreur IA (${res.status})`));
                        const analysis = String(json?.analysis ?? "").trim();
                        if (analysis) {
                          setCaseAiAnalysis(analysis);
                          toast.success("Analyse EDGE AI prête");
                        } else {
                          toast.error("Analyse vide");
                        }
                      } catch (e) {
                        toast.error("Analyse impossible", { description: e instanceof Error ? e.message : "Erreur" });
                      } finally {
                        setCaseAiLoading(false);
                      }
                    }}
                  />

                  {caseAiAnalysis ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-left text-sm text-white/90 whitespace-pre-wrap">
                      <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                        EDGE AI — première analyse
                      </div>
                      <div className="mt-3">{caseAiAnalysis}</div>
                    </div>
                  ) : null}

                  {caseAiLoading ? (
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                      EDGE AI analyse…
                    </div>
                  ) : null}
                </div>
              ) : badgeConfig?.evaluation_type === "audio_ia" ||
                badgeConfig?.evaluation_type === "audio_interview" ||
                badgeConfig?.evaluation_type === "audio_presentation" ||
                badgeConfig?.evaluation_type === "audio_negotiation" ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-600/15 ring-1 ring-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.25)] animate-pulse" />
                  <div className="text-lg font-semibold">Audio (IA)</div>
                  {badgeConfig?.audio_scenario ? (
                    <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-white/10 bg-black/30 p-4 text-left text-sm text-white/90 whitespace-pre-wrap">
                      {String(badgeConfig.audio_scenario)}
                    </div>
                  ) : null}
                  <div className="mt-2 text-sm text-white/70">
                    Mode prototype : décrivez vos réponses, puis soumettez pour validation.
                  </div>
                  <textarea
                    value={badgeDraft.audioNotes}
                    onChange={(e) => setBadgeDraft((p) => ({ ...p, audioNotes: e.target.value }))}
                    className="mt-5 h-[180px] w-full max-w-2xl resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/90 outline-none"
                    placeholder="Notes / transcription / points clés…"
                  />
                </div>
              ) : badgeConfig?.evaluation_type === "video_presentation" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Consigne</div>
                    <p className="mt-2 text-sm text-white/80">
                      Visionnez ou enregistrez votre présentation, puis déposez vos notes ou le lien complémentaire.
                    </p>
                    {badgeConfig?.video_presentation_url ? (
                      <a
                        href={String(badgeConfig.video_presentation_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex text-sm font-semibold text-sky-300 underline"
                      >
                        Lien / ressource fournie par le formateur
                      </a>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-white p-5 text-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Enregistrement intégré</div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative h-32 w-48 overflow-hidden rounded-xl border border-slate-200 bg-black">
                          <video ref={liveVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                          {pitchRecording ? (
                            <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                              Rec
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">Caméra</div>
                          <div className="mt-1 text-sm text-slate-600">
                            Enregistrez votre pitch, puis relisez/visionnez avant d’envoyer.
                          </div>
                        </div>
                      </div>
                      {pitchPreviewUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                          <video src={pitchPreviewUrl} className="h-56 w-full object-cover" controls playsInline />
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={pitchUploading}
                          className={cn(
                            "rounded-full text-white",
                            pitchRecording ? "bg-slate-950 hover:bg-slate-900" : "bg-red-600 hover:bg-red-500",
                          )}
                          onClick={async () => {
                            if (pitchRecording) {
                              recorderRef.current?.stop();
                              setPitchRecording(false);
                              try {
                                if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                              } catch {
                                // ignore
                              }
                              return;
                            }
                            try {
                              recordedChunksRef.current = [];
                              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                              streamRef.current = stream;
                              if (liveVideoRef.current) {
                                liveVideoRef.current.srcObject = stream;
                              }
                              const recorder = new MediaRecorder(stream);
                              recorderRef.current = recorder;
                              recorder.ondataavailable = (e) => {
                                if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
                              };
                              recorder.onstop = async () => {
                                const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "video/webm" });
                                const url = URL.createObjectURL(blob);
                                setPitchPreviewUrl(url);
                                setPitchUploading(true);
                                try {
                                  const fd = new FormData();
                                  fd.append("file", new File([blob], `pitch-${Date.now()}.webm`, { type: blob.type }));
                                  fd.append("bucket", "Public");
                                  fd.append("folder", "pitches");
                                  const res = await fetch("/api/upload-video", { method: "POST", body: fd });
                                  const json = await res.json().catch(() => null);
                                  if (!res.ok) throw new Error(String(json?.error ?? `Upload impossible (${res.status})`));
                                  const uploaded = String(json?.url ?? "").trim();
                                  if (uploaded) {
                                    setPitchUploadedUrl(uploaded);
                                    toast.success("Pitch uploadé");
                                  } else {
                                    toast.error("URL vidéo manquante après upload");
                                  }
                                } catch (e) {
                                  toast.error("Upload impossible", { description: e instanceof Error ? e.message : "Erreur" });
                                } finally {
                                  setPitchUploading(false);
                                }
                              };
                              recorder.start(250);
                              setPitchRecording(true);
                            } catch (e) {
                              toast.error("Caméra indisponible", { description: e instanceof Error ? e.message : "Erreur" });
                            }
                          }}
                        >
                          {pitchRecording ? "Stop" : "Record"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            if (pitchPreviewUrl) URL.revokeObjectURL(pitchPreviewUrl);
                            setPitchPreviewUrl(null);
                            setPitchUploadedUrl(null);
                          }}
                        >
                          Réinitialiser
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        {pitchUploadedUrl ? "Vidéo prête — elle sera soumise avec votre validation." : pitchUploading ? "Upload en cours…" : "Enregistrez puis validez."}
                      </p>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Notes (optionnel)</div>
                        <textarea
                          value={badgeDraft.videoNotes}
                          onChange={(e) => setBadgeDraft((p) => ({ ...p, videoNotes: e.target.value }))}
                          className="mt-3 h-[160px] w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none"
                          placeholder="Résumé rapide de votre pitch…"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : badgeConfig?.evaluation_type === "technical_deliverable" || badgeConfig?.evaluation_type === "file_upload" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-sm text-white/80">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Livrable attendu</div>
                    <p className="mt-2">
                      Déposez le lien vers votre maquette / export JSON / archive, ou décrivez où se trouve le fichier.
                    </p>
                    {badgeConfig?.technical_deliverable_url ? (
                      <p className="mt-3 text-xs text-white/60">
                        Modèle / consigne :{" "}
                        <a href={String(badgeConfig.technical_deliverable_url)} className="text-sky-300 underline" target="_blank" rel="noreferrer">
                          ressource formateur
                        </a>
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-white p-5 text-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Votre livrable</div>
                    <textarea
                      value={badgeDraft.deliverableNotes}
                      onChange={(e) => setBadgeDraft((p) => ({ ...p, deliverableNotes: e.target.value }))}
                      className="mt-3 h-[280px] w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none"
                      placeholder="URL du fichier, lien Figma, ou description du dépôt…"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-sm text-white/80">QCM configuré. Cliquez pour ouvrir le quiz.</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={
                        badgeConfig?.quiz_test_id
                          ? `/quiz?testId=${encodeURIComponent(String(badgeConfig.quiz_test_id))}`
                          : "#"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Ouvrir le QCM
                    </a>
                    <div className="text-xs text-white/60 flex items-center">Timer : 15 min (prototype)</div>
                  </div>
                </div>
              )}

              {!badgeSubmitted && badgeConfig ? (
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCertificationOverlay(false)}
                    className="rounded-full border border-white/15 text-white/80 hover:bg-white/10"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    disabled={badgeSubmitting}
                    onClick={async () => {
                      setBadgeSubmitting(true);
                      try {
                        const evaluationType = String(badgeConfig?.evaluation_type || "qcm");
                        const data =
                          evaluationType === "case_study"
                            ? { answer: badgeDraft.caseStudy }
                            : evaluationType === "audio_ia" ||
                                evaluationType === "audio_interview" ||
                                evaluationType === "audio_presentation" ||
                                evaluationType === "audio_negotiation"
                              ? { notes: badgeDraft.audioNotes }
                              : evaluationType === "video_presentation"
                                ? { notes: badgeDraft.videoNotes, video_url: pitchUploadedUrl ?? badgeConfig?.video_presentation_url }
                                : evaluationType === "technical_deliverable" || evaluationType === "file_upload"
                                  ? { notes: badgeDraft.deliverableNotes, resource_url: badgeConfig?.technical_deliverable_url }
                                  : { quiz_test_id: badgeConfig?.quiz_test_id };

                        const res = await fetch("/api/earner/certification/submit", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            courseId,
                            badgeId: badgeConfig?.id,
                            evaluationType,
                            data,
                          }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || "Soumission impossible");
                        await fireConfetti();
                        setBadgeSubmitted(true);
                      } catch (e) {
                        toast.error("Soumission impossible", {
                          description: e instanceof Error ? e.message : "Erreur inconnue",
                        });
                      } finally {
                        setBadgeSubmitting(false);
                      }
                    }}
                    className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-2 text-sm font-semibold text-black shadow-[0_20px_60px_-35px_rgba(212,175,55,0.55)] hover:opacity-95"
                  >
                    {badgeSubmitting ? "Soumission…" : "Soumettre pour validation"}
                  </Button>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={showMobileOutline} onOpenChange={setShowMobileOutline}>
        <DialogContent
          className={cn(
            "max-h-[min(85vh,640px)] max-w-md overflow-y-auto rounded-3xl border border-white/20",
            "bg-slate-950/55 text-white shadow-[0_25px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-2xl backdrop-saturate-150",
            "[&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:opacity-100 [&_[data-slot=dialog-close]]:ring-offset-slate-950",
          )}
        >
          <DialogTitle className="sr-only">Consignes</DialogTitle>
          <DialogDescription className="sr-only">
            Informations et actions liées à la leçon
          </DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              Sommaire
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 flex justify-end">{renderNeuroToggle("glass")}</div>
          {renderOutline()}
        </DialogContent>
      </Dialog>

      {mounted && isBeyondFlashOpen
        ? createPortal(
            <FlashcardPlayer
              cards={beyondFlashCards}
              onClose={() => setIsBeyondFlashOpen(false)}
            />,
            document.body,
          )
        : null}

      <LearningStrategyModal
        isOpen={showLearningStrategyModal}
        onClose={() => setShowLearningStrategyModal(false)}
        onFocusModeChange={setFocusMode}
      />

      {mounted &&
        createPortal(
          <div
            className={cn(
              "fixed bottom-24 left-4 z-40 flex flex-col items-stretch gap-2 sm:left-6 lg:bottom-28 lg:left-8",
              isTestFlow && testStarted && "opacity-40 hover:opacity-100",
            )}
          >
            <button
              type="button"
              onClick={() => toggleDyslexiaMode()}
              aria-label={isDyslexiaMode ? "Désactiver le mode neuro-adapté" : "Activer le mode neuro-adapté"}
              aria-pressed={isDyslexiaMode}
              className={cn(
                "rounded-full border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                isDyslexiaMode
                  ? "border-blue-500/40 bg-blue-500/15 text-blue-100 hover:bg-blue-500/25 focus-visible:outline-blue-400"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400",
              )}
            >
              Neuro
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleOpenLearningStrategy}
                  aria-label="Choisir sa stratégie d’apprentissage"
                  className="flex items-center justify-center gap-1.5 rounded-full border border-slate-800 bg-black/90 px-3 py-2 text-white shadow-md transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] sm:inline">Stratégie</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                align="center"
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg"
              >
                Choisir sa stratégie d’apprentissage
              </TooltipContent>
            </Tooltip>
          </div>,
          document.body,
        )}
      </>
    );
  };

  if (focusMode) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black px-6 py-8">
          <div className="mx-auto max-w-7xl space-y-6">{renderLayout(true)}</div>
        </div>
      </TooltipProvider>
    );
  }

  return <TooltipProvider>{renderLayout(false)}</TooltipProvider>;
}

// Composant inline pour afficher le test dans la leçon
function TestFlowInline({
  testId,
  title,
  minScorePercent,
  questions,
  onClose,
  onQuizCompleted,
}: {
  testId: string;
  title: string;
  minScorePercent?: number;
  questions: any[];
  onClose: () => void;
  onQuizCompleted?: (testId: string) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(() => questions.length > 0);

  // Utiliser useEffect pour masquer la sidebar quand le test est en plein écran
  // DOIT être appelé à chaque render, pas conditionnellement
  useEffect(() => {
    if (!isFullscreen) return;
    
    // Masquer la sidebar
    const sidebarElements = document.querySelectorAll('[class*="sidebar"], aside, [id*="sidebar"]');
    sidebarElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Ajouter une classe au body pour le style global
    document.body.classList.add('test-fullscreen-mode');
    
    return () => {
      // Restaurer la sidebar quand on quitte le mode plein écran
      sidebarElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
      document.body.classList.remove('test-fullscreen-mode');
    };
  }, [isFullscreen]);

  const convertedQuestions: TestQuestion[] = useMemo(() => normalizeTestQuestions(questions), [questions]);

  useEffect(() => {
    if (questions.length > 0) {
      setIsFullscreen(true);
    }
  }, [questions.length]);

  if (convertedQuestions.length === 0) {
    return (
      <div className="py-12 text-center text-white/60">
        <p>Aucune question disponible pour ce test.</p>
        <Button
          onClick={onClose}
          variant="ghost"
          className="mt-4 rounded-full border border-white/20 text-white/80 hover:bg-white/10"
        >
          Retour
        </Button>
      </div>
    );
  }

  // Mode plein écran focus (comme pomodoro)
  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-[99999] flex flex-col overflow-hidden bg-white"
        style={{ 
          position: 'fixed',
          left: 0, 
          right: 0, 
          top: 0, 
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          zIndex: 99999,
        }}
      >
        <style jsx global>{`
          /* Masquer la sidebar et autres éléments lors du mode plein écran */
          body.test-fullscreen-mode [class*="sidebar"],
          body.test-fullscreen-mode [id*="sidebar"],
          body.test-fullscreen-mode aside:not(.test-content) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          
          /* S'assurer que le contenu principal n'a pas de margin-left */
          body.test-fullscreen-mode main,
          body.test-fullscreen-mode [class*="main"] {
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
        `}</style>
        <div className="test-content w-full h-full">
          <TestFlow
            slug={testId}
            title={title}
            questions={convertedQuestions}
            summary="Évaluation de votre compréhension du contenu"
            onClose={() => setIsFullscreen(false)}
            fullscreen={true}
            minScorePercent={minScorePercent ?? 70}
            immersive
            className="flex-1 w-full h-full"
            onQuizCompleted={(id) => {
              onQuizCompleted?.(id);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
      <p className="text-sm text-slate-600">Quiz en pause.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => setIsFullscreen(true)} className="rounded-full bg-slate-900 px-5 text-sm font-semibold text-white">
          Reprendre
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="rounded-full border-slate-300">
          Fermer
        </Button>
      </div>
    </div>
  );
}

