"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type AIGeneratorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "description" | "company_presentation";
  metadata?: Record<string, any>;
  onGenerated: (text: string) => void;
};

export function AIGeneratorModal({
  open,
  onOpenChange,
  type,
  metadata = {},
  onGenerated,
}: AIGeneratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const payload: any = {
        type,
        metadata: {
          ...metadata,
          additional_prompt: additionalPrompt,
        },
      };

      if (type === "company_presentation") {
        payload.metadata.company_website = companyWebsite;
      }

      const response = await fetch("/api/beyond-connect/job-offers/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération");
      }

      const data = await response.json();
      onGenerated(data.result);
      toast.success("Texte généré avec succès");
      onOpenChange(false);
      setAdditionalPrompt("");
      setCompanyWebsite("");
    } catch (error: any) {
      console.error("[ai-generator-modal] Error:", error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="h-5 w-5 text-[#003087]" />
            {type === "description"
              ? "Créer la description grâce à l'IA"
              : "Créer une présentation grâce à Beyond AI"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {type === "description"
              ? "L'IA va générer une description complète de l'annonce en utilisant toutes les métadonnées du formulaire."
              : "Rédigez un prompt pour générer la présentation de votre entreprise."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === "company_presentation" && (
            <div>
              <Label htmlFor="company_website" className="text-gray-900">
                Site web de l'entreprise (optionnel)
              </Label>
              <Input
                id="company_website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://www.exemple.com"
                className="bg-white border-gray-300 mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                L'IA pourra analyser votre site web pour enrichir la présentation
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="additional_prompt" className="text-gray-900">
              {type === "description"
                ? "Instructions supplémentaires (optionnel)"
                : "Votre prompt"}
            </Label>
            <Textarea
              id="additional_prompt"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder={
                type === "description"
                  ? "Ex: Mettez l'accent sur l'aspect innovant du poste..."
                  : "Ex: Nous sommes une startup tech innovante dans le secteur de la fintech, avec une équipe jeune et dynamique..."
              }
              rows={6}
              className="bg-white border-gray-300 mt-1"
            />
            {type === "company_presentation" && (
              <p className="mt-1 text-xs text-gray-500">
                Décrivez votre entreprise, son secteur, ses valeurs, sa culture...
              </p>
            )}
          </div>

          {type === "description" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Métadonnées utilisées :</strong>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-800 list-disc list-inside">
                {metadata.title && <li>Intitulé : {metadata.title}</li>}
                {metadata.contract_type && <li>Type de contrat : {metadata.contract_type}</li>}
                {metadata.location && <li>Lieu : {metadata.location}</li>}
                {metadata.required_skills?.length > 0 && (
                  <li>Compétences : {metadata.required_skills.join(", ")}</li>
                )}
                {metadata.required_soft_skills?.length > 0 && (
                  <li>Soft skills : {metadata.required_soft_skills.length} sélectionné(s)</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-300 text-gray-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-[#003087] hover:bg-[#002a6b] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

