"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Sparkles, Languages, AudioLines, Brain, Map, Shapes, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TextTransformationResultModal } from "@/components/apprenant/ai/text-transformation-result-modal";
import type { AIAction } from "@/lib/ai/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LessonSmartAssistProps = {
  children: React.ReactNode;
  className?: string;
  hideAssistantPanel?: boolean;
  courseId?: string;
  lessonId?: string;
  courseTitle?: string;
  lessonTitle?: string;
};

type SelectionState = {
  text: string;
  top: number;
  left: number;
};

const REPHRASE_OPTIONS = [
  {
    id: "simplify",
    title: "Reformulation simple",
    description: "Texte plus court, vocabulaire accessible, idéal pour réviser rapidement.",
  },
  {
    id: "theoretical",
    title: "Reformulation théorique",
    description: "Met en avant les définitions, notions clés et le cadre conceptuel.",
  },
  {
    id: "examples",
    title: "Reformulation avec exemples",
    description: "Ajoute des exemples ou analogies concrètes pour chaque idée importante.",
  },
  {
    id: "structured",
    title: "Reformulation structurée",
    description: "Organise le contenu en étapes ou liste à puces faciles à mémoriser.",
  },
] as const;

const ACTIONS = [
  {
    id: "rephrase",
    label: "Reformuler",
    description: "Simplifie ou enrichit le passage sélectionné",
    icon: Sparkles,
  },
  {
    id: "mindmap",
    label: "Créer une map",
    description: "Génère une carte mentale des idées clés",
    icon: Map,
  },
  {
    id: "schema",
    label: "Créer un schéma",
    description: "Propose un schéma visuel pour visualiser le concept",
    icon: Shapes,
  },
  {
    id: "translate",
    label: "Traduire",
    description: "Traduit le contenu dans la langue de votre choix",
    icon: Languages,
  },
  {
    id: "audio",
    label: "Transformer en audio",
    description: "Crée une version audio du passage",
    icon: AudioLines,
  },
  {
    id: "insights",
    label: "Analyser",
    description: "Identifie exemples, analogies et questions de révision",
    icon: Brain,
  },
];

const VOICE_OPTIONS = [
  { id: "alloy", label: "Alloy — équilibré" },
  { id: "verse", label: "Verse — narratif" },
  { id: "sage", label: "Sage — posé" },
  { id: "sol", label: "Sol — chaleureux" },
] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_REGEX.test(value);

type HistoryItem = {
  id: string;
  created_at: string;
  lesson_id: string | null;
  course_id: string | null;
  selection_excerpt: string | null;
  action: AIAction;
  options: Record<string, unknown> | null;
  transformation: {
    id: string;
    format: "text" | "json";
    result_text: string | null;
    result_json: any | null;
    audio_base64: string | null;
    audio_mime_type: string | null;
    audio_voice: string | null;
    options: Record<string, unknown> | null;
  } | null;
};

type TransformationResultState = {
  action: AIAction;
  result: string | any;
  format: "text" | "json";
  originalText: string;
  audio?: {
    base64: string;
    mimeType: string;
    voice: string;
  } | null;
};

export function LessonSmartAssist({
  children,
  className,
  hideAssistantPanel = false,
  courseId,
  lessonId,
  courseTitle,
  lessonTitle,
}: LessonSmartAssistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [selectionExcerpt, setSelectionExcerpt] = useState<string>("");
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRephraseOptions, setShowRephraseOptions] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transformationResult, setTransformationResult] = useState<TransformationResultState | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const gradientTextStyle = {
    backgroundImage: "linear-gradient(90deg, #00C6FF 0%, #8E2DE2 50%, #FF6FD8 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  } as const;

  useEffect(() => {
    const handleSelection = () => {
      const selectionObject = window.getSelection();
      if (!selectionObject || selectionObject.isCollapsed) {
        setSelection(null);
        return;
      }

      const text = selectionObject.toString().trim();
      if (!text || text.length < 5) {
        setSelection(null);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const anchorNode = selectionObject.anchorNode;
      if (anchorNode && !container.contains(anchorNode)) {
        setSelection(null);
        return;
      }

      let range: Range;
      try {
        range = selectionObject.getRangeAt(0);
      } catch (error) {
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (!rect || !containerRect) {
        setSelection(null);
        return;
      }

      const top = rect.top - containerRect.top - 48;
      const center = rect.left - containerRect.left + rect.width / 2;
      const left = containerRect.width <= 160 ? containerRect.width / 2 : Math.min(Math.max(center, 80), containerRect.width - 80);

      setSelection({
        text,
        top: Math.max(0, top),
        left,
      });
      setSelectionExcerpt(text);
    };

    const deferredHandle = () => {
      requestAnimationFrame(handleSelection);
    };

    document.addEventListener("mouseup", deferredHandle);
    document.addEventListener("keyup", deferredHandle);

    return () => {
      document.removeEventListener("mouseup", deferredHandle);
      document.removeEventListener("keyup", deferredHandle);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (toolbarRef.current?.contains(target)) {
        return;
      }

      if (!containerRef.current?.contains(target)) {
        setSelection(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!lessonId && !courseId) {
      setHistory([]);
      setIsHistoryLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (isUuid(lessonId)) {
      params.set("lessonId", lessonId);
    }
    if (isUuid(courseId)) {
      params.set("courseId", courseId);
    }

    const query = params.toString();
    if (!query) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const response = await fetch(`/api/ai/lesson-assistant?${query}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.error ? String(data.error) : `HTTP ${response.status}`;

        if (
          response.status === 500 &&
          typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("lesson_ai_user_transformations")
        ) {
          setHistory([]);
          return;
        }

        throw new Error(`Request failed with status ${response.status}`);
      }

      if (data?.success && Array.isArray(data.items)) {
        setHistory(
          data.items.map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            lesson_id: item.lesson_id ?? null,
            course_id: item.course_id ?? null,
            selection_excerpt: item.selection_excerpt ?? null,
            action: item.action as AIAction,
            options: item.options ?? null,
            transformation: item.transformation ?? null,
          })),
        );
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("[ai] Error loading transformation history", error);
      toast.error("Impossible de charger vos transformations");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!selectionExcerpt && showRephraseOptions) {
      setShowRephraseOptions(false);
    }
  }, [selectionExcerpt, showRephraseOptions]);

const executeAction = async (actionId: AIAction, options: Record<string, any> = {}) => {
  const textToTransform = selectionExcerpt;
  if (!textToTransform) {
    toast.error("Sélectionnez un passage avant de lancer l'action.");
    return;
  }

  if (isProcessing) {
    return;
  }

  setIsProcessing(true);
  setHoveredAction(null);

  try {
    const response = await fetch("/api/ai/lesson-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToTransform,
        action: actionId,
        options,
        context: {
          courseId: isUuid(courseId) ? courseId : null,
          lessonId: isUuid(lessonId) ? lessonId : null,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la transformation");
    }

    const data = await response.json();

    if (!data.success || !data.result) {
      throw new Error("Réponse invalide de l'API");
    }

    setTransformationResult({
      action: actionId,
      result: data.result,
      format: data.format,
      originalText: textToTransform,
      audio: data.audio ?? null,
    });
    setShowResultModal(true);
    setSelection(null);
    setSelectionExcerpt("");
    void fetchHistory();
  } catch (error) {
    console.error("[ai] Error transforming text", error);
    toast.error(error instanceof Error ? error.message : "Erreur lors de la transformation");
  } finally {
    setIsProcessing(false);
  }
};

const handleAction = (actionId: string, options?: Record<string, any>) => {
  const action = ACTIONS.find((item) => item.id === actionId);
  if (!action) return;

  if (!isValidAIAction(actionId)) {
    toast.error("Action non valide");
    return;
  }

  if (!selectionExcerpt) {
    toast("Sélectionnez un passage", {
      description: "Surlignez le texte que vous souhaitez transformer.",
    });
    return;
  }

  if (actionId === "rephrase" && (!options || !options.style)) {
    setShowRephraseOptions(true);
    return;
  }

  let finalOptions = options ?? {};
  if (actionId === "audio") {
    finalOptions = { ...finalOptions, voice: selectedVoice };
  }

  void executeAction(actionId as AIAction, finalOptions);
};

  const getActionLabel = (action: AIAction) => ACTIONS.find((item) => item.id === action)?.label ?? action;

  const getVoiceLabel = (voiceId?: string | null) =>
    VOICE_OPTIONS.find((voice) => voice.id === voiceId)?.label ?? (voiceId ?? "Voix IA");

  const getStyleLabel = (styleId?: string | null) =>
    styleId ? REPHRASE_OPTIONS.find((option) => option.id === styleId)?.title : undefined;

  const getOptionString = (options: Record<string, unknown> | null | undefined, key: string): string | undefined => {
    if (!options) return undefined;
    const value = options[key];
    return typeof value === "string" ? value : undefined;
  };

  const openHistoryItem = (item: HistoryItem) => {
    const transformation = item.transformation;
    if (!transformation) {
      toast.error("Résultat introuvable pour cette transformation.");
      return;
    }

    const format = (transformation.format as "text" | "json") ?? "text";
    const resultValue =
      format === "text" ? transformation.result_text : transformation.result_json ?? transformation.result_text;

    const audioData =
      transformation.audio_base64 && transformation.audio_mime_type
        ? {
            base64: transformation.audio_base64,
            mimeType: transformation.audio_mime_type,
            voice: transformation.audio_voice ?? selectedVoice,
          }
        : null;

    if (!resultValue && !audioData) {
      toast.error("Impossible d'afficher cette transformation.");
      return;
    }

    if (audioData?.voice) {
      setSelectedVoice(audioData.voice);
    }

    setTransformationResult({
      action: item.action,
      result: resultValue ?? "",
      format,
      originalText: item.selection_excerpt ?? "",
      audio: audioData,
    });
    setShowResultModal(true);
    setShowHistoryModal(false);
  };

  function isValidAIAction(action: string): action is AIAction {
    return ["rephrase", "mindmap", "schema", "translate", "audio", "insights"].includes(action);
  }

  const toolbarLeft = selection ? selection.left : 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {selection ? (
        <div
          ref={toolbarRef}
          className={cn(
            "pointer-events-auto absolute z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 shadow-xl backdrop-blur-md",
            isLight
              ? "border-slate-200 bg-white text-slate-700 shadow-slate-300/60"
              : "border-white/15 bg-gradient-to-r from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white shadow-black/25",
          )}
          style={{ top: selection.top, left: toolbarLeft }}
        >
          {ACTIONS.slice(0, 4).map((action) => {
            const Icon = action.icon;
            const isHovered = hoveredAction === action.id;
            return (
              <button
                key={action.id}
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition",
                  isLight ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/10",
                )}
                onClick={() => handleAction(action.id)}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction((prev) => (prev === action.id ? null : prev))}
              >
                <Icon className="h-3.5 w-3.5" />
                <span
                  className={cn(
                    isHovered ? "text-transparent" : isLight ? "text-slate-600" : "text-white",
                    "transition-colors",
                  )}
                  style={isHovered ? gradientTextStyle : undefined}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className={cn(
              "rounded-full px-2 py-1 text-xs uppercase tracking-[0.3em] transition",
              isLight ? "text-slate-500 hover:text-slate-700" : "text-white/60 hover:text-white",
            )}
            onClick={() => {
              setSelection(null);
              setShowRephraseOptions(false);
            }}
          >
            Fermer
          </button>
        </div>
      ) : null}

      <div className={cn("space-y-6 text-sm leading-relaxed", isLight ? "text-slate-700" : "text-white/85")}>{children}</div>

      {isProcessing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium shadow-xl",
              isLight ? "bg-white text-slate-700 shadow-slate-300/60" : "bg-[#0f172a]/90 text-white shadow-black/40",
            )}
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#8E2DE2]" />
            <span>Transformation en cours...</span>
          </div>
        </div>
      )}

      <Dialog open={showRephraseOptions} onOpenChange={setShowRephraseOptions}>
        <DialogContent
          className={cn(
            "max-w-xl space-y-4",
            isLight ? "bg-white text-slate-900" : "border-white/10 bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8E2DE2]" />
              Choisis ton style de reformulation
            </DialogTitle>
            <DialogDescription className={cn(isLight ? "text-slate-600" : "text-white/70")}>
              Sélectionne le ton souhaité avant de lancer l&apos;assistant.
            </DialogDescription>
          </DialogHeader>

          {selectionExcerpt ? (
            <div
              className={cn(
                "rounded-xl border p-4 text-sm leading-relaxed",
                isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-white/70",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-60">Passage sélectionné</p>
              <p className="mt-2">{selectionExcerpt.length > 180 ? `${selectionExcerpt.slice(0, 180)}…` : selectionExcerpt}</p>
            </div>
          ) : null}

          <div className="grid gap-3">
            {REPHRASE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition",
                  isLight
                    ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
                  isProcessing && "cursor-not-allowed opacity-60",
                )}
                onClick={() => {
                  setShowRephraseOptions(false);
                  void executeAction("rephrase", { style: option.id });
                }}
                disabled={isProcessing}
              >
                <p className="text-sm font-semibold">{option.title}</p>
                <p className={cn("mt-1 text-xs", isLight ? "text-slate-500" : "text-white/60")}>{option.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent
          className={cn(
            "max-w-3xl space-y-4",
            isLight ? "bg-white text-slate-900" : "border-white/10 bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#8E2DE2]" />
              Mes transformations sauvegardées
            </DialogTitle>
            <DialogDescription className={cn(isLight ? "text-slate-600" : "text-white/70")}>
              Retrouvez les reformulations, analyses et audios générés pour {lessonTitle ?? "ce chapitre"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-white/60")}>
              {courseTitle ? `Formation : ${courseTitle}` : null}
              {courseTitle && lessonTitle ? " • " : ""}
              {lessonTitle ? `Chapitre : ${lessonTitle}` : null}
            </p>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2 rounded-full",
                isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
              )}
              onClick={() => void fetchHistory()}
              disabled={isHistoryLoading}
            >
              {isHistoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              Actualiser
            </Button>
          </div>

          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-10 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#8E2DE2]" />
              Chargement de vos transformations...
            </div>
          ) : history.length === 0 ? (
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-white/70")}>
              Vous n&apos;avez pas encore sauvegardé de transformation pour ce chapitre.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {history.map((item) => {
                const transformation = item.transformation;
                const format = (transformation?.format as "text" | "json") ?? "text";
                const hasResult =
                  !!transformation &&
                  ((format === "text" && transformation.result_text) ||
                    (format === "json" && transformation.result_json) ||
                    (transformation.audio_base64 && transformation.audio_mime_type));

                const createdAt = item.created_at ? new Date(item.created_at) : null;
                const formattedDate = createdAt
                  ? createdAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                  : "";
                const excerpt =
                  item.selection_excerpt && item.selection_excerpt.length > 160
                    ? `${item.selection_excerpt.slice(0, 160)}…`
                    : item.selection_excerpt ?? "";
                const styleLabel =
                  item.action === "rephrase"
                    ? getStyleLabel(getOptionString(item.options, "style"))
                    : undefined;
                const voiceLabel =
                  item.action === "audio"
                    ? getVoiceLabel(
                        transformation?.audio_voice ??
                          getOptionString(transformation?.options as Record<string, unknown> | null | undefined, "voice") ??
                          getOptionString(item.options, "voice"),
                      )
                    : undefined;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 transition",
                      isLight
                        ? "border-slate-200 bg-white hover:border-slate-300"
                        : "border-white/10 bg-white/5 hover:border-white/30",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gradient-to-r from-[#00C6FF]/20 via-[#8E2DE2]/20 to-[#FF6FD8]/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#8E2DE2]">
                            {getActionLabel(item.action)}
                          </span>
                          {formattedDate ? (
                            <span className={cn("text-xs", isLight ? "text-slate-500" : "text-white/60")}>{formattedDate}</span>
                          ) : null}
                        </div>
                        {excerpt ? (
                          <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-white/70")}>
                            « {excerpt} »
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {styleLabel ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-1",
                                isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70",
                              )}
                            >
                              {styleLabel}
                            </span>
                          ) : null}
                          {voiceLabel ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-1",
                                isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70",
                              )}
                            >
                              {voiceLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "self-start rounded-full",
                          isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
                        )}
                        onClick={() => openHistoryItem(item)}
                        disabled={!hasResult}
                      >
                        Consulter
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {transformationResult && (
        <TextTransformationResultModal
          open={showResultModal}
          onOpenChange={setShowResultModal}
          action={transformationResult.action}
          originalText={transformationResult.originalText}
          result={transformationResult.result}
          format={transformationResult.format}
          audio={transformationResult.audio ?? null}
        />
      )}

      {hideAssistantPanel ? null : (
        <div
          className={cn(
            "mt-8 rounded-3xl border p-6 transition-colors",
            isLight
              ? "border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-200/60"
              : "border-white/10 bg-gradient-to-br from-[#0f172a]/70 via-[#111827]/80 to-[#1f2937]/70 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.9)]",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-[0.3em]", isLight ? "text-slate-400" : "text-white/60")}>
                Outils immédiats du chapitre
              </p>
              <h3 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>
                Transformez ce contenu selon vos besoins
              </h3>
            </div>
            <Button
              variant="outline"
              className={cn(
                "rounded-full text-xs font-semibold uppercase tracking-[0.3em]",
                isLight
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20",
              )}
              onClick={() => {
                toast("Sélectionnez un passage", {
                  description: "Surlignez le texte à transformer pour lancer l'aide IA.",
                });
              }}
            >
              Comment ça marche ?
            </Button>
          </div>

          {selectionExcerpt ? (
            <div
              className={cn(
                "mt-4 space-y-3 rounded-2xl border p-4 text-sm",
                isLight
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-white/10 bg-white/5 text-white/80",
              )}
            >
              <p className={cn("text-xs font-semibold uppercase tracking-[0.3em]", isLight ? "text-slate-400" : "text-white/50")}>Passage sélectionné</p>
              <p className="leading-relaxed">{selectionExcerpt}</p>
            </div>
          ) : (
            <p className={cn("mt-4 text-sm", isLight ? "text-slate-500" : "text-white/60")}>
              Surlignez n'importe quel passage pour lancer une reformulation, une traduction, une carte mentale ou une version audio instantanée.
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    "flex h-full flex-col justify-between rounded-2xl border p-4 text-left transition",
                    isLight
                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
                  )}
                  onClick={() => handleAction(action.id)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction((prev) => (prev === action.id ? null : prev))}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF]/70 via-[#8E2DE2]/70 to-[#FF6FD8]/70 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold uppercase tracking-[0.3em]",
                        isHovered ? "text-transparent" : isLight ? "text-slate-700" : "text-white/80",
                      )}
                      style={isHovered ? gradientTextStyle : undefined}
                    >
                      {action.label}
                    </span>
                  </div>
                  <p className={cn("mt-3 text-xs", isLight ? "text-slate-500" : "text-white/60")}>{action.description}</p>
                  {action.id === "audio" ? (
                    <p
                      className={cn(
                        "mt-2 text-xs font-semibold",
                        isLight ? "text-slate-600" : "text-white/70",
                      )}
                    >
                      Voix actuelle : {getVoiceLabel(selectedVoice)}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "mt-6 rounded-2xl border p-4",
              isLight
                ? "border-slate-200 bg-white text-slate-700"
                : "border-white/10 bg-white/5 text-white/80",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.3em]",
                    isLight ? "text-slate-400" : "text-white/50",
                  )}
                >
                  Voix IA
                </p>
                <p className={cn("text-sm", isLight ? "text-slate-600" : "text-white/70")}>
                  Choisissez la voix utilisée pour la transformation audio.
                </p>
              </div>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger
                  className={cn(
                    "mt-1 w-full min-w-[220px] rounded-full text-left sm:mt-0",
                    isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/20 bg-white/10 text-white",
                  )}
                >
                  <SelectValue placeholder="Sélectionner une voix" />
                </SelectTrigger>
                <SelectContent className={cn(isLight ? "" : "bg-[#0f172a] text-white")}>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-white/60")}>
              {history.length > 0
                ? `${history.length} transformation${history.length > 1 ? "s" : ""} sauvegardée${history.length > 1 ? "s" : ""} pour ce chapitre.`
                : "Aucune transformation sauvegardée pour ce chapitre pour le moment."}
            </p>
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.3em]",
                isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
              )}
              onClick={() => setShowHistoryModal(true)}
              disabled={isHistoryLoading}
            >
              {isHistoryLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <History className="h-4 w-4" />
                  Mes transformations
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

