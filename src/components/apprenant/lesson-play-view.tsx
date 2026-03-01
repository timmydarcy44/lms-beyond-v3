'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { FlashcardsActivation } from "@/components/apprenant/flashcards-activation";
import { LessonSmartAssist } from "@/components/apprenant/lesson-smart-assist";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";
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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  FileText,
  Headphones,
  PenSquare,
  PlayCircle,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import type {
  LearnerDetail,
  LearnerFlashcard,
  LearnerLesson,
  LearnerModule,
} from "@/lib/queries/apprenant";
import TestFlow from "@/app/dashboard/tests/[slug]/test-flow";
import type { TestQuestion } from "@/hooks/use-test-sessions";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const getLessonIcon = (type?: string, kind?: string) => {
  // Les tests ont une icône spéciale
  if (kind === "test" || type === "test") {
    return ClipboardCheck;
  }
  
  switch ((type ?? "").toLowerCase()) {
    case "video":
      return PlayCircle;
    case "audio":
      return Headphones;
    case "document":
    case "pdf":
      return FileText;
    case "text":
      return PenSquare;
    default:
      return FileText;
  }
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
  const [focusMode, setFocusMode] = useState(false);
  const [showLearningStrategyModal, setShowLearningStrategyModal] = useState(false);
  const [showMobileOutline, setShowMobileOutline] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const { state: pomodoroState } = usePomodoro();
  const router = useRouter();
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();

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
  
  const isTest = (activeLesson as any).kind === "test" || activeLesson.type === "test";
  
  // Le mode focus est géré automatiquement par PomodoroFocusManager
  // On garde focusMode pour l'affichage local (masquer les flashcards, etc.)
  useEffect(() => {
    const isPomodoroFocus = pomodoroState.phase === "work" && pomodoroState.isActive;
    setFocusMode(isPomodoroFocus);
  }, [pomodoroState.phase, pomodoroState.isActive]);

  const lessonHref = useMemo(() => (lessonId: string) => `${cardHref}/play/${lessonId}`, [cardHref]);

  const rawContent = (activeLesson as any).content || (activeLesson as any).description || '';

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

  const hasTextContent = Boolean(sanitizedContent && sanitizedContent.trim().length > 0);

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

  const renderOutline = () => (
    <div className="space-y-5 apprenant-force-text text-black">
      <div className="text-black">
        <p className="text-xs uppercase tracking-[0.3em]">Sommaire</p>
        <h2 className="text-lg font-semibold md:text-2xl">{detail.title}</h2>
        <p className="mt-1 text-xs text-slate-500">Naviguez librement entre les chapitres</p>
      </div>
      <div className="space-y-4">
        {modules.map((module) => {
          const isModuleActive = module.id === activeModule?.id;
          return (
            <div
              key={module.id}
              className={cn(
                'space-y-2 rounded-2xl border border-slate-200 bg-white p-3 transition apprenant-force-text text-black',
                isModuleActive && 'border-black shadow-sm',
              )}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span className="text-slate-700 font-semibold">{module.title}</span>
                <span>{module.length}</span>
              </div>
              <ul className="space-y-2">
                {module.lessons?.map((moduleLesson) => {
                  const isActive = moduleLesson.id === activeLesson.id;
                  const isSubchapter = moduleLesson.kind === "subchapter";
                  const LessonIcon = getLessonIcon(moduleLesson.type, moduleLesson.kind);
                  const isTestLesson =
                    (moduleLesson as any).kind === 'test' || moduleLesson.type === 'test';
                  return (
                    <li key={moduleLesson.id}>
                      <Link
                        href={lessonHref(moduleLesson.id)}
                        prefetch={true}
                        className={cn(
                          "relative block rounded-2xl border border-transparent py-3 text-sm text-slate-700 transition hover:bg-slate-50 apprenant-force-text",
                          isSubchapter ? "pl-9 pr-4 before:absolute before:left-4 before:top-3 before:bottom-3 before:w-px before:bg-slate-200" : "px-4",
                          isActive && "border-black bg-slate-50 text-black",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-400",
                              isSubchapter && "text-slate-300",
                              isActive && "text-black",
                              isTestLesson && "text-sky-500",
                            )}
                          >
                            <LessonIcon className={cn("h-3.5 w-3.5", isSubchapter && "h-3 w-3")} aria-hidden="true" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "block font-medium leading-tight text-black",
                                  isActive && "text-black",
                                )}
                              >
                                {moduleLesson.title}
                              </span>
                              {isTestLesson ? (
                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                                  Évaluation
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs text-slate-500">{moduleLesson.duration}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );

  const neuroToggle = (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mode neuro-adapté</span>
        <span className="text-[11px] text-slate-400">DYS / Accessibilité</span>
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

  const renderLayout = (isFocus: boolean) => (
    <TooltipProvider>
      <>
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
          'flex flex-col gap-6 transition-all lg:grid lg:grid-cols-[minmax(0,1fr)_360px]',
          isFocus && 'lg:grid-cols-[minmax(0,1fr)]',
        )}
      >
        <section
          className={cn(
            'order-2 space-y-8 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 lg:order-1',
            isFocus && 'ring-1 ring-slate-900/10',
          )}
        >
          <div className="flex flex-col gap-3 text-center apprenant-force-text text-black">
            <p className="text-xs uppercase tracking-[0.3em]">
              {activeModule ? "Module" : detail.tags && detail.tags.length > 0 ? detail.tags.join(" • ") : "Formation"}
            </p>
            <h2 className="text-xl font-semibold text-black md:text-2xl">{activeModule?.title ?? activeLesson.title}</h2>
            <p className="text-sm text-black">
              {activeModule && activeModule.title !== activeLesson.title
                ? `${activeModule.title} • ${activeLesson.title}`
                : activeLesson.title}
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-black">
              <Clock className="h-4 w-4 text-black" />
              {activeLesson.duration}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReturnToOverview}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
              aria-label="Retour à la présentation"
            >
              <ArrowLeft className="h-4 w-4 text-black" aria-hidden="true" />
              <span className="hidden sm:inline">Retour à la présentation</span>
              <span className="sm:hidden">Retour</span>
            </Button>
            {previousLesson ? (
              <Button
                variant="outline"
                asChild
                className="rounded-thumb border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm hover:bg-white/90"
              >
                <Link href={lessonHref(previousLesson.id)} prefetch={true}>
                  Chapitre précédent
                </Link>
              </Button>
            ) : null}
            {nextLesson ? (
              <Button
                variant="outline"
               	asChild
                className="rounded-thumb border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm hover:bg-white/90"
              >
                <Link href={lessonHref(nextLesson.id)} prefetch={true}>
                  Chapitre suivant
                </Link>
              </Button>
            ) : null}
          </div>

          {isMediaContent && normalizedVideoSrc ? (
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white transition">
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
                <div className="aspect-video w-full">
                  {normalizedVideoSrc && (normalizedVideoSrc.startsWith('http://') || normalizedVideoSrc.startsWith('https://')) ? (
                    <iframe
                      src={normalizedVideoSrc}
                      className="h-full w-full rounded-3xl"
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

          {isTest ? (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              {!testStarted ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Contenu du chapitre</h3>
                    <p className="text-slate-600">
                      Ce test a pour objectif d'évaluer votre compréhension du contenu que vous venez de voir.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={async () => {
                        setIsLoadingTest(true);
                        try {
                          const testId = activeLesson.id.replace(/^test-/, '');
                          const response = await fetch(`/api/tests/${testId}`);
                          if (!response.ok) {
                            throw new Error("Impossible de charger le test");
                          }
                          const data = await response.json();
                          const test = data.test;

                          if (test && test.questions && Array.isArray(test.questions)) {
                            setTestQuestions(test.questions);
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
                      {isLoadingTest ? "Chargement..." : "Démarrer l'évaluation"}
                    </Button>
                  </div>
                </div>
              ) : (
                <TestFlowInline
                  testId={activeLesson.id.replace(/^test-/, '')}
                  title={activeLesson.title}
                  questions={testQuestions}
                  onClose={() => setTestStarted(false)}
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
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900">Contenu du chapitre</h3>
                  <div
                    data-dyslexia-content="true"
                    className="prose prose-lg max-w-none leading-relaxed text-slate-800 prose-headings:text-slate-900 prose-a:text-slate-800 prose-a:underline prose-img:rounded-xl"
                    style={{
                      isolation: 'isolate',
                      whiteSpace: 'pre-wrap',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizedContent,
                    }}
                  />
                </div>
              </div>
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
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 text-center text-slate-600">
              <p className="px-4 text-slate-700">Le média de ce chapitre sera disponible prochainement.</p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Restez connecté·e</span>
            </div>
          )}

          {!isFocus ? <FlashcardsActivation flashcards={flashcards} theme="light" /> : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {previousLesson ? (
              <Button
                variant="outline"
                asChild
                className="rounded-full border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm hover:bg-white/90"
              >
                <Link href={lessonHref(previousLesson.id)} prefetch={true}>
                  Chapitre précédent
                </Link>
              </Button>
            ) : null}
            {nextLesson ? (
              <Button
                variant="outline"
                asChild
                className="rounded-full border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-sm hover:bg-white/90"
              >
                <Link href={lessonHref(nextLesson.id)} prefetch={true}>
                  Chapitre suivant
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="hidden justify-end lg:flex">
            {neuroToggle}
          </div>

        </section>

        <aside
          className={cn(
            'order-1 hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:order-2 lg:flex lg:flex-col',
            isFocus && 'border-slate-300 bg-white/90 backdrop-blur',
          )}
        >
          {renderOutline()}
        </aside>
      </div>

      <Dialog open={showMobileOutline} onOpenChange={setShowMobileOutline}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white text-slate-900">
          <DialogTitle className="sr-only">Consignes</DialogTitle>
          <DialogDescription className="sr-only">
            Informations et actions liées à la leçon
          </DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Sommaire
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 flex justify-end">
            {neuroToggle}
          </div>
          {renderOutline()}
        </DialogContent>
      </Dialog>

      <LearningStrategyModal
        isOpen={showLearningStrategyModal}
        onClose={() => setShowLearningStrategyModal(false)}
        onFocusModeChange={setFocusMode}
      />

      {typeof window !== "undefined" &&
        createPortal(
          <TooltipProvider>
            <div className="fixed bottom-6 right-6 z-[12000] flex items-center gap-2 lg:bottom-8 lg:right-8">
              <button
                type="button"
                onClick={() => toggleDyslexiaMode()}
                aria-label={isDyslexiaMode ? "Désactiver le mode neuro-adapté" : "Activer le mode neuro-adapté"}
                aria-pressed={isDyslexiaMode}
                className={cn(
                  "rounded-full border px-3 py-3 text-xs font-semibold uppercase tracking-[0.25em] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
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
                    className="flex items-center gap-2 rounded-full border border-slate-300 bg-black px-4 py-3 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.7)] transition hover:scale-[1.03] hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden text-sm font-semibold sm:inline">Stratégie</span>
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
            </div>
          </TooltipProvider>,
          document.body,
        )}
      </>
    </TooltipProvider>
  );

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-black px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {renderLayout(true)}
        </div>
      </div>
    );
  }

  return renderLayout(false);
}

// Composant inline pour afficher le test dans la leçon
function TestFlowInline({
  testId,
  title,
  questions,
  onClose,
}: {
  testId: string;
  title: string;
  questions: any[];
  onClose: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Convertir les questions du format base de données au format TestQuestion
  const convertedQuestions: TestQuestion[] = useMemo(() => {
    return questions.map((q: any, index: number) => {
      // Convertir les options au bon format
      let formattedOptions: { value: string; label: string }[] = [];
      
      if (q.options && Array.isArray(q.options)) {
        formattedOptions = q.options.map((opt: any) => {
          // Si l'option est déjà au format { value, label }, l'utiliser tel quel
          if (opt.label && opt.value) {
            return { value: opt.value, label: opt.label };
          }
          // Sinon, convertir depuis { id, value, correct, points } vers { value, label }
          return {
            value: opt.value || opt.id || String(index),
            label: opt.value || opt.label || `Option ${index + 1}`,
          };
        });
      }

      return {
        id: q.id || `q-${index}`,
        title: q.title || q.question || "Question sans titre",
        type: q.type || "multiple",
        options: formattedOptions,
        helper: q.helper || q.help || undefined,
        score: q.score || 1,
      };
    });
  }, [questions]);

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
        className="fixed inset-0 z-[99999] flex flex-col bg-gradient-to-br from-black via-[#0A0A0A] to-[#1A1A1A] overflow-hidden"
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
            className="flex-1 w-full h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsFullscreen(true)}
            className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90"
          >
            Démarrer l'évaluation
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 hover:bg-white/10"
          >
            Fermer
          </Button>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/35 p-8 text-center text-white/60">
        <p className="mb-4">Prêt à commencer l'évaluation ?</p>
        <p className="text-sm text-white/40">
          Cliquez sur "Démarrer l'évaluation" pour entrer en mode focus et répondre aux questions.
        </p>
      </div>
    </div>
  );
}

