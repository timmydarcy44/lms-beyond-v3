"use client";

import { Children, isValidElement, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Copy, Check, X, Download, Printer, Map, Shapes, Languages, AudioLines, Brain, Sparkles, FileText, FileImage } from "lucide-react";

import { MermaidDiagram } from "@/components/apprenant/ai/mermaid-diagram";
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
import {
  copyRichContent,
  exportElementAsPdf,
  exportElementAsPng,
  htmlToPlainText,
  printDomElement,
  waitForDiagramsReady,
} from "@/lib/ai/transformation-export";

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
  synthesis: FileText,
};

const ACTION_LABELS: Record<AIAction, string> = {
  rephrase: "Reformulation",
  mindmap: "Carte mentale",
  schema: "Schéma visuel",
  translate: "Traduction",
  audio: "Script audio",
  insights: "Analyse",
  synthesis: "Fiche synthétique",
};

/** Titres « plain text » souvent renvoyés sans ## par le modèle → promotion Markdown. */
function preprocessTransformationMarkdown(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((line) => {
      const s = line.trim();
      if (!s || /^#{1,6}\s/.test(s)) return line;
      if (/^introduction\b/i.test(s) && s.length < 220) return `## ${s}`;
      if (/^définition\s*:/i.test(s)) return `## ${s}`;
      if (/^exemple concret\s*:/i.test(s)) return `## ${s}`;
      if (/^synthèse\b/i.test(s) && s.length < 160) return `## ${s}`;
      if (/^conclusion\b/i.test(s) && s.length < 160) return `## ${s}`;
      if (/^mise en pratique\b/i.test(s) && s.length < 180) return `## ${s}`;
      if (/^schémas et relations\b/i.test(s) && s.length < 200) return `## ${s}`;
      if (/^définitions clés\b/i.test(s) && s.length < 200) return `## ${s}`;
      if (/^questions de révision\b/i.test(s) && s.length < 200) return `## ${s}`;
      return line;
    })
    .join("\n");
}

function looksLikeMermaidSource(code: string): boolean {
  const t = code.trim();
  return /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|mindmap|pie)\b/i.test(t);
}

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
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const printRootRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const Icon = ACTION_ICONS[action];
  const audioSource = audio?.base64 ? `data:${audio.mimeType};base64,${audio.base64}` : null;

  const markdownSource = useMemo(() => {
    if (format !== "text") return "";
    return preprocessTransformationMarkdown(String(result ?? ""));
  }, [format, result]);

  /** Toujours en thème clair dans la zone exportable (PDF/PNG/Word). */
  const markdownComponents = useMemo((): Components => {
    const muted = "text-slate-600";
    const body = "text-slate-800";
    const h1 = "text-slate-950";
    const h23 = "text-slate-900";
    const border = "border-slate-200";
    const codeBg = "bg-slate-100 text-slate-900";

    return {
      h1: ({ children }) => (
        <h2 className={cn("mt-5 mb-2 text-2xl font-bold leading-snug first:mt-0", h1)}>{children}</h2>
      ),
      h2: ({ children }) => (
        <h3 className={cn("mt-5 mb-2 text-xl font-semibold leading-snug first:mt-0", h23)}>{children}</h3>
      ),
      h3: ({ children }) => (
        <h4 className={cn("mt-4 mb-1.5 text-lg font-semibold leading-snug first:mt-0", h23)}>{children}</h4>
      ),
      h4: ({ children }) => (
        <h5 className={cn("mt-3 mb-1 text-base font-semibold first:mt-0", h23)}>{children}</h5>
      ),
      p: ({ children }) => <p className={cn("my-2 text-[15px] leading-relaxed last:mb-0", body)}>{children}</p>,
      ul: ({ children }) => (
        <ul className={cn("my-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed", body)}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className={cn("my-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed", body)}>{children}</ol>
      ),
      li: ({ children }) => <li className="marker:font-medium">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
      em: ({ children }) => <em className="italic opacity-95">{children}</em>,
      blockquote: ({ children }) => (
        <blockquote className={cn("my-3 border-l-4 pl-4 italic", border, muted)}>{children}</blockquote>
      ),
      hr: () => <hr className={cn("my-6 border-t", border)} />,
      a: ({ href, children }) => (
        <a
          href={href}
          className="text-sky-700 underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      code: ({ className, children, ...props }) => {
        const inline = !className?.includes("language-");
        if (!inline && className?.includes("language-mermaid")) {
          return null;
        }
        if (inline) {
          return (
            <code className={cn("rounded px-1 py-0.5 text-[0.9em] font-mono", codeBg)} {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className={cn("block overflow-x-auto rounded-lg p-3 text-xs font-mono", codeBg)} {...props}>
            {children}
          </code>
        );
      },
      pre: ({ children }) => {
        for (const child of Children.toArray(children)) {
          if (isValidElement(child)) {
            const childProps = child.props as { className?: string; children?: React.ReactNode };
            const code = String(childProps.children ?? "").trim();
            if (childProps.className?.includes("language-mermaid") || looksLikeMermaidSource(code)) {
              return <MermaidDiagram code={code} theme="light" />;
            }
          }
        }
        return <pre className={cn("my-3 overflow-x-auto rounded-lg", codeBg)}>{children}</pre>;
      },
      table: ({ children }) => (
        <div className={cn("my-4 overflow-x-auto rounded-lg border", border)}>
          <table className={cn("w-full min-w-[280px] border-collapse text-left text-sm", body)}>{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
      th: ({ children }) => (
        <th className={cn("border px-3 py-2 font-semibold", border)}>{children}</th>
      ),
      td: ({ children }) => (
        <td className={cn("border px-3 py-2 align-top", border)}>{children}</td>
      ),
    };
  }, []);

  const handleCopy = async () => {
    if (action === "audio" && audioSource && audio) {
      const script = (result as { script?: string })?.script ?? String(result ?? "");
      try {
        await navigator.clipboard.writeText(script);
        setCopied(true);
        toast.success("Script copié");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Impossible de copier");
      }
      return;
    }

    const el = printRootRef.current;
    if (el) {
      await waitForDiagramsReady(el);
      const html = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111;">${el.innerHTML}</div>`;
      const plain = htmlToPlainText(el.innerHTML);
      const rich = await copyRichContent(html, plain);
      setCopied(true);
      toast.success(
        rich
          ? "Copié avec mise en forme — collez dans Word (Ctrl+V)"
          : "Copié en texte brut",
      );
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    const textToCopy = format === "text" ? (result as string) : JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  };

  const baseExportName = `${ACTION_LABELS[action].replace(/\s+/g, "-")}_${Date.now()}`;

  const handleDownloadPng = async () => {
    if (action === "audio" && audioSource) {
      toast.error("Utilisez « Télécharger l'audio » pour cette transformation.");
      return;
    }
    const el = printRootRef.current;
    if (!el) {
      toast.error("Rien à exporter");
      return;
    }
    setExporting("png");
    try {
      await exportElementAsPng(el, `${baseExportName}.png`);
      toast.success("Image PNG téléchargée");
    } catch (e) {
      console.error("[export] PNG failed", e);
      toast.error("Échec de l'export PNG");
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (action === "audio" && audioSource) {
      toast.error("Utilisez « Télécharger l'audio » pour cette transformation.");
      return;
    }
    const el = printRootRef.current;
    if (!el) {
      toast.error("Rien à exporter");
      return;
    }
    setExporting("pdf");
    try {
      await exportElementAsPdf(el, `${baseExportName}.pdf`);
      toast.success("PDF téléchargé");
    } catch (e) {
      console.error("[export] PDF failed", e);
      toast.error("Échec de l'export PDF");
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadAudio = () => {
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
  };

  const handlePrint = () => {
    const ok = printDomElement(printRootRef.current, ACTION_LABELS[action]);
    if (!ok) {
      toast.error("Autorisez les fenêtres pop-up pour imprimer, ou utilisez Télécharger.");
    }
  };

  const renderContent = () => {
    if (format === "text") {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2 [&_*:first-child]:mt-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdownSource}
          </ReactMarkdown>
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
                    <li
                      key={i}
                      className={cn(
                        "rounded-lg border p-2 text-sm",
                        isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/10 bg-white/5 text-white/90",
                      )}
                    >
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
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3",
                        isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/10 bg-white/5 text-white/90",
                      )}
                    >
                      <p className="font-medium">Q: {q.question}</p>
                      <p className={cn("mt-1 text-sm", isLight ? "text-slate-600" : "text-white/75")}>R: {q.answer}</p>
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
              <div
                className={cn(
                  "rounded-lg border p-4 text-sm leading-relaxed",
                  isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/10 bg-white/5 text-white/90",
                )}
              >
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
              <div className={cn("rounded-lg border p-3 text-sm italic", isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-white/80")}>
                {originalText.length > 200 ? `${originalText.substring(0, 200)}...` : originalText}
              </div>
            </div>
          )}

          <div>
            <h4 className={cn("mb-2 text-sm font-semibold", isLight ? "text-slate-700" : "text-white/90")}>Résultat</h4>
            <div
              ref={printRootRef}
              id="transformation-result-print-root"
              className="rounded-lg bg-white p-4 text-slate-900"
            >
              {renderContent()}
            </div>
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
            {action === "audio" && audioSource ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAudio}
                className={cn(
                  "rounded-full",
                  isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger l&apos;audio
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting !== null}
                  onClick={() => void handleDownloadPdf()}
                  className={cn(
                    "rounded-full",
                    isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting === "pdf" ? "PDF…" : "PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting !== null}
                  onClick={() => void handleDownloadPng()}
                  className={cn(
                    "rounded-full",
                    isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
                  )}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  {exporting === "png" ? "PNG…" : "PNG"}
                </Button>
              </>
            )}
            {!(action === "audio" && audioSource) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className={cn(
                  "rounded-full",
                  isLight ? "border-slate-200 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white hover:bg-white/10",
                )}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            ) : null}
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


