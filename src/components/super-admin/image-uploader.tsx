"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  accept?: string;
};

export function ImageUploader({ value, onChange, className, accept = "image/*" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlValue, setUrlValue] = useState(value || "");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Accepter les images et les GIFs
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image ou un GIF");
      return;
    }

    // Limite de taille (10MB pour les images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("L'image est trop volumineuse. Taille maximale : 10MB");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Intégrer avec Supabase Storage pour l'upload réel
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setUrlValue(base64String);
        setIsUploading(false);
        toast.success("Image chargée avec succès !");
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Erreur lors du chargement de l'image");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("[image-uploader] Upload error:", error);
      setIsUploading(false);
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    onChange(url);
  };

  const handleRemoveImage = () => {
    onChange("");
    setUrlValue("");
  };

  return (
    <div className={cn("space-y-3", className)}>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-sm text-gray-700">
              URL de l'image
            </Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                value={urlValue}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {value && (
            <div className="rounded-lg border border-black bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
              <img src={value} alt="Preview" className="h-32 w-full rounded object-cover" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

