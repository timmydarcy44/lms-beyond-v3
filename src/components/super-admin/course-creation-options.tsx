"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, Copy, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CreationMethod = "zero" | "paste" | "ai" | null;

export function SuperAdminCourseCreationOptions() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod>(null);
  const [pasteContent, setPasteContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    if (selectedMethod === "zero") {
      // Workflow : aller directement aux métadonnées
      // Vérifier si on vient de /modules ou /formations
      const isFromModules = window.location.pathname.includes("/modules");
      const basePath = isFromModules ? "/super/studio/modules" : "/super/studio/formations";
      router.push(`${basePath}/new/metadata?title=${encodeURIComponent(title)}`);
      return;
    }

    if (selectedMethod === "paste" && !pasteContent.trim()) {
      setShowErrorDialog(true);
      return;
    }

    if (selectedMethod === "ai" && !uploadedFile) {
      setShowErrorDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      let structure = null;

      if (selectedMethod === "paste") {
        // Traiter le contenu collé
        const response = await fetch("/api/courses/generate-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: pasteContent,
            method: "paste",
          }),
        });

        if (!response.ok) {
          setShowErrorDialog(true);
          return;
        }

        structure = await response.json();
      } else if (selectedMethod === "ai") {
        // Traiter le PDF avec OpenAI
        const formData = new FormData();
        if (uploadedFile) {
          formData.append("file", uploadedFile);
        }
        formData.append("title", title);

        const response = await fetch("/api/courses/generate-structure-from-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          setShowErrorDialog(true);
          return;
        }

        structure = await response.json();
      }

      // Rediriger vers la page de validation avec la structure
      // Vérifier si on vient de /modules ou /formations
      const isFromModules = window.location.pathname.includes("/modules");
      const basePath = isFromModules ? "/super/studio/modules" : "/super/studio/formations";
      const params = new URLSearchParams({
        title: title,
        method: selectedMethod || "",
        structure: JSON.stringify(structure),
      });

      router.push(`${basePath}/new/validate?${params.toString()}`);
    } catch (error) {
      console.error("[course-creation] Error:", error);
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">Créer une nouvelle formation</CardTitle>
          <CardDescription className="text-gray-600">
            Commencez par donner un titre à votre formation, puis choisissez votre méthode de création
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">
              Titre de la formation
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: La négociation avancée"
              className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-gray-700">Méthode de création</Label>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Créer à partir de zéro */}
              <button
                onClick={() => handleMethodSelect("zero")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "zero"
                    ? "border-blue-500/50 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-transparent shadow-lg shadow-blue-500/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-xl p-2",
                      selectedMethod === "zero" ? "bg-blue-500/20" : "bg-gray-100"
                    )}>
                      <Copy className={cn(
                        "h-5 w-5",
                        selectedMethod === "zero" ? "text-blue-400" : "text-gray-600"
                      )} />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedMethod === "zero" ? "text-white" : "text-gray-900"
                    )}>
                      À partir de zéro
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    selectedMethod === "zero" ? "text-white/80" : "text-gray-600"
                  )}>
                    Créez votre formation étape par étape avec notre éditeur visuel
                  </p>
                </div>
              </button>

              {/* Coller du contenu */}
              <button
                onClick={() => handleMethodSelect("paste")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "paste"
                    ? "border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-transparent shadow-lg shadow-purple-500/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-xl p-2",
                      selectedMethod === "paste" ? "bg-purple-500/20" : "bg-gray-100"
                    )}>
                      <FileText className={cn(
                        "h-5 w-5",
                        selectedMethod === "paste" ? "text-purple-400" : "text-gray-600"
                      )} />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedMethod === "paste" ? "text-white" : "text-gray-900"
                    )}>
                      Coller du contenu
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    selectedMethod === "paste" ? "text-white/80" : "text-gray-600"
                  )}>
                    Collez votre contenu et laissez l&apos;IA structurer votre formation
                  </p>
                </div>
              </button>

              {/* Importer un PDF */}
              <button
                onClick={() => handleMethodSelect("ai")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "ai"
                    ? "border-orange-500/50 bg-gradient-to-br from-orange-500/20 via-red-500/15 to-transparent shadow-lg shadow-orange-500/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-xl p-2",
                      selectedMethod === "ai" ? "bg-orange-500/20" : "bg-gray-100"
                    )}>
                      <Sparkles className={cn(
                        "h-5 w-5",
                        selectedMethod === "ai" ? "text-orange-400" : "text-gray-600"
                      )} />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedMethod === "ai" ? "text-white" : "text-gray-900"
                    )}>
                      Importer un PDF
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    selectedMethod === "ai" ? "text-white/80" : "text-gray-600"
                  )}>
                    Importez un PDF et laissez l&apos;IA créer la structure automatiquement
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Champs conditionnels selon la méthode */}
          {selectedMethod === "paste" && (
            <div className="space-y-2">
              <Label htmlFor="paste-content" className="text-gray-700">
                Collez votre contenu
              </Label>
              <textarea
                id="paste-content"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Collez ici le contenu de votre formation..."
                className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {selectedMethod === "ai" && (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload" className="text-gray-700">
                Importer un PDF
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadedFile && (
                  <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !selectedMethod || isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription>
              Une erreur est survenue lors du traitement. Veuillez réessayer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

