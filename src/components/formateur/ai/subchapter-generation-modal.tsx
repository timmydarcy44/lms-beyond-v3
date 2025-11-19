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
import { toast } from "sonner";
import { useCourseBuilder } from "@/hooks/use-course-builder";

type SubchapterGenerationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  chapterId: string;
  subchapterId?: string; // Si défini, met à jour le sous-chapitre existant
  chapterTitle?: string; // Titre du chapitre parent pour le contexte
};

export function SubchapterGenerationModal({
  open,
  onOpenChange,
  sectionId,
  chapterId,
  subchapterId,
  chapterTitle,
}: SubchapterGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();
  const updateSubchapter = useCourseBuilder((state) => state.updateSubchapter);
  const addSubchapter = useCourseBuilder((state) => state.addSubchapter);

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error("Le prompt doit contenir au moins 10 caractères");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/create-subchapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            chapterTitle: chapterTitle || "Chapitre",
            chapterContext: {
              // On pourrait récupérer plus de contexte ici si nécessaire
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la génération");
        }

        const data = await response.json();

        if (!data.success || !data.subchapter) {
          throw new Error("Réponse invalide de l'API");
        }

        const { title, summary, content, duration, type } = data.subchapter;

        if (subchapterId) {
          // Mettre à jour le sous-chapitre existant
          updateSubchapter(sectionId, chapterId, subchapterId, {
            title,
            summary,
            content,
            duration,
            type: type as "video" | "text" | "document" | "audio",
          });
          toast.success("Sous-chapitre mis à jour avec succès");
        } else {
          // Créer un nouveau sous-chapitre
          addSubchapter(sectionId, chapterId);
          // Mettre à jour le sous-chapitre nouvellement créé
          const newSubchapterId = useCourseBuilder
            .getState()
            .snapshot.sections.find((s) => s.id === sectionId)
            ?.chapters.find((c) => c.id === chapterId)?.subchapters[0]?.id;
          if (newSubchapterId) {
            updateSubchapter(sectionId, chapterId, newSubchapterId, {
              title,
              summary,
              content,
              duration,
              type: type as "video" | "text" | "document" | "audio",
            });
          }
          toast.success("Sous-chapitre généré avec succès");
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
      <DialogContent className="border-white/10 bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/95 to-[#1f2937]/95 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-[#00F5A0]" />
            Créer un sous-chapitre avec Beyond AI
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {chapterTitle && (
              <span className="block mb-2">
                Chapitre parent : <strong>{chapterTitle}</strong>
              </span>
            )}
            Décrivez le sous-chapitre que vous souhaitez créer. L'IA génèrera le titre, le résumé et le contenu structuré.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-white/90">
              Description du sous-chapitre
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Sous-chapitre sur les techniques de respiration, avec exercices pratiques et vidéos démonstratives..."
              className="min-h-[120px] bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
            <p className="text-xs text-white/50">
              Minimum 10 caractères. Plus vous êtes précis, meilleur sera le résultat.
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
            disabled={isPending || !prompt.trim() || prompt.trim().length < 10}
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
                Générer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

