"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, X, BookOpen, Users, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { createEmptyCourseBuilderSnapshot } from "@/data/course-builder-fallback";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

type CourseStructureGeneratorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStructureGenerated?: (structure: any) => void;
};

export function CourseStructureGeneratorModal({
  open,
  onOpenChange,
  onStructureGenerated,
}: CourseStructureGeneratorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [learningObjectives, setLearningObjectives] = useState<string[]>([""]);
  const [isPending, startTransition] = useTransition();
  const { hydrateFromSnapshot, getSnapshot } = useCourseBuilder();

  const addObjective = () => {
    setLearningObjectives([...learningObjectives, ""]);
  };

  const removeObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...learningObjectives];
    newObjectives[index] = value;
    setLearningObjectives(newObjectives);
  };

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 20) {
      toast.error("Le référentiel doit contenir au moins 20 caractères");
      return;
    }

    if (!courseTitle.trim()) {
      toast.error("Le titre de la formation est requis");
      return;
    }

    startTransition(async () => {
      try {
        const validObjectives = learningObjectives.filter((obj) => obj.trim().length > 0);

        const response = await fetch("/api/ai/generate-course-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            courseTitle: courseTitle.trim(),
            courseDescription: courseDescription.trim() || undefined,
            targetAudience: targetAudience.trim() || undefined,
            learningObjectives: validObjectives.length > 0 ? validObjectives : undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
          console.error("[course-structure-generator] API Error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[course-structure-generator] API Response:", data);

        if (!data.success) {
          console.error("[course-structure-generator] API returned success: false", data);
          throw new Error(data.error || "La génération a échoué");
        }

        if (!data.structure || !data.structure.sections) {
          console.error("[course-structure-generator] Invalid structure format", data);
          throw new Error("Réponse invalide de l'API : structure manquante ou incorrecte");
        }

        if (!Array.isArray(data.structure.sections) || data.structure.sections.length === 0) {
          console.error("[course-structure-generator] No sections in structure", data);
          throw new Error("Aucune section générée. Veuillez enrichir votre référentiel.");
        }

        // Récupérer le snapshot actuel pour préserver les autres données
        const currentSnapshot = getSnapshot();

        // Convertir la structure générée en format du builder
        const sections = data.structure.sections.map((section: any, sectionIndex: number) => ({
          id: `section-${Date.now()}-${sectionIndex}`,
          title: section.title,
          description: section.description || "",
          chapters: section.chapters.map((chapter: any, chapterIndex: number) => ({
            id: `chapter-${Date.now()}-${sectionIndex}-${chapterIndex}`,
            title: chapter.title,
            summary: chapter.summary || "",
            content: chapter.content || "",
            duration: chapter.duration || "15 min",
            type: (chapter.type || "text") as "video" | "audio" | "document" | "text",
            subchapters: chapter.subchapters.map((subchapter: any, subchapterIndex: number) => ({
              id: `subchapter-${Date.now()}-${sectionIndex}-${chapterIndex}-${subchapterIndex}`,
              title: subchapter.title,
              summary: subchapter.summary || "",
              content: subchapter.content || "",
              duration: subchapter.duration || "10 min",
              type: (subchapter.type || "text") as "video" | "audio" | "document" | "text",
            })),
          })),
        }));

        // Créer un snapshot complet en préservant les données existantes
        const newSnapshot: CourseBuilderSnapshot = {
          ...currentSnapshot,
          sections,
          general: {
            ...currentSnapshot.general,
            title: courseTitle.trim() || currentSnapshot.general.title,
            description: courseDescription.trim() || currentSnapshot.general.description,
          },
        };

        // Mettre à jour le snapshot du builder
        hydrateFromSnapshot(newSnapshot);

        toast.success(`Structure générée avec succès : ${sections.length} section(s), ${sections.reduce((acc: number, s: any) => acc + s.chapters.length, 0)} chapitre(s)`);

        if (onStructureGenerated) {
          onStructureGenerated(data.structure);
        }

        // Réinitialiser le formulaire
        setPrompt("");
        setCourseTitle("");
        setCourseDescription("");
        setTargetAudience("");
        setLearningObjectives([""]);
        onOpenChange(false);
      } catch (error) {
        console.error("[course-structure-generator] Error generating course structure", {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la génération. Vérifiez la console pour plus de détails."
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-[#00F5A0]" />
            Créer une formation depuis un référentiel
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Entrez votre référentiel de compétences ou votre programme de formation. L'IA génèrera automatiquement la structure complète (sections, chapitres et sous-chapitres).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Titre de la formation */}
          <div className="space-y-2">
            <Label htmlFor="courseTitle" className="text-white/90 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Titre de la formation *
            </Label>
            <Input
              id="courseTitle"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Ex: Formation en gestion de projet"
              className="bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="courseDescription" className="text-white/90">
              Description (optionnel)
            </Label>
            <Textarea
              id="courseDescription"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Décrivez brièvement la formation..."
              className="min-h-[80px] bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
          </div>

          {/* Public cible */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="text-white/90 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Public cible (optionnel)
            </Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Managers, Débutants, Professionnels confirmés..."
              className="bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
          </div>

          {/* Objectifs pédagogiques */}
          <div className="space-y-2">
            <Label htmlFor="objectives" className="text-white/90 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objectifs pédagogiques (optionnel)
            </Label>
            <div className="space-y-2">
              {learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    placeholder={`Objectif ${index + 1}`}
                    className="bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
                    disabled={isPending}
                  />
                  {learningObjectives.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjective(index)}
                      disabled={isPending}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={addObjective}
                disabled={isPending}
                className="text-xs text-white/60 hover:text-white hover:bg-white/10"
              >
                + Ajouter un objectif
              </Button>
            </div>
          </div>

          {/* Référentiel */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-white/90">
              Référentiel de compétences / Programme de formation *
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Collez ici votre référentiel de compétences, votre programme de formation, ou décrivez en détail ce que doit contenir la formation..."
              className="min-h-[200px] bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
            <p className="text-xs text-white/50">
              Minimum 20 caractères. Plus vous êtes précis, meilleure sera la structure générée.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-full border border-white/20 text-white/80 hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isPending ||
              !prompt.trim() ||
              prompt.trim().length < 20 ||
              !courseTitle.trim()
            }
            className="rounded-full bg-gradient-to-r from-[#00F5A0] via-[#00D9F5] to-[#0068F5] px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-[0_8px_24px_rgba(0,213,245,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer la structure
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

