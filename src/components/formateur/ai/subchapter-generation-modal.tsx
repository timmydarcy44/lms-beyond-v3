"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import type { ContentStructure } from "./chapter-generation-modal";

type SubchapterGenerationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  chapterId: string;
  subchapterId?: string;
  chapterTitle?: string;
  courseId?: string;
};

export function SubchapterGenerationModal({
  open,
  onOpenChange,
  sectionId,
  chapterId,
  subchapterId,
  chapterTitle,
  courseId,
}: SubchapterGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [contentStructure, setContentStructure] = useState<ContentStructure>("standard");
  const [isPending, startTransition] = useTransition();
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);

  const generationMode = contentStructure === "definitions" ? "theory_examples" : "theory";

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error("Le prompt doit contenir au moins 10 caractères");
      return;
    }

    startTransition(async () => {
      try {
        const snapshot = useCourseBuilder.getState().snapshot;
        const section = snapshot.sections.find((s) => s.id === sectionId);
        const chapter = section?.chapters.find((c) => c.id === chapterId);
        const subchapters = chapter?.subchapters ?? [];
        const currentIndex = subchapterId ? subchapters.findIndex((s) => s.id === subchapterId) : -1;
        const previous =
          currentIndex > 0 ? subchapters[currentIndex - 1] : subchapters.length > 0 ? subchapters[subchapters.length - 1] : null;
        const previousContent =
          previous?.content && String(previous.content).trim().length > 0
            ? String(previous.content)
            : previous?.summary
              ? String(previous.summary)
              : "";

        const response = await fetch("/api/beyond-ia/generate-rich-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            previousContent,
            mode: generationMode,
            contentStructure,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la génération");
        }

        const data = await response.json();

        if (!data.success || !data.contentHtml) {
          throw new Error("Réponse invalide de l'API");
        }

        const content = String(data.contentHtml);

        if (subchapterId) {
          updateSubchapter(sectionId, chapterId, subchapterId, {
            content,
          });
        } else {
          addSubchapter(sectionId, chapterId);
          await new Promise((resolve) => setTimeout(resolve, 50));
          const section = useCourseBuilder.getState().snapshot.sections.find((s) => s.id === sectionId);
          const chapter = section?.chapters.find((c) => c.id === chapterId);
          const subchapters = chapter?.subchapters || [];
          const newSubchapterId = subchapters.length > 0 ? subchapters[subchapters.length - 1]?.id : null;
          if (newSubchapterId) {
            updateSubchapter(sectionId, chapterId, newSubchapterId, {
              content,
            });
          } else {
            toast.error("Erreur : impossible de trouver le sous-chapitre créé");
            setPrompt("");
            onOpenChange(false);
            return;
          }
        }

        if (courseId) {
          try {
            const snap = getSnapshot();
            if (snap.general.title && snap.general.title.trim()) {
              const saveResponse = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  snapshot: snap,
                  status: "draft",
                  courseId: courseId,
                }),
              });

              if (saveResponse.ok) {
                console.log("[ai] Course auto-saved successfully");
                toast.success("Contenu généré et sauvegardé");
              } else {
                console.error("[ai] Auto-save failed:", await saveResponse.json());
                toast.success("Contenu généré", {
                  description: "La sauvegarde automatique a échoué, veuillez sauvegarder manuellement",
                });
              }
            } else {
              toast.success("Contenu généré", {
                description: "Veuillez définir un titre pour la formation avant de sauvegarder",
              });
            }
          } catch (saveError) {
            console.error("[ai] Auto-save error:", saveError);
            toast.success("Contenu généré", {
              description: "La sauvegarde automatique a échoué, veuillez sauvegarder manuellement",
            });
          }
        } else {
          toast.success("Contenu généré");
        }

        setPrompt("");
        onOpenChange(false);
      } catch (error) {
        console.error("[ai] Error generating subchapter", error);
        toast.error(error instanceof Error ? error.message : "Erreur lors de la génération");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-white text-slate-900 shadow-xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-[#6633CC]" />
            Créer un sous-chapitre avec Beyond AI
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {chapterTitle && (
              <span className="mb-2 block">
                Chapitre parent : <strong>{chapterTitle}</strong>
              </span>
            )}
            Décrivez ce que vous voulez expliquer. Beyond IA rédigera un texte complet directement injecté dans l’éditeur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="font-bold text-slate-900">
              Description du sous-chapitre
            </Label>
            <div className="space-y-2">
              <Label className="font-bold text-slate-900">Type de contenu</Label>
              <Select value={contentStructure} onValueChange={(v) => setContentStructure(v as ContentStructure)}>
                <SelectTrigger className="h-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Cours théorique standard (texte rédigé)</SelectItem>
                  <SelectItem value="definitions">Théorie + définitions + exemples</SelectItem>
                  <SelectItem value="schema">Théorie avec schémas</SelectItem>
                  <SelectItem value="table">Théorie avec tableaux comparatifs</SelectItem>
                  <SelectItem value="scientific_sources">
                    Avec sources scientifiques ou études (données &amp; preuves)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600">
                « Sources scientifiques » : contenu argumenté avec chiffres et références d&apos;études. Encarts rouge / vert
                seulement avec « Théorie + définitions + exemples ».
              </p>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Sous-chapitre sur les techniques de respiration, avec exercices pratiques…"
              className="min-h-[120px] rounded-2xl border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 shadow-sm"
              disabled={isPending}
            />
            <p className="text-xs text-slate-600">Minimum 10 caractères. Plus vous êtes précis, meilleur sera le résultat.</p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-full bg-slate-100 px-5 text-slate-700 hover:bg-slate-200"
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isPending || !prompt.trim() || prompt.trim().length < 10}
            className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
