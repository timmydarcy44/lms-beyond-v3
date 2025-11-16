"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Layout } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateImageModalProps = {
  templateId: string;
  templateHtml: string;
  imageKeys: string[];
  onInsert: (templateHtml: string) => void;
  onClose: () => void;
};

export function TemplateImageModal({
  templateId,
  templateHtml,
  imageKeys,
  onInsert,
  onClose,
}: TemplateImageModalProps) {
  const [templateImages, setTemplateImages] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    imageKeys.forEach((key) => {
      initial[key] = "";
    });
    return initial;
  });
  const [isUploadingImage, setIsUploadingImage] = useState<{ [key: string]: boolean }>({});

  const handleImageUpload = async (imageKey: string, file: File) => {
    setIsUploadingImage((prev) => ({ ...prev, [imageKey]: true }));
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTemplateImages((prev) => ({ ...prev, [imageKey]: base64String }));
        setIsUploadingImage((prev) => ({ ...prev, [imageKey]: false }));
      };
      reader.onerror = () => {
        setIsUploadingImage((prev) => ({ ...prev, [imageKey]: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erreur upload image:", error);
      setIsUploadingImage((prev) => ({ ...prev, [imageKey]: false }));
    }
  };

  const handleInsert = () => {
    let finalTemplate = templateHtml;
    Object.entries(templateImages).forEach(([key, imageUrl]) => {
      finalTemplate = finalTemplate.replace(
        `{{${key}}}`,
        imageUrl || "https://via.placeholder.com/400x300"
      );
    });
    onInsert(finalTemplate);
  };

  const isUploading = Object.values(isUploadingImage).some((uploading) => uploading);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-white/20 bg-black/95 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Configurer les images du template</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {imageKeys.map((imageKey, index) => (
            <div key={imageKey} className="space-y-2">
              <Label className="text-sm text-white/80">
                Image {index + 1}{" "}
                {templateId === "two-columns"
                  ? imageKey === "image1"
                    ? "(Colonne gauche)"
                    : "(Colonne droite)"
                  : ""}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(imageKey, file);
                    }
                  }}
                  className="flex-1 bg-black/40 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  disabled={isUploadingImage[imageKey]}
                />
                <Input
                  type="url"
                  placeholder="Ou entrez une URL"
                  value={
                    templateImages[imageKey] && !templateImages[imageKey].startsWith("data:")
                      ? templateImages[imageKey]
                      : ""
                  }
                  onChange={(e) => {
                    setTemplateImages((prev) => ({ ...prev, [imageKey]: e.target.value }));
                  }}
                  className="flex-1 bg-black/40 text-white placeholder:text-white/30"
                  disabled={isUploadingImage[imageKey]}
                />
              </div>
              {isUploadingImage[imageKey] && (
                <p className="text-xs text-white/60">Upload en cours...</p>
              )}
              {templateImages[imageKey] && (
                <div className="relative mt-2">
                  <img
                    src={templateImages[imageKey]}
                    alt={`Preview ${imageKey}`}
                    className="h-32 w-full rounded border border-white/20 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white hover:opacity-90"
            disabled={isUploading}
          >
            <Layout className="mr-2 h-4 w-4" />
            Insérer le template
          </Button>
        </div>
      </div>
    </div>
  );
}

