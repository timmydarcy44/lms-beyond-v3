"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link as LinkIcon, X, Video } from "lucide-react";
import { toast } from "sonner";

type VideoUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (url: string) => void;
  title: string;
};

export function VideoUploadModal({
  open,
  onOpenChange,
  value,
  onChange,
  title,
}: VideoUploadModalProps) {
  const [urlValue, setUrlValue] = useState(value || "");

  useEffect(() => {
    if (open) {
      setUrlValue(value || "");
    }
  }, [open, value]);

  const handleSave = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      onOpenChange(false);
      toast.success("Vidéo sauvegardée !");
    } else {
      toast.error("Veuillez entrer une URL valide");
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlValue("");
    onOpenChange(false);
    toast.success("Vidéo supprimée");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-url" className="text-sm text-gray-700 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL de la vidéo
            </Label>
            <Input
              id="video-url"
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://storage.googleapis.com/... ou https://youtube.com/..."
              className="w-full bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
            />
            <p className="text-xs text-gray-500">
              Supporte les URLs YouTube, Vimeo, ou les fichiers hébergés (MP4, WebM, etc.)
            </p>
          </div>
          {urlValue && (
            <div className="rounded-lg border border-black bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
              <div className="aspect-video w-full bg-black rounded flex items-center justify-center">
                {urlValue.includes('youtube.com') || urlValue.includes('youtu.be') || urlValue.includes('vimeo.com') ? (
                  <div className="text-white text-sm">Vidéo externe détectée</div>
                ) : (
                  <video src={urlValue} controls className="w-full h-full rounded" />
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-black text-gray-900 hover:bg-gray-100"
          >
            Annuler
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Supprimer
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={!urlValue.trim() && !value}
            className="bg-black text-white hover:bg-gray-900"
          >
            {value ? "Modifier" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




