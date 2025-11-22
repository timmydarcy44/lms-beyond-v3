"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, ArrowRight, Loader2 } from "lucide-react";
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

type CreationMethod = "zero" | "prompt" | null;

type SuperAdminCourseCreationOptionsProps = {
  assignmentType?: "no_school" | "organization";
};

export function SuperAdminCourseCreationOptions({ assignmentType }: SuperAdminCourseCreationOptionsProps = {}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod>(null);
  const [promptContent, setPromptContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
      const params = new URLSearchParams({
        title: title,
      });
      if (assignmentType) {
        params.append("assignment_type", assignmentType);
      }
      router.push(`/super/studio/modules/new/metadata?${params.toString()}`);
      return;
    }

    if (selectedMethod === "prompt" && !promptContent.trim()) {
      setShowErrorDialog(true);
      return;
    }

    if (selectedMethod === "prompt") {
      setIsProcessing(true);
      try {
        // Traiter le prompt avec l'IA
        const response = await fetch("/api/courses/generate-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Inclure les cookies pour l'authentification
          body: JSON.stringify({
            title,
            content: promptContent,
            method: "prompt",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
          console.error("[course-creation] API Error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          
          if (response.status === 401) {
            // Rediriger vers la page de connexion si non authentifié
            window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
            return;
          }
          
          setShowErrorDialog(true);
          setIsProcessing(false);
          return;
        }

        const structure = await response.json();
        
        // Rediriger vers la page de validation avec la structure pour permettre l'édition
        const params = new URLSearchParams({
          title: title,
          method: "prompt",
          structure: JSON.stringify(structure),
        });
        if (assignmentType) {
          params.append("assignment_type", assignmentType);
        }

        router.push(`/super/studio/modules/new/validate?${params.toString()}`);
      } catch (error) {
        console.error("[course-creation] Error:", error);
        setShowErrorDialog(true);
        setIsProcessing(false);
      }
      return;
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
            <div className="grid gap-4 md:grid-cols-2">
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

              {/* À partir d'un prompt */}
              <button
                onClick={() => handleMethodSelect("prompt")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "prompt"
                    ? "border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-transparent shadow-lg shadow-purple-500/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-xl p-2",
                      selectedMethod === "prompt" ? "bg-purple-500/20" : "bg-gray-100"
                    )}>
                      <Sparkles className={cn(
                        "h-5 w-5",
                        selectedMethod === "prompt" ? "text-purple-400" : "text-gray-600"
                      )} />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedMethod === "prompt" ? "text-white" : "text-gray-900"
                    )}>
                      À partir d&apos;un prompt
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    selectedMethod === "prompt" ? "text-white/80" : "text-gray-600"
                  )}>
                    Décrivez votre formation et laissez l&apos;IA créer la structure automatiquement
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Champ conditionnel pour le prompt */}
          {selectedMethod === "prompt" && (
            <div className="space-y-2">
              <Label htmlFor="prompt-content" className="text-gray-700">
                Décrivez votre formation
              </Label>
              <textarea
                id="prompt-content"
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder="Ex: Une formation sur les bases de ChatGPT pour débutants, avec 3 chapitres : introduction, utilisation pratique, cas d'usage..."
                className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
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

