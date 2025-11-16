"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, X } from "lucide-react";

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

type ChapterGenerationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  chapterId?: string; // Si défini, met à jour le chapitre existant
};

export function ChapterGenerationModal({ open, onOpenChange, sectionId, chapterId }: ChapterGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();
  const updateChapter = useCourseBuilder((state) => state.updateChapter);
  const addChapter = useCourseBuilder((state) => state.addChapter);

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error("Le prompt doit contenir au moins 10 caractères");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate-chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            courseContext: {
              // On pourrait récupérer le contexte de la formation ici
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la génération");
        }

        const data = await response.json();

        if (!data.success || !data.chapter) {
          throw new Error("Réponse invalide de l'API");
        }

        const { title, summary, content, duration, type, suggestedSubchapters } = data.chapter;

        if (chapterId) {
          // Mettre à jour le chapitre existant
          updateChapter(sectionId, chapterId, {
            title,
            summary,
            content,
            duration,
            type: type as "video" | "text" | "document",
          });
          toast.success("Chapitre mis à jour avec succès");
        } else {
          // Créer un nouveau chapitre
          addChapter(sectionId, {
            title,
            summary,
            content,
            duration,
            type: type as "video" | "text" | "document",
          });
          toast.success("Chapitre généré avec succès");
        }

        // Si des sous-chapitres sont suggérés, on peut les proposer
        if (suggestedSubchapters && suggestedSubchapters.length > 0) {
          toast.info(`${suggestedSubchapters.length} sous-chapitre(s) suggéré(s)`, {
            description: "Vous pouvez les ajouter manuellement dans l'éditeur",
          });
        }

        setPrompt("");
        onOpenChange(false);
      } catch (error) {
        console.error("[ai] Error generating chapter", error);
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
            Créer un chapitre avec Beyond AI
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Décrivez le chapitre que vous souhaitez créer. L'IA génèrera le titre, le résumé, le contenu et suggérera des sous-chapitres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-white/90">
              Description du chapitre
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Chapitre sur la gestion du stress en entreprise, avec techniques de respiration et cas pratiques..."
              className="min-h-[120px] bg-black/40 text-white placeholder:text-white/30 focus:border-[#00F5A0]"
              disabled={isPending}
            />
            <p className="text-xs text-white/50">Minimum 10 caractères. Plus vous êtes précis, meilleur sera le résultat.</p>
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




