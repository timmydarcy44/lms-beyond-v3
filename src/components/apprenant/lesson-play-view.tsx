'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { LessonFlashcardsPanel } from '@/components/apprenant/lesson-flashcards';
import { LessonSmartAssist } from '@/components/apprenant/lesson-smart-assist';
import { LearningStrategyModal } from '@/components/apprenant/learning-strategy-modal';
import { usePomodoro } from '@/components/apprenant/pomodoro-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FileText,
  Headphones,
  PenSquare,
  PlayCircle,
} from 'lucide-react';
import type {
  LearnerDetail,
  LearnerFlashcard,
  LearnerLesson,
  LearnerModule,
} from '@/lib/queries/apprenant';

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

const getLessonIcon = (type?: string) => {
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
  const { state: pomodoroState } = usePomodoro();
  
  // Le mode focus est géré automatiquement par PomodoroFocusManager
  // On garde focusMode pour l'affichage local (masquer les flashcards, etc.)
  useEffect(() => {
    const isPomodoroFocus = pomodoroState.phase === "work" && pomodoroState.isActive;
    setFocusMode(isPomodoroFocus);
  }, [pomodoroState.phase, pomodoroState.isActive]);

  const lessonHref = useMemo(() => (lessonId: string) => `${cardHref}/play/${lessonId}`, [cardHref]);

  const rawContent = activeLesson.content || activeLesson.description || '';

  const { normalizedVideoSrc, sanitizedContent } = useMemo(() => {
    const urlsInContent = rawContent ? rawContent.match(/https?:\/\/[^\s"'<>]+/g) ?? [] : [];
    const youtubeUrls = urlsInContent.filter((url) => Boolean(extractYouTubeId(url)));

    let candidateUrl = videoSrc ?? null;
    let cleanedContent = rawContent;

    if (youtubeUrls.length > 0) {
      cleanedContent = youtubeUrls.reduce(
        (acc, url) => stripYoutubeLinkFromContent(acc, url),
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
    <div className="space-y-5">
      <Button
        variant="outline"
        className="w-full justify-start gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
        onClick={() => setShowLearningStrategyModal(true)}
      >
        <BookOpen className="h-4 w-4" />
        Choisir sa stratégie d'apprentissage
      </Button>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Sommaire</p>
        <h2 className="text-lg font-semibold text-white">{detail.title}</h2>
        <p className="mt-1 text-xs text-white/50">Naviguez librement entre les chapitres</p>
      </div>
      <div className="space-y-4">
        {modules.map((module) => {
          const isModuleActive = module.id === activeModule?.id;
          return (
            <div
              key={module.id}
              className={cn(
                'space-y-2 rounded-2xl border border-white/5 p-3 transition-colors',
                isModuleActive &&
                  'border-[#FF512F]/50 bg-gradient-to-r from-[#FF512F]/20 via-[#DD2476]/15 to-transparent shadow-lg shadow-[#DD2476]/20',
              )}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                <span className="text-white/70">{module.title}</span>
                <span>{module.length}</span>
              </div>
              <ul className="space-y-2">
                {module.lessons?.map((moduleLesson) => {
                  const isActive = moduleLesson.id === activeLesson.id;
                  const isSubchapter = moduleLesson.kind === "subchapter";
                  const LessonIcon = getLessonIcon(moduleLesson.type);
                  return (
                    <li key={moduleLesson.id}>
                      <Link
                        href={lessonHref(moduleLesson.id)}
                        prefetch={true}
                        className={cn(
                          "relative block rounded-2xl border border-transparent py-3 text-sm text-white/80 transition",
                          isSubchapter ? "pl-9 pr-4 before:absolute before:left-4 before:top-3 before:bottom-3 before:w-px before:bg-white/12" : "px-4",
                          "hover:border-white/30 hover:text-white",
                          isActive &&
                            "border-transparent bg-gradient-to-r from-[#FF512F]/80 via-[#DD2476]/70 to-[#DD2476]/60 text-white shadow-md shadow-[#DD2476]/40",
                          isSubchapter && !isActive && "border-white/10 bg-white/5/30",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition-colors",
                              isSubchapter ? "border border-white/25 bg-transparent text-white/55" : "",
                              isActive && "text-white",
                            )}
                          >
                            <LessonIcon className={cn("h-3.5 w-3.5", isSubchapter && "h-3 w-3")} aria-hidden="true" />
                          </div>
                          <div className="space-y-1">
                            <span
                              className={cn(
                                "block font-medium leading-tight",
                                isSubchapter ? "text-white/80" : "text-white",
                              )}
                            >
                              {moduleLesson.title}
                            </span>
                            <span className="text-xs text-white/55">{moduleLesson.duration}</span>
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

  const renderLayout = (isFocus: boolean) => (
    <>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Button
          variant="outline"
          className="flex-1 rounded-2xl border-white/20 bg-black/50 text-white hover:bg-white/10"
          onClick={() => setShowMobileOutline(true)}
        >
          Sommaire du cours
        </Button>
      </div>

      <div
        className={cn(
          'flex flex-col gap-6 transition-all lg:grid lg:grid-cols-[minmax(0,1fr)_360px]',
          isFocus && 'lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6',
        )}
      >
        <section
          className={cn(
            'order-2 space-y-8 rounded-3xl border border-white/10 bg-black/35 p-4 sm:p-6 lg:order-1',
            isFocus && 'border-white/15 bg-black/90 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)]',
          )}
        >
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {activeModule ? "Module" : detail.tags && detail.tags.length > 0 ? detail.tags.join(" • ") : "Formation"}
            </p>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              {activeModule?.title ?? activeLesson.title}
            </h2>
              <p className="text-sm text-white/60">
              {activeLesson.duration}
            </p>
          </div>
        </div>

        {/* Afficher le lecteur multimédia si présent */}
        {isMediaContent && normalizedVideoSrc && (
        <div
          className={cn(
              'relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 transition mb-6',
            isFocus && 'ring-2 ring-[#FF512F]/40',
          )}
        >
            {/* Détecter si c'est un fichier audio */}
            {normalizedVideoSrc && (normalizedVideoSrc.includes('.mp3') || normalizedVideoSrc.includes('.wav') || normalizedVideoSrc.includes('.ogg') || normalizedVideoSrc.includes('.m4a')) ? (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)] p-8">
                <div className="w-full max-w-md">
                  <audio controls className="w-full">
                    <source src={normalizedVideoSrc} type="audio/mpeg" />
                    <source src={normalizedVideoSrc} type="audio/wav" />
                    <source src={normalizedVideoSrc} type="audio/ogg" />
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                </div>
                <p className="text-sm text-white/70">Contenu audio</p>
              </div>
            ) : (
              <div className="aspect-video w-full">
                {normalizedVideoSrc && (normalizedVideoSrc.startsWith('http://') || normalizedVideoSrc.startsWith('https://')) ? (
                  // URL externe : utiliser un iframe pour YouTube, Vimeo, etc.
                  <iframe
                    src={normalizedVideoSrc}
                    className="h-full w-full rounded-3xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Vidéo du cours"
                  />
                ) : (
                  // Fichier vidéo local : utiliser la balise video
            <video controls playsInline className="aspect-video w-full rounded-3xl">
                    <source src={normalizedVideoSrc ?? undefined} type="video/mp4" />
                    <source src={normalizedVideoSrc ?? undefined} type="video/webm" />
                    <source src={normalizedVideoSrc ?? undefined} type="video/quicktime" />
                    <source src={normalizedVideoSrc ?? undefined} type="video/x-m4v" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                    {normalizedVideoSrc && (
                      <p className="mt-4 text-center text-white/60">
                        <a
                          href={normalizedVideoSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
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
        )}

        {/* Afficher le contenu textuel formaté (toujours, même avec vidéo) */}
        {hasTextContent ? (
        <LessonSmartAssist
          hideAssistantPanel={isFocus}
          courseId={courseId}
          lessonId={activeLesson.id}
          courseTitle={courseTitle}
          lessonTitle={activeLesson.title}
        >
            <div className="space-y-6 rounded-3xl border border-white/10 bg-black/35 p-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Contenu du chapitre</h3>
                <div 
                  data-dyslexia-content="true"
                  className="prose prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-em:text-white/90 prose-a:text-blue-400 prose-a:underline prose-ul:text-white/90 prose-ol:text-white/90 prose-li:text-white/90 prose-img:rounded-lg prose-img:max-w-full max-w-none text-white/85 leading-relaxed [&_div]:[overflow:visible] [&_*]:[max-width:100%] [&_img]:[max-width:100%] [&_img]:[height:auto]"
                  style={{
                    // Permettre aux styles inline de fonctionner correctement
                    isolation: 'isolate',
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizedContent
                  }}
                />
              </div>
            </div>
          </LessonSmartAssist>
        ) : !isMediaContent ? (
          // Fallback uniquement si pas de média ET pas de contenu
          // Contenu textuel, PDF, ou quiz : afficher directement le contenu
          <LessonSmartAssist
            hideAssistantPanel={isFocus}
            courseId={courseId}
            lessonId={activeLesson.id}
            courseTitle={courseTitle}
            lessonTitle={activeLesson.title}
          >
            <div className="space-y-6 rounded-3xl border border-white/10 bg-black/35 p-8">
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-white/60">
                  <p className="text-base">Ce chapitre sera disponible prochainement.</p>
                  <span className="text-xs uppercase tracking-wide">Contenu en préparation</span>
          </div>
          </div>
          </LessonSmartAssist>
        ) : (
          // Fallback si aucune condition n'est remplie
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)] text-center text-white/70 rounded-3xl border border-white/10">
            <p>Le média de ce chapitre sera disponible prochainement.</p>
            <span className="text-xs uppercase tracking-wide">Restez connecté·e</span>
          </div>
        )}

        {!isFocus ? <LessonFlashcardsPanel flashcards={flashcards} /> : null}

        {/* Learning Strategy Modal */}
        <LearningStrategyModal
          isOpen={showLearningStrategyModal}
          onClose={() => setShowLearningStrategyModal(false)}
          onFocusModeChange={setFocusMode}
        />

        <div className="flex flex-wrap items-center gap-3">
          {previousLesson ? (
            <Button variant="ghost" asChild className="rounded-full border border-white/20 text-white hover:bg-white/10">
              <Link href={lessonHref(previousLesson.id)} prefetch={true}>Chapitre précédent</Link>
            </Button>
          ) : null}
          {nextLesson ? (
            <Button variant="ghost" asChild className="rounded-full border border-white/20 text-white hover:bg-white/10">
              <Link href={lessonHref(nextLesson.id)} prefetch={true}>Chapitre suivant</Link>
            </Button>
          ) : null}
        </div>
        </section>

        <aside
          className={cn(
            'order-1 hidden rounded-3xl border border-white/10 bg-black/55 p-5 shadow-lg shadow-black/20 lg:order-2 lg:flex lg:flex-col',
            isFocus && 'border-white/15 bg-black/80 backdrop-blur',
          )}
        >
          {renderOutline()}
        </aside>
      </div>

      <Dialog open={showMobileOutline} onOpenChange={setShowMobileOutline}>
        <DialogContent className="max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-black/95 to-black/80 text-white">
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              Sommaire
            </DialogTitle>
          </DialogHeader>
          {renderOutline()}
        </DialogContent>
      </Dialog>
    </>
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

