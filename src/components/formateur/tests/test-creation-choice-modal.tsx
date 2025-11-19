"use client";

import { useState } from "react";
import { Sparkles, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TestCreationChoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChooseFromScratch: () => void;
  onChooseFromChapters: () => void;
};

export function TestCreationChoiceModal({
  open,
  onOpenChange,
  onChooseFromScratch,
  onChooseFromChapters,
}: TestCreationChoiceModalProps) {
  const [hovered, setHovered] = useState<"scratch" | "chapters" | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#06070d]/95 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="h-6 w-6 text-[#00C6FF]" />
            Comment souhaitez-vous créer votre test ?
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Choisissez votre méthode de création pour commencer
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 py-6">
          {/* Option 1 : Créer à partir de zéro */}
          <Card
            className={cn(
              "cursor-pointer transition-all border-white/10 bg-black/30 hover:border-[#00C6FF]/50 hover:bg-[#00C6FF]/10",
              hovered === "scratch" && "border-[#00C6FF]/50 bg-[#00C6FF]/10 scale-105"
            )}
            onMouseEnter={() => setHovered("scratch")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              onChooseFromScratch();
              onOpenChange(false);
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] p-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Créer à partir de zéro</h3>
              </div>
              <p className="text-sm text-white/70">
                Commencez avec une page blanche et créez vos questions manuellement ou avec l'assistance de l'IA.
              </p>
              <ul className="space-y-2 text-xs text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Contrôle total sur chaque question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Génération IA optionnelle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Personnalisation complète</span>
                </li>
              </ul>
              <Button
                className="w-full rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          {/* Option 2 : Créer à partir des chapitres */}
          <Card
            className={cn(
              "cursor-pointer transition-all border-white/10 bg-black/30 hover:border-[#00C6FF]/50 hover:bg-[#00C6FF]/10",
              hovered === "chapters" && "border-[#00C6FF]/50 bg-[#00C6FF]/10 scale-105"
            )}
            onMouseEnter={() => setHovered("chapters")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              onChooseFromChapters();
              onOpenChange(false);
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] p-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Créer depuis les chapitres</h3>
              </div>
              <p className="text-sm text-white/70">
                Sélectionnez un ou plusieurs chapitres de formation et laissez Beyond AI générer automatiquement les questions d'évaluation.
              </p>
              <ul className="space-y-2 text-xs text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Génération automatique par IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Basé sur le contenu réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00C6FF] mt-1">•</span>
                  <span>Économie de temps</span>
                </li>
              </ul>
              <Button
                className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90"
              >
                Générer avec IA
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

