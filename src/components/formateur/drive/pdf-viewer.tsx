"use client";

import { useState, useEffect } from "react";
import { FileText, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PdfViewerProps = {
  fileUrl: string | null;
  documentTitle: string;
  documentId: string;
  className?: string;
};

export function PdfViewer({ fileUrl, documentTitle, documentId, className }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (fileUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [fileUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRegeneratePdf = async () => {
    try {
      toast.loading("Régénération du PDF en cours...", { id: "regenerate-pdf" });
      
      const response = await fetch(`/api/drive/documents/${documentId}/regenerate-pdf`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error || "Erreur lors de la régénération"}: ${data.details}`
          : data.error || "Erreur lors de la régénération";
        console.error("[PdfViewer] Error regenerating PDF:", {
          status: response.status,
          error: data,
        });
        throw new Error(errorMessage);
      }
      
      if (data.fileUrl) {
        toast.success("PDF généré avec succès", { id: "regenerate-pdf" });
        // Recharger la page pour afficher le nouveau PDF
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Aucune URL retournée");
      }
    } catch (error) {
      console.error("[PdfViewer] Error in handleRegeneratePdf:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Impossible de régénérer le PDF",
        id: "regenerate-pdf",
      });
    }
  };

  if (!fileUrl || !fileUrl.trim()) {
    return (
      <div className={cn("flex h-full flex-col items-center justify-center space-y-4 rounded-2xl bg-black/30 p-8 text-center", className)}>
        <FileText className="h-12 w-12 text-white/40" />
        <div className="space-y-2">
          <p className="text-base font-medium text-white/80">Aucun fichier PDF disponible</p>
          <p className="text-sm text-white/60">
            Ce document n'a pas encore de fichier PDF associé. Le PDF sera généré automatiquement lorsque le document sera partagé.
          </p>
        </div>
        <Button
          onClick={handleRegeneratePdf}
          variant="outline"
          className="rounded-full border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Générer le PDF
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl bg-black/30", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/60" />
            <p className="text-sm text-white/60">Chargement du PDF...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-orange-400" />
          <div className="space-y-2">
            <p className="text-base font-medium text-white">Erreur de chargement</p>
            <p className="text-sm text-white/70">
              Impossible de charger le PDF. Vous pouvez le télécharger directement ou le régénérer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/20"
            >
              <a href={fileUrl} target="_blank" rel="noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </a>
            </Button>
            <Button
              onClick={handleRegeneratePdf}
              variant="outline"
              className="rounded-full border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Régénérer
            </Button>
          </div>
        </div>
      )}

      <iframe
        key={iframeKey}
        src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-width`}
        title={documentTitle}
        className="h-full w-full border-0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          minHeight: "600px",
        }}
      />

      {/* Bouton de rechargement en cas d'erreur */}
      {hasError && (
        <div className="absolute bottom-4 right-4 z-20">
          <Button
            onClick={() => {
              setIframeKey((prev) => prev + 1);
              setIsLoading(true);
              setHasError(false);
            }}
            variant="outline"
            size="sm"
            className="rounded-full border-white/20 bg-black/80 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

