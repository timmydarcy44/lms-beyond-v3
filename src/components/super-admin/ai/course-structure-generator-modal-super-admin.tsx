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

type CourseStructureGeneratorModalSuperAdminProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStructureGenerated?: (structure: any) => void;
};

export function CourseStructureGeneratorModalSuperAdmin({
  open,
  onOpenChange,
  onStructureGenerated,
}: CourseStructureGeneratorModalSuperAdminProps) {
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
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la génération");
        }

        const data = await response.json();

        if (!data.success || !data.structure || !data.structure.sections) {
          throw new Error("Réponse invalide de l'API");
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
        console.error("[ai] Error generating course structure", error);
        toast.error(error instanceof Error ? error.message : "Erreur lors de la génération");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Créer un module depuis un référentiel
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Entrez votre référentiel de compétences ou votre programme de formation. L'IA génèrera automatiquement la structure complète (sections, chapitres et sous-chapitres).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Titre de la formation */}
          <div className="space-y-2">
            <Label htmlFor="courseTitle" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Titre du module *
            </Label>
            <Input
              id="courseTitle"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Ex: Formation en gestion de projet"
              className="border-gray-300"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="courseDescription">Description (optionnel)</Label>
            <Textarea
              id="courseDescription"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Décrivez brièvement le module..."
              className="min-h-[80px] border-gray-300"
              disabled={isPending}
            />
          </div>

          {/* Public cible */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Public cible (optionnel)
            </Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Managers, Débutants, Professionnels confirmés..."
              className="border-gray-300"
              disabled={isPending}
            />
          </div>

          {/* Objectifs pédagogiques */}
          <div className="space-y-2">
            <Label htmlFor="objectives" className="flex items-center gap-2">
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
                    className="border-gray-300"
                    disabled={isPending}
                  />
                  {learningObjectives.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjective(index)}
                      disabled={isPending}
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
                className="text-xs"
              >
                + Ajouter un objectif
              </Button>
            </div>
          </div>

          {/* Référentiel */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Référentiel de compétences / Programme de formation *</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Collez ici votre référentiel de compétences, votre programme de formation, ou décrivez en détail ce que doit contenir le module..."
              className="min-h-[200px] border-gray-300"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500">
              Minimum 20 caractères. Plus vous êtes précis, meilleure sera la structure générée.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
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

