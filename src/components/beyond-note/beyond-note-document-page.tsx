"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Sparkles, 
  Languages, 
  Image as ImageIcon, 
  FileCheck, 
  Volume2,
  Loader2,
  ArrowLeft,
  Copy,
  Download,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  file_type: string;
}

const transformations: Array<{
  id: AIAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: "revision-sheet",
    label: "Créer une fiche de révision",
    description: "Génère une fiche de révision structurée",
    icon: <FileText className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "reformulate",
    label: "Reformuler",
    description: "Reformule le texte pour améliorer la clarté",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "translate",
    label: "Traduire",
    description: "Traduit le document dans une autre langue",
    icon: <Languages className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "diagram",
    label: "Créer un schéma",
    description: "Génère un schéma visuel à partir du contenu",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "cleanup",
    label: "Remettre au propre",
    description: "Nettoie et structure le texte",
    icon: <FileCheck className="h-5 w-5" />,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "audio",
    label: "Transformer en audio",
    description: "Convertit le texte en fichier audio",
    icon: <Volume2 className="h-5 w-5" />,
    color: "from-rose-500 to-pink-500",
  },
];

interface BeyondNoteDocumentPageProps {
  documentId: string;
}

export function BeyondNoteDocumentPage({ documentId }: BeyondNoteDocumentPageProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [showNeuroModal, setShowNeuroModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentText, setCurrentText] = useState<string>("");
  const router = useRouter();
  const { isDyslexiaMode } = useDyslexiaMode();

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    // Mettre à jour le texte actuel quand le document ou le résultat change
    if (result) {
      setCurrentText(result);
    } else if (document?.extracted_text) {
      setCurrentText(document.extracted_text);
    }
  }, [document, result]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/beyond-note/documents`);
      if (response.ok) {
        const data = await response.json();
        const doc = data.documents?.find((d: Document) => d.id === documentId);
        if (doc) {
          setDocument(doc);
        } else {
          toast.error("Document non trouvé");
          router.push("/beyond-note-app");
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Erreur lors du chargement du document");
    } finally {
      setLoading(false);
    }
  };

  const handleTransformation = async (action: AIAction) => {
    if (!document || !document.extracted_text) {
      toast.error("Aucun texte disponible pour la transformation");
      return;
    }

    setLoadingAction(action);
    setCurrentAction(action);

    try {
      // Toujours utiliser le texte original du document comme base pour les transformations
      // Cela permet de toujours transformer depuis le contenu original
      const textToTransform = document.extracted_text;
      
      console.log("[beyond-note] Starting transformation:", action, "Text length:", textToTransform.length);
      
      const response = await fetch("/api/beyond-note/ai-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          action,
          text: textToTransform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors du traitement IA");
      }

      const data = await response.json();
      console.log("[beyond-note] Transformation result received, length:", data.result?.length || 0);
      
      setResult(data.result);
      toast.success("Transformation terminée avec succès !");

      // Stocker le résultat
      await fetch("/api/beyond-note/store-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          action,
          result: data.result,
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du traitement IA";
      toast.error(errorMessage);
      console.error("[beyond-note] Error during AI action:", error);
      setCurrentAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetToOriginal = () => {
    setResult(null);
    setCurrentAction(null);
    setCurrentText(document?.extracted_text || "");
    toast.info("Retour au contenu original");
  };

  const handleSave = async () => {
    if (!document || !currentText) {
      toast.error("Aucun texte à sauvegarder");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/beyond-note/update-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          modifiedText: currentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      // Mettre à jour le document local
      setDocument({
        ...document,
        extracted_text: currentText,
      });
      
      // Si on avait un résultat, on le met à jour aussi
      if (result) {
        setResult(currentText);
      }

      toast.success("Document sauvegardé avec succès !");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
      console.error("[beyond-note] Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const isPDF = document.file_type === "application/pdf";
  const isImage = document.file_type?.startsWith("image/");

  return (
    <TooltipProvider>
      <div className={`h-screen flex flex-col bg-gray-50 ${isDyslexiaMode ? 'dyslexia-mode' : ''}`}>
        {/* Header minimaliste */}
        <div className="border-b border-gray-200 bg-white z-20 flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/beyond-note-app")}
                className="flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                {document.file_name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNeuroModal(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Neuro adapté
                </span>
              </Button>
              {currentText && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sauvegarder</span>
                    </>
                  )}
                </Button>
              )}
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToOriginal}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Original</span>
                </Button>
              )}
              {(result || document.extracted_text) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const textToCopy = currentText || result || document.extracted_text || "";
                    navigator.clipboard.writeText(textToCopy);
                    toast.success("Contenu copié");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([currentText || result], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = (document as any).createElement('a');
                    link.href = url;
                    link.download = `${currentAction || 'document'}-${document.file_name}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal : plein écran */}
        <div className="flex-1 relative overflow-hidden">
          {/* Zone de texte principale - plein écran */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-12">
              {loadingAction ? (
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Traitement en cours avec Claude...
                    </p>
                  </div>
                </div>
              ) : result ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-violet-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      {transformations.find(t => t.id === currentAction)?.label || 'Résultat'}
                    </p>
                  </div>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCurrentText(e.currentTarget.textContent || "")}
                    className="text-gray-900 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-violet-200 rounded p-2 -m-2"
                    style={{ 
                      fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      minHeight: '200px'
                    }}
                  >
                    {result}
                  </div>
                </div>
              ) : document.extracted_text ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCurrentText(e.currentTarget.textContent || "")}
                    className="text-gray-900 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-violet-200 rounded p-2 -m-2"
                    style={{ 
                      fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      minHeight: '200px'
                    }}
                  >
                    {document.extracted_text}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                  <div className="text-center max-w-md">
                    <FileText className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                    <p className="font-semibold text-lg mb-2 text-gray-700" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Aucun texte extrait du document
                    </p>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      {document.file_type === "application/pdf" 
                        ? "Ce PDF semble être une image scannée. L'extraction de texte nécessite un OCR."
                        : "L'extraction de texte depuis les images nécessite un OCR."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar flottante avec CTAs - à droite */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center z-10 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-xl rounded-l-2xl p-4 pointer-events-auto transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col gap-3">
                {/* Mode neuro adapté */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative">
                      <Button
                        onClick={() => setShowNeuroModal(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl transition-all duration-300 group-hover:scale-125 bg-gradient-to-br from-violet-500 to-purple-500 opacity-90 hover:opacity-100 text-white border-0"
                      >
                        <Sparkles className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Mode neuro adapté
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                {transformations.map((transformation) => (
                  <Tooltip key={transformation.id}>
                    <TooltipTrigger asChild>
                      <div className="group relative">
                        <Button
                          onClick={() => handleTransformation(transformation.id)}
                          disabled={loadingAction !== null || !document.extracted_text}
                          variant={currentAction === transformation.id ? "default" : "outline"}
                          size="icon"
                          className={`h-14 w-14 rounded-xl transition-all duration-300 group-hover:scale-125 ${
                            currentAction === transformation.id
                              ? `bg-gradient-to-br ${transformation.color} text-white border-0 shadow-lg`
                              : `bg-gradient-to-br ${transformation.color} opacity-90 hover:opacity-100 text-white border-0`
                          }`}
                        >
                          {loadingAction === transformation.id ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          ) : (
                            <div className="text-white">
                              {transformation.icon}
                            </div>
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {transformation.label}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal neuro adapté */}
      <LearningStrategyModal
        isOpen={showNeuroModal}
        onClose={() => setShowNeuroModal(false)}
        onFocusModeChange={() => {}}
      />
    </TooltipProvider>
  );
}

