"use client";

import { useState } from "react";
import { Copy, Check, X, Download, Map, Shapes, Languages, AudioLines, Brain, Sparkles } from "lucide-react";

import { MindmapViewer } from "@/components/apprenant/mindmap-viewer";
import { TimelineTube } from "@/components/apprenant/timeline-tube";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { AIAction } from "@/lib/ai/utils";

type TextTransformationResultModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AIAction;
  originalText: string;
  result: string | any;
  format: "text" | "json";
  audio?: {
    base64: string;
    mimeType: string;
    voice: string;
  } | null;
};

const ACTION_ICONS = {
  rephrase: Sparkles,
  mindmap: Map,
  schema: Shapes,
  translate: Languages,
  audio: AudioLines,
  insights: Brain,
};

const ACTION_LABELS = {
  rephrase: "Reformulation",
  mindmap: "Carte mentale",
  schema: "Schéma visuel",
  translate: "Traduction",
  audio: "Script audio",
  insights: "Analyse",
};

const TITLE_CASE_WORD = /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-]*$/;

const toSentenceCase = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const words = trimmed.split(/\s+/);
  const shouldConvert =
    words.length > 1 &&
    words.every((word) => TITLE_CASE_WORD.test(word)) &&
    words.some((word) => word.length > 2);

  if (!shouldConvert) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export function TextTransformationResultModal({
  open,
  onOpenChange,
  action,
  originalText,
  result,
  format,
  audio,
}: TextTransformationResultModalProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const Icon = ACTION_ICONS[action];
  const audioSource = audio?.base64 ? `data:${audio.mimeType};base64,${audio.base64}` : null;

  const renderStructuredText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const elements: React.ReactElement[] = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();

      if (!line) {
        elements.push(<div key={`gap-${index}`} className="h-3" />);
        return;
      }

      const clean = rawLine.replace(/\*\*(.*?)\*\*/g, "$1");

      if (/^#{1,6}\s+/.test(line)) {
        const hashes = line.match(/^#+/);
        const level = hashes ? hashes[0].length : 1;
        const title = clean.replace(/^#{1,6}\s+/, "");
        const formattedTitle = toSentenceCase(title);
        const className =
          level <= 2
            ? cn("text-xl font-semibold text-slate-900 dark:text-white")
            : cn("text-lg font-semibold text-slate-800 dark:text-white/90");

        elements.push(
          <h3 key={`heading-${index}`} className={className}>
            {formattedTitle}
          </h3>,
        );
        return;
      }

      const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (orderedMatch) {
        const content = toSentenceCase(orderedMatch[2].replace(/\*\*(.*?)\*\*/g, "$1"));
        elements.push(
          <div
            key={`list-${index}`}
            className="flex items-start gap-3 text-sm text-slate-700 dark:text-white/80"
          >
            <span className="mt-0.5 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white/70">
              {orderedMatch[1]}
            </span>
            <p className="flex-1">{content}</p>
          </div>,
        );
        return;
      }

      if (/^[-*]\s+/.test(line)) {
        const bulletContent = toSentenceCase(clean.replace(/^[-*]\s+/, ""));
        elements.push(
          <div
            key={`bullet-${index}`}
            className="flex items-start gap-3 text-sm text-slate-700 dark:text-white/80"
          >
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-400 dark:bg-white/70" />
            <p className="flex-1">{bulletContent}</p>
          </div>,
        );
        return;
      }

      const paragraphContent = toSentenceCase(clean);

      elements.push(
        <p
          key={`paragraph-${index}`}
          className="text-sm leading-relaxed text-slate-700 dark:text-white/80"
        >
          {paragraphContent}
        </p>,
      );
    });

    return elements;
  };

  const handleCopy = () => {
    const textToCopy = format === "text" ? (result as string) : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (action === "audio" && audioSource && audio) {
      try {
        const byteCharacters = atob(audio.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: audio.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = audio.mimeType === "audio/wav" ? "wav" : audio.mimeType === "audio/ogg" ? "ogg" : "mp3";
        a.download = `transformation-audio-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Audio téléchargé");
        return;
      } catch (error) {
        console.error("[ai] Error downloading audio", error);
        toast.error("Impossible de télécharger l'audio");
        return;
      }
    }

    const content = format === "text" ? (result as string) : JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ACTION_LABELS[action]}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Téléchargé");
  };

  const renderContent = () => {
    if (format === "text") {
      return (
        <div className={cn("space-y-3 rounded-lg border p-4", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
          {renderStructuredText(result as string)}
        </div>
      );
    }

    // Format JSON - affichage structuré selon l'action
    const jsonResult = result as any;

    switch (action) {
      case "mindmap":
        return (
          <div className="space-y-4">
            <MindmapViewer data={jsonResult} />
            <div className={cn("rounded-lg border p-3 text-xs", isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-white/70")}>Cette carte mentale est générée automatiquement. Ajustez-la librement pour votre cours.</div>
          </div>
        );

      case "schema":
        return (
          <div className="space-y-4">
            <TimelineTube data={jsonResult} />
            <div className={cn("rounded-lg border p-3 text-xs", isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-white/70")}>Ce visuel est une proposition. Adaptez chaque étape pour correspondre à votre pédagogie.</div>
          </div>
        );

      case "insights":
        return (
          <div className={cn("space-y-4", isLight ? "text-slate-700" : "text-white/90")}>
            {jsonResult.keyConcepts && (
              <div>
                <h4 className="mb-2 font-semibold">Concepts clés</h4>
                <div className="flex flex-wrap gap-2">
                  {jsonResult.keyConcepts.map((concept: string, i: number) => (
                    <span key={i} className={cn("rounded-full px-3 py-1 text-xs", isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/80")}>
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {jsonResult.examples && jsonResult.examples.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Exemples concrets</h4>
                <ul className="space-y-1">
                  {jsonResult.examples.map((example: string, i: number) => (
                    <li key={i} className={cn("rounded-lg border p-2 text-sm", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
                      • {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {jsonResult.reviewQuestions && jsonResult.reviewQuestions.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Questions de révision</h4>
                <div className="space-y-2">
                  {jsonResult.reviewQuestions.map((q: any, i: number) => (
                    <div key={i} className={cn("rounded-lg border p-3", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
                      <p className="font-medium">Q: {q.question}</p>
                      <p className="mt-1 text-sm text-white/70">R: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "audio":
        if (audioSource) {
          return (
            <div className={cn("space-y-2", isLight ? "text-slate-700" : "text-white/90")}>
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/5",
                )}
              >
                <audio controls className="w-full" src={audioSource}>
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
                <div className="mt-2 flex flex-wrap items-center justify-between text-xs opacity-80">
                  <span>Voix&nbsp;: {audio?.voice}</span>
                  {jsonResult?.durationEstimate ? <span>Durée estimée&nbsp;: {jsonResult.durationEstimate}</span> : null}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className={cn("space-y-4", isLight ? "text-slate-700" : "text-white/90")}>
            <p
              className={cn(
                "rounded-2xl border p-4 text-sm",
                isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/5 text-white/80",
              )}
            >
              L&apos;audio n&apos;a pas pu être généré. Ci-dessous, retrouvez le script fourni par l&apos;assistant.
            </p>
            {jsonResult?.script ? (
              <div className={cn("rounded-lg border p-4 text-sm leading-relaxed", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
                {jsonResult.script.split("\n").map((line: string, i: number) => (
                  <p key={i} className={line.trim() ? "mb-2" : "mb-1"}>
                    {line || <br />}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        );

      default:
        return (
          <pre className={cn("overflow-auto rounded-lg border p-4 text-xs", isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-white/90")}>
            {JSON.stringify(jsonResult, null, 2)}
          </pre>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", isLight ? "bg-white text-slate-900" : "border-white/10 bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white")} style={{ maxWidth: "800px" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#00C6FF]" />
            {ACTION_LABELS[action]}
          </DialogTitle>
          <DialogDescription className={cn(isLight ? "text-slate-600" : "text-white/70")}>
            Résultat de la transformation de votre texte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {originalText && (
            <div>
              <h4 className={cn("mb-2 text-sm font-semibold", isLight ? "text-slate-700" : "text-white/90")}>Texte original</h4>
              <div className={cn("rounded-lg border p-3 text-sm italic", isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-white/60")}>
                {originalText.length > 200 ? `${originalText.substring(0, 200)}...` : originalText}
              </div>
            </div>
          )}

          <div>
            <h4 className={cn("mb-2 text-sm font-semibold", isLight ? "text-slate-700" : "text-white/90")}>Résultat</h4>
            {renderContent()}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={cn(
                "rounded-full",
                isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
              )}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copié" : "Copier"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className={cn(
                "rounded-full",
                isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
              )}
            >
              <Download className="mr-2 h-4 w-4" />
              {action === "audio" && audioSource ? "Télécharger l'audio" : "Télécharger"}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className={cn(
              "rounded-full",
              isLight ? "text-slate-600 hover:bg-slate-100" : "text-white/80 hover:bg-white/10",
            )}
          >
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


