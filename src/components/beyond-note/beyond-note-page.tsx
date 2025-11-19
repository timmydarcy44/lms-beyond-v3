"use client";

import { useState, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";
import { toast } from "sonner";
import { TransformationModal } from "@/components/beyond-note/transformation-modal";

type Document = {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  created_at: string;
};

export function BeyondNotePageContent() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showNeuroModal, setShowNeuroModal] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  
  const { isDyslexiaMode } = useDyslexiaMode();

  // Charger les documents au montage
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch("/api/beyond-note/documents");
      const data = await response.json();
      
      if (response.ok) {
        setDocuments(data.documents || []);
        // Afficher un avertissement si la table n'existe pas
        if (data.warning) {
          console.warn("[beyond-note] Warning:", data.warning);
        }
      } else {
        // Afficher l'erreur dans la console pour le debug
        console.error("[beyond-note] Error loading documents:", data);
        if (data.details) {
          console.error("[beyond-note] Error details:", data.details);
        }
        setDocuments([]);
      }
    } catch (error) {
      console.error("[beyond-note] Error loading documents:", error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/beyond-note/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error("[beyond-note] Failed to parse error response:", parseError);
          errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || "Erreur lors de l'upload";
        const errorDetails = errorData.details || errorData.message || errorData.statusCode || "";
        
        // Afficher un message plus détaillé
        console.error("[beyond-note] Upload error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (errorDetails) {
          toast.error(`${errorMessage}: ${errorDetails}`);
        } else {
          toast.error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Afficher un avertissement si la table n'existe pas
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("Document uploadé avec succès !");
      }
      
      // Rediriger vers la page du document si documentId existe
      if (data.documentId) {
        window.location.href = `/beyond-note-app/${data.documentId}`;
      } else {
        // Fallback : ouvrir le modal si pas de documentId
        setUploadedFile(file);
        setDocumentUrl(data.url);
        setExtractedText(data.extractedText);
        setSelectedDocumentId(data.documentId);
        setShowTransformationModal(true);
      }
      
      // Recharger la liste des documents
      loadDocuments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'upload du document";
      console.error("[beyond-note] Upload error:", error);
      // Ne pas afficher de toast ici car il a déjà été affiché plus haut
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Vérifier si on est sur mobile avec accès à l'appareil photo
      if (typeof navigator !== "undefined" && typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia === "function") {
        // Sur mobile, utiliser l'attribut capture pour ouvrir directement l'appareil photo
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment"; // Utilise la caméra arrière sur mobile
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        };
        input.click();
      } else {
        // Fallback : input file classique
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        };
        input.click();
      }
    } catch (error) {
      toast.error("Impossible d'accéder à l'appareil photo");
      console.error(error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className={`min-h-screen ${isDyslexiaMode ? 'dyslexia-mode' : ''}`}>
      {/* Colonne gauche - Plein écran avec boutons centrés */}
      <div className="fixed left-0 top-0 h-screen w-full flex items-center justify-center bg-white overflow-y-auto pb-8">
        {/* Header avec mode neuro adapté */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            onClick={() => setShowNeuroModal(true)}
            className="flex items-center gap-2 bg-white border-2 border-gray-400 text-gray-800 shadow-lg active:shadow-xl active:border-violet-500 active:bg-violet-50 touch-manipulation"
          >
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="font-medium text-sm sm:text-base" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Mode neuro adapté
            </span>
          </Button>
        </div>

        {/* Boutons centrés */}
        <div className="space-y-4 sm:space-y-6 max-w-md w-full px-4 pt-20 pb-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Note
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-800 font-medium px-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Scannez vos documents et transformez-les avec l'IA
            </p>
          </div>

          {/* Bouton Appareil photo */}
          <button
            onClick={handleCameraCapture}
            disabled={isUploading}
            className="w-full h-20 sm:h-24 md:h-28 flex flex-col items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg bg-gradient-to-r from-violet-600 to-purple-600 active:from-violet-700 active:to-purple-700 text-white border-0 shadow-xl active:shadow-2xl transition-all duration-200 disabled:opacity-50 rounded-lg cursor-pointer touch-manipulation min-h-[80px]"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            <Camera className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            <span className="font-bold text-base sm:text-lg">
              Prendre une photo
            </span>
          </button>

          {/* Bouton Upload */}
          <label className="block w-full">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
              id="file-upload-input"
            />
            <div
              onClick={() => !isUploading && document.getElementById('file-upload-input')?.click()}
              className="w-full h-20 sm:h-24 md:h-28 flex flex-col items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg bg-white border-4 border-gray-600 text-gray-900 active:bg-gray-100 active:border-violet-600 active:text-violet-700 shadow-xl active:shadow-2xl transition-all duration-200 disabled:opacity-50 cursor-pointer rounded-lg font-bold touch-manipulation min-h-[80px] select-none"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 pointer-events-none" />
              <span className="text-base sm:text-lg pointer-events-none">
                Uploader un fichier
              </span>
            </div>
          </label>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 bg-blue-100 border-4 border-blue-400 rounded-xl shadow-lg">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-700" />
              <span className="text-blue-900 font-bold text-sm sm:text-base md:text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Traitement en cours...
              </span>
            </div>
          )}

          {/* Liste des documents récents */}
          {documents.length > 0 && (
            <Card className="mt-6 sm:mt-8 border-4 border-gray-400 shadow-2xl bg-white">
              <CardHeader className="bg-gray-200 border-b-4 border-gray-400 p-3 sm:p-4">
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Documents récents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 bg-white">
                <div className="space-y-2 sm:space-y-3 max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        window.location.href = `/beyond-note-app/${doc.id}`;
                      }}
                      className="p-3 sm:p-4 rounded-lg border-4 border-gray-300 cursor-pointer transition-all bg-white active:bg-violet-100 active:border-violet-500 active:shadow-lg touch-manipulation"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-violet-700 flex-shrink-0" />
                        <p className="text-sm sm:text-base font-bold truncate text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                          {doc.file_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de transformation */}
      <TransformationModal
        isOpen={showTransformationModal && !!documentUrl && !!extractedText}
        onClose={() => setShowTransformationModal(false)}
        documentId={selectedDocumentId}
        extractedText={extractedText || ""}
        onTransformationComplete={() => {
          // Optionnel : recharger les documents après transformation
          loadDocuments();
        }}
      />

      {/* Modal neuro adapté */}
      <LearningStrategyModal
        isOpen={showNeuroModal}
        onClose={() => setShowNeuroModal(false)}
        onFocusModeChange={() => {}}
      />
    </div>
  );
}
