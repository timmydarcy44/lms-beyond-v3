"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Sparkles,
  Languages,
  AudioLines,
  Map,
  Shapes,
  FileText,
  ScanSearch,
} from "lucide-react";
import { toast } from "sonner";

import { ByoundAiPanel, historyMetric } from "@/components/apprenant/ai/byound-ai-panel";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import type { AIAction } from "@/lib/ai/utils";
import { isValidAIAction } from "@/lib/ai/utils";

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
    shortLabel: "Reformuler",
    description: "Simplifie ou enrichit le passage sélectionné",
    icon: Sparkles,
  },
  {
    id: "mindmap",
    label: "Créer une map",
    shortLabel: "Transformer en map",
    description: "Génère une carte mentale des idées clés",
    icon: Map,
  },
  {
    id: "schema",
    label: "Créer un schéma",
    shortLabel: "Transformer en schéma",
    description: "Propose un schéma visuel pour visualiser le concept",
    icon: Shapes,
  },
  {
    id: "synthesis",
    label: "Créer une fiche synthétique",
    shortLabel: "Fiche synthétique",
    description: "Résumé structuré avec définitions, schémas et points clés",
    icon: FileText,
  },
  {
    id: "translate",
    label: "Traduire",
    shortLabel: "Traduire",
    description: "Traduit le contenu dans la langue de votre choix",
    icon: Languages,
  },
  {
    id: "audio",
    label: "Transformer en audio",
    shortLabel: "Transformer en audio",
    description: "Crée une version audio du passage",
    icon: AudioLines,
  },
  {
    id: "insights",
    label: "Analyser",
    shortLabel: "Analyser",
    description: "Identifie exemples, analogies et questions de révision",
    icon: ScanSearch,
  },
];

const VOICE_OPTIONS = [
  { id: "alloy", label: "Alloy � équilibré" },
  { id: "verse", label: "Verse � narratif" },
  { id: "sage", label: "Sage � posé" },
  { id: "sol", label: "Sol � chaleureux" },
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
  lessonTitle,
}: LessonSmartAssistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [, setSelection] = useState<SelectionState | null>(null);
  const [selectionExcerpt, setSelectionExcerpt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRephraseOptions, setShowRephraseOptions] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [transformationResult, setTransformationResult] = useState<TransformationResultState | null>(null);
  const [resultFresh, setResultFresh] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);
  const lastLaunchRef = useRef<{ action: AIAction; options: Record<string, any>; text: string } | null>(null);
  const { isDyslexiaMode } = useDyslexiaMode();

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
    if (isUuid(courseId)) {
      params.set("courseId", courseId);
      params.set("limit", "50");
    } else if (isUuid(lessonId)) {
      params.set("lessonId", lessonId);
    } else if (lessonId && String(lessonId).trim()) {
      params.set("chapterLocalId", String(lessonId).trim());
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
          data.items.map((item: any) => {
            const rawT = item.transformation;
            const transformation = Array.isArray(rawT) ? rawT[0] ?? null : rawT ?? null;
            return {
              id: item.id,
              created_at: item.created_at,
              lesson_id: item.lesson_id ?? null,
              course_id: item.course_id ?? null,
              selection_excerpt: item.selection_excerpt ?? null,
              action: item.action as AIAction,
              options: item.options ?? null,
              transformation,
            };
          }),
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

const executeAction = async (actionId: AIAction, options: Record<string, any> = {}, textOverride?: string) => {
  const textToTransform = (textOverride || selectionExcerpt).trim();
  if (textToTransform.length < 5) {
    setTransformError("Sélectionne un passage du sous-chapitre.");
    return;
  }

  if (isProcessing) {
    return;
  }

  lastLaunchRef.current = { action: actionId, options, text: textToTransform };
  setTransformError(null);
  setIsProcessing(true);

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
          chapterLocalId: lessonId && !isUuid(lessonId) ? String(lessonId) : null,
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
    setResultFresh(true);
    setPersisted(Boolean(data.saved));
    if (!data.saved) {
      toast.error(typeof data.saveError === "string" && data.saveError ? data.saveError : "Transformation affichée, enregistrement impossible");
    }
    setSelection(null);
    setSelectionExcerpt("");
    void fetchHistory();
  } catch (error) {
    console.error("[ai] Error transforming text", error);
    setTransformError(error instanceof Error ? error.message : "Erreur lors de la transformation");
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

  const lessonText = () =>
    (containerRef.current?.querySelector("[data-dyslexia-content]")?.textContent ?? "").replace(/\s+/g, " ").trim();
  const text = selectionExcerpt || lessonText();
  if (text.length < 5) {
    setTransformError("Sélectionne un passage du sous-chapitre.");
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

  void executeAction(actionId as AIAction, finalOptions, text);
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
    setResultFresh(false);
    setPersisted(true);
    setTransformError(null);
  };

  const lessonLabel = lessonTitle?.trim() || "Sous-chapitre";

  const copyResult = async () => {
    if (!transformationResult) return;
    const value = transformationResult.result;
    const text =
      typeof value === "string"
        ? value
        : typeof value?.script === "string"
          ? value.script
          : JSON.stringify(value, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const saveResult = () => {
    if (!persisted) {
      const last = lastLaunchRef.current;
      if (!last) {
        toast.error("Rien à enregistrer");
        return;
      }
      void executeAction(last.action, last.options, last.text);
      return;
    }
    void fetchHistory();
    toast.success("Transformation enregistrée");
  };

  const regenerate = () => {
    const last = lastLaunchRef.current;
    if (!last) return;
    void executeAction(last.action, last.options, last.text);
  };

  if (hideAssistantPanel) {
    return <div ref={containerRef}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
      <ByoundAiPanel
        dyslexia={isDyslexiaMode}
        lessonTitle={lessonLabel}
        processing={isProcessing}
        error={transformError}
        result={
          transformationResult
            ? {
                action: transformationResult.action,
                result: transformationResult.result,
                format: transformationResult.format,
                audio: transformationResult.audio,
                fresh: resultFresh,
              }
            : null
        }
        history={history.map((item) => ({
          id: item.id,
          action: item.action,
          created_at: item.created_at,
          lessonTitle: lessonLabel,
          value: historyMetric(item.action, item.transformation?.result_json ?? item.transformation?.result_text),
        }))}
        historyLoading={isHistoryLoading}
        onLaunch={(action, options) => handleAction(action, options)}
        onSave={saveResult}
        onCopy={() => void copyResult()}
        onRegenerate={regenerate}
        onRetry={regenerate}
        onOpenHistory={(id) => {
          const item = history.find((entry) => entry.id === id);
          if (item) openHistoryItem(item);
        }}
      />
    </div>
  );
}
