"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type ImageUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (url: string) => void;
  title: string;
  accept?: string;
};

export function ImageUploadModal({
  open,
  onOpenChange,
  value,
  onChange,
  title,
  accept = "image/*,.gif",
}: ImageUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlValue, setUrlValue] = useState(value || "");

  useEffect(() => {
    if (open) {
      setUrlValue(value || "");
    }
  }, [open, value]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image ou un GIF");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("L'image est trop volumineuse. Taille maximale : 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setUrlValue(base64String);
        setIsUploading(false);
        toast.success("Image chargée avec succès !");
        onOpenChange(false);
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Erreur lors du chargement de l'image");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("[image-upload-modal] Upload error:", error);
      setIsUploading(false);
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
  };

  const handleSave = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim());
      onOpenChange(false);
      toast.success("Image sauvegardée !");
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlValue("");
    onOpenChange(false);
    toast.success("Image supprimée");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Tabs defaultValue={value && !value.startsWith("data:") ? "url" : "upload"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
                <Upload className="h-4 w-4 mr-2" />
                Uploader
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
                <LinkIcon className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 mt-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="image-upload" className="text-sm text-gray-700">
                  Fichier image
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept={accept}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1 bg-gray-50 border-black text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer"
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
              </div>
              {value && (
                <div className="rounded-lg border border-black bg-gray-50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {value.startsWith("data:") ? (
                      <img src={value} alt="Preview" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700">
                      ✓ Image {value.startsWith("data:") ? "chargée" : "configurée"}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-sm text-gray-700">
                  URL de l'image
                </Label>
                <Input
                  id="image-url"
                  type="url"
                  value={urlValue}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
              </div>
              {urlValue && (
                <div className="rounded-lg border border-black bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
                  <img src={urlValue} alt="Preview" className="h-32 w-full rounded object-cover" onError={() => toast.error("URL d'image invalide")} />
                </div>
              )}
            </TabsContent>
          </Tabs>
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



