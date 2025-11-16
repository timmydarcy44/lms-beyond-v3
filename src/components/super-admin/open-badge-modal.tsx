"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge, BadgeCheck, Upload } from "lucide-react";
import { toast } from "sonner";

type OpenBadgeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (badge: { name: string; description: string; imageUrl?: string }) => void;
  initialName?: string;
  initialDescription?: string;
  initialImageUrl?: string;
};

export function OpenBadgeModal({
  open,
  onOpenChange,
  onSave,
  initialName = "",
  initialDescription = "",
  initialImageUrl = "",
}: OpenBadgeModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);

  // Synchroniser avec les valeurs initiales quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
      setImageUrl(initialImageUrl);
    }
  }, [open, initialName, initialDescription, initialImageUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Accepter les images et les GIFs
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image ou un GIF");
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Intégrer avec Supabase Storage pour l'upload réel
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
        setIsUploading(false);
        toast.success("Image chargée avec succès !");
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Erreur lors du chargement de l'image");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("[open-badge] Upload error:", error);
      setIsUploading(false);
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Le nom du badge est requis");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
    });

    toast.success("Badge créé avec succès");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <BadgeCheck className="h-5 w-5 text-gray-700" />
            Créer un Open Badge
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Configurez votre badge numérique Open Badge qui sera délivré aux apprenants à la fin du module.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="badge-name" className="text-sm font-medium text-gray-700">
              Nom du badge *
            </Label>
            <Input
              id="badge-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Badge Neuro Insights"
              className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="badge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Atteste de votre maîtrise des leviers attentionnels et émotionnels."
              className="min-h-[100px] resize-none bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-image" className="text-sm font-medium text-gray-700">
              Image du badge
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="badge-image"
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleFileUpload}
                  className="bg-gray-50 border-black text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="text-sm text-gray-500">Chargement...</div>
              )}
            </div>
            {imageUrl && (
              <div className="mt-2">
                {imageUrl.endsWith('.gif') || imageUrl.includes('data:image/gif') ? (
                  <img src={imageUrl} alt="Aperçu du badge" className="h-20 w-20 rounded-lg border border-black object-cover" />
                ) : (
                  <img src={imageUrl} alt="Aperçu du badge" className="h-20 w-20 rounded-lg border border-black object-cover" />
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-black bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <Badge className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">À propos des Open Badges</p>
                <p>
                  Les Open Badges sont des certificats numériques vérifiables qui attestent des compétences acquises. 
                  Ils peuvent être partagés sur LinkedIn, ajoutés à un CV numérique, ou stockés dans un wallet de badges.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="border border-black text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
          >
            Créer le badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

