"use client";

import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormateurLearner, FormateurGroup } from "@/lib/queries/formateur";
import { toast } from "sonner";

type ConsigneModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learners: FormateurLearner[];
  groups: FormateurGroup[];
};

export function ConsigneModal({ open, onOpenChange, learners, groups }: ConsigneModalProps) {
  const [title, setTitle] = useState("Consigne Neuro-Rituel");
  const [expectations, setExpectations] = useState(
    "Décrivez en 800 mots le protocole complet du rituel d'ouverture, en précisant les triggers sensoriels et la promesse pédagogique.",
  );
  const [dueDate, setDueDate] = useState("2025-11-05T18:00");
  const [file, setFile] = useState<File | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedGroups.length === 0 && selectedLearners.length === 0) {
      setFormError("Sélectionnez au moins un groupe ou un apprenant pour envoyer la consigne.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Préparer les données de la consigne
      const formData = new FormData();
      formData.append("title", title);
      formData.append("expectations", expectations);
      formData.append("dueDate", dueDate);
      formData.append("groupIds", JSON.stringify(selectedGroups));
      formData.append("learnerIds", JSON.stringify(selectedLearners));
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/drive/consigne", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi de la consigne");
      }

      toast.success("Consigne envoyée avec succès aux apprenants");
      
      // Réinitialiser le formulaire
      setTitle("Consigne Neuro-Rituel");
      setExpectations("Décrivez en 800 mots le protocole complet du rituel d'ouverture, en précisant les triggers sensoriels et la promesse pédagogique.");
      setDueDate("2025-11-05T18:00");
      setFile(null);
      setSelectedGroups([]);
      setSelectedLearners([]);
      
      onOpenChange(false);
    } catch (error) {
      console.error("[consigne] Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi de la consigne");
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleValue = (value: string, list: string[], setter: (values: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto border-white/10 bg-[#070a16]/95 text-white" style={{ maxHeight: "85vh" }}>
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] bg-clip-text text-lg font-semibold text-transparent">
            Définir une consigne pour le studio apprenant
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Titre de la consigne</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nom de la consigne"
              className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Attentes pédagogiques</Label>
            <Textarea
              value={expectations}
              onChange={(event) => setExpectations(event.target.value)}
              placeholder="Ce que vous attendez des apprenants"
              className="min-h-[140px] rounded-2xl border border-white/10 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/40 focus-visible:ring-offset-0"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Dépôt attendu</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="border-white/10 bg-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Uploader une ressource</Label>
              <Input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="border-white/10 bg-white/10"
              />
              {file ? <p className="text-xs text-white/50">Fichier sélectionné · {file.name}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Destinataires</Label>
            <p className="text-xs text-white/50">
              Sélectionnez les groupes et/ou apprenants qui recevront la consigne et la notification. Un dossier sera automatiquement
              créé dans leur drive.
            </p>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Groupes</p>
                <div className="flex flex-wrap gap-2">
                  {groups.length === 0 ? (
                    <p className="text-xs text-white/50">Aucun groupe disponible</p>
                  ) : (
                    groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleValue(group.id, selectedGroups, setSelectedGroups)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                          selectedGroups.includes(group.id)
                            ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white shadow-lg shadow-[#0072FF]/30"
                            : "border border-white/15 bg-transparent text-white/60 hover:text-white",
                        )}
                      >
                        {group.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Apprenants</p>
                <div className="flex flex-wrap gap-2">
                  {learners.length === 0 ? (
                    <p className="text-xs text-white/50">Aucun apprenant disponible</p>
                  ) : (
                    learners.map((learner) => (
                      <button
                        key={learner.id}
                        type="button"
                        onClick={() => toggleValue(learner.id, selectedLearners, setSelectedLearners)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                          selectedLearners.includes(learner.id)
                            ? "bg-gradient-to-r from-[#8E2DE2] to-[#FF6FD8] text-white shadow-lg shadow-[#8E2DE2]/30"
                            : "border border-white/15 bg-transparent text-white/60 hover:text-white",
                        )}
                      >
                        {learner.full_name || learner.email || "Apprenant"}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {formError ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">{formError}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
            >
              {isSubmitting ? "Envoi en cours..." : "Valider la consigne"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


