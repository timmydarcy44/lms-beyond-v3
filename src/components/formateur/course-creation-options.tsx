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

export function CourseCreationOptions() {
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
      // Workflow actuel : aller directement aux métadonnées
      router.push(`/dashboard/formateur/formations/new/metadata?title=${encodeURIComponent(title)}`);
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
      const params = new URLSearchParams({
        title: title,
        method: selectedMethod || "",
        structure: JSON.stringify(structure),
      });

      router.push(`/dashboard/formateur/formations/new/validate?${params.toString()}`);
    } catch (error) {
      console.error("[course-creation] Error:", error);
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Créer une nouvelle formation</CardTitle>
          <CardDescription className="text-white/60">
            Commencez par donner un titre à votre formation, puis choisissez votre méthode de création
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80">
              Titre de la formation
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: La négociation avancée"
              className="bg-white/5 text-white placeholder:text-white/30 border-white/10"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-white/80">Méthode de création</Label>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Créer à partir de zéro */}
              <button
                onClick={() => handleMethodSelect("zero")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "zero"
                    ? "border-blue-500/50 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-transparent shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="space-y-4">
                  <div
                    className={cn(
                      "rounded-xl p-3 transition-all duration-300",
                      selectedMethod === "zero"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                        : "bg-white/5 group-hover:bg-white/10"
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-6 w-6 transition-colors",
                        selectedMethod === "zero" ? "text-white" : "text-blue-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-lg font-semibold transition-colors mb-2",
                        selectedMethod === "zero" ? "text-white" : "text-white/90"
                      )}
                    >
                      Créer à partir de zéro
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Commencez avec un formulaire vide et construisez votre formation étape par étape
                    </p>
                  </div>
                  {selectedMethod === "zero" && (
                    <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 uppercase tracking-wide">
                      Sélectionné
                    </span>
                  )}
                </div>
              </button>

              {/* Construire à partir d'un copier/coller */}
              <button
                onClick={() => handleMethodSelect("paste")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "paste"
                    ? "border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-transparent shadow-lg shadow-purple-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="space-y-4">
                  <div
                    className={cn(
                      "rounded-xl p-3 transition-all duration-300",
                      selectedMethod === "paste"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                        : "bg-white/5 group-hover:bg-white/10"
                    )}
                  >
                    <Copy
                      className={cn(
                        "h-6 w-6 transition-colors",
                        selectedMethod === "paste" ? "text-white" : "text-purple-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-lg font-semibold transition-colors mb-2",
                        selectedMethod === "paste" ? "text-white" : "text-white/90"
                      )}
                    >
                      Construire à partir d&apos;un copier/coller
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Collez votre contenu (plan de cours, syllabus, etc.) et l&apos;IA générera la structure
                    </p>
                  </div>
                  {selectedMethod === "paste" && (
                    <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 uppercase tracking-wide">
                      Sélectionné
                    </span>
                  )}
                </div>
              </button>

              {/* Créer à partir de l'IA */}
              <button
                onClick={() => handleMethodSelect("ai")}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  selectedMethod === "ai"
                    ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-transparent shadow-lg shadow-emerald-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="space-y-4">
                  <div
                    className={cn(
                      "rounded-xl p-3 transition-all duration-300",
                      selectedMethod === "ai"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
                        : "bg-white/5 group-hover:bg-white/10"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-6 w-6 transition-colors",
                        selectedMethod === "ai" ? "text-white" : "text-emerald-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-lg font-semibold transition-colors mb-2",
                        selectedMethod === "ai" ? "text-white" : "text-white/90"
                      )}
                    >
                      Créer à partir de l&apos;IA
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Importez un PDF qui sera analysé par OpenAI pour générer automatiquement la structure
                    </p>
                  </div>
                  {selectedMethod === "ai" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                      Sélectionné
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Options spécifiques selon la méthode sélectionnée */}
          {selectedMethod === "paste" && (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="paste-content" className="text-white/80">
                    Collez votre contenu
                  </Label>
                  <textarea
                    id="paste-content"
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="Collez ici votre plan de cours, syllabus, ou tout autre contenu structuré..."
                    className="min-h-[200px] w-full rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMethod === "ai" && (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload" className="text-white/80">
                    Importer un PDF
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                        }
                      }}
                      className="bg-white/5 text-white border-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                    />
                    {uploadedFile && (
                      <span className="text-sm text-white/70">{uploadedFile.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    Le PDF sera analysé par OpenAI pour extraire la structure de la formation
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bouton Soumettre */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !selectedMethod || isProcessing}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  Soumettre
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1F2937] text-white shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Désolé, j&apos;ai du mal à comprendre pour le moment.
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              Réessayez dans quelques minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
            <p>
              Si le problème persiste, n&apos;hésitez pas à nous en faire part via notre chat (bientôt disponible).
            </p>
            <Link
              href="#"
              className="inline-flex items-center text-sm font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200"
            >
              Si le problème persiste, n&apos;hésitez pas à nous en faire part
            </Link>
          </div>
          <DialogFooter className="flex items-center justify-between pt-2">
            <span className="text-xs text-white/50">L&apos;équipe Beyond</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowErrorDialog(false)}
              className="rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


