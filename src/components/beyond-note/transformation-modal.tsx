"use client";

import { useState } from "react";
import { X, Loader2, FileText, Sparkles, Languages, Image as ImageIcon, FileCheck, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio";

interface TransformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  extractedText: string;
  onTransformationComplete?: () => void;
}

const transformations: Array<{
  id: AIAction;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: "revision-sheet",
    label: "Créer une fiche de révision",
    icon: <FileText className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "reformulate",
    label: "Reformuler",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "translate",
    label: "Traduire",
    icon: <Languages className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "diagram",
    label: "Créer un schéma",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "cleanup",
    label: "Remettre au propre",
    icon: <FileCheck className="h-5 w-5" />,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "audio",
    label: "Transformer en audio",
    icon: <Volume2 className="h-5 w-5" />,
    color: "from-rose-500 to-pink-500",
  },
];

export function TransformationModal({
  isOpen,
  onClose,
  documentId,
  extractedText,
  onTransformationComplete,
}: TransformationModalProps) {
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);

  if (!isOpen) return null;

  const handleTransformation = async (action: AIAction) => {
    if (!documentId || !extractedText) {
      toast.error("Aucun document disponible");
      return;
    }

    setLoadingAction(action);
    setResult(null);
    setCurrentAction(action);

    try {
      const response = await fetch("/api/beyond-note/ai-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          action,
          text: extractedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du traitement");
      }

      const data = await response.json();
      setResult(data.result);

      // Stocker le résultat
      const storeResponse = await fetch("/api/beyond-note/store-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          action,
          result: data.result,
        }),
      });

      if (storeResponse.ok) {
        toast.success("Transformation terminée et stockée avec succès !");
        if (onTransformationComplete) {
          onTransformationComplete();
        }
      } else {
        toast.success("Transformation terminée !");
      }
    } catch (error) {
      toast.error("Erreur lors de la transformation");
      console.error(error);
      setResult(null);
      setCurrentAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const currentTransformation = currentAction ? transformations.find(t => t.id === currentAction) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-white shadow-xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Transformations disponibles
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="touch-manipulation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!result ? (
            <div className="space-y-2 sm:space-y-3">
              {transformations.map((transformation) => (
                <Button
                  key={transformation.id}
                  onClick={() => handleTransformation(transformation.id)}
                  disabled={loadingAction !== null}
                  className={`w-full h-auto min-h-[60px] p-4 flex items-center gap-3 justify-start touch-manipulation ${
                    loadingAction === transformation.id
                      ? `bg-gradient-to-r ${transformation.color} text-white`
                      : "bg-gray-50 active:bg-gray-100 text-gray-900"
                  }`}
                >
                  {loadingAction === transformation.id ? (
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  ) : (
                    <div className={`flex-shrink-0 ${loadingAction === transformation.id ? "text-white" : "text-gray-600"}`}>
                      {transformation.icon}
                    </div>
                  )}
                  <span className="font-medium text-sm sm:text-base text-left" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {transformation.label}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentTransformation && (
                <div className={`p-4 rounded-lg bg-gradient-to-r ${currentTransformation.color} text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    {currentTransformation.icon}
                    <h3 className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      {currentTransformation.label}
                    </h3>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {result}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success("Résultat copié dans le presse-papiers");
                  }}
                  className="flex-1 min-h-[44px] touch-manipulation"
                >
                  Copier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([result], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${currentTransformation?.label.toLowerCase().replace(/\s+/g, '-') || 'transformation'}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 min-h-[44px] touch-manipulation"
                >
                  Télécharger
                </Button>
              </div>

              <Button
                onClick={() => {
                  setResult(null);
                  setCurrentAction(null);
                }}
                variant="outline"
                className="w-full min-h-[44px] touch-manipulation mt-2"
              >
                Nouvelle transformation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

