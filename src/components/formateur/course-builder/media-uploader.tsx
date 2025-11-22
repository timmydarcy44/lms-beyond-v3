"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MediaUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  mediaType: "video" | "audio";
  className?: string;
};

export function MediaUploader({ value, onChange, accept, mediaType, className }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlValue, setUrlValue] = useState(value || "");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    const validAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a"];

    if (mediaType === "video" && !validVideoTypes.includes(file.type)) {
      toast.error("Format de fichier non supporté. Utilisez MP4, WebM, MOV ou AVI.");
      return;
    }

    if (mediaType === "audio" && !validAudioTypes.includes(file.type)) {
      toast.error("Format de fichier non supporté. Utilisez MP3, WAV, OGG ou M4A.");
      return;
    }

    // Limite de taille (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 100MB");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Intégrer avec Supabase Storage pour l'upload réel
      // Pour l'instant, on génère une URL temporaire (base64 pour les tests)
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Pour les tests, on utilise base64. En production, il faudra uploader vers Supabase Storage
        onChange(base64String);
        setIsUploading(false);
        toast.success("Fichier chargé avec succès !");
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Erreur lors du chargement du fichier");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("[media-uploader] Upload error:", error);
      setIsUploading(false);
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    onChange(url);
  };

  const handleRemoveMedia = () => {
    onChange("");
    setUrlValue("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Tabs defaultValue={value ? "url" : "upload"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40">
          <TabsTrigger value="upload" className="data-[state=active]:bg-white/10">
            <Upload className="h-4 w-4 mr-2" />
            Uploader
          </TabsTrigger>
          <TabsTrigger value="url" className="data-[state=active]:bg-white/10">
            <LinkIcon className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3 mt-3">
          <div className="flex items-center gap-3">
            <Label htmlFor="media-upload" className="text-sm text-white/70">
              {mediaType === "video" ? "Fichier vidéo" : "Fichier audio"}
            </Label>
            <Input
              id="media-upload"
              type="file"
              accept={accept || (mediaType === "video" ? "video/*" : "audio/*")}
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1 bg-black/40 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
            {isUploading && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
          </div>
          {value && (
            <div className="rounded-lg border border-white/20 bg-black/60 p-3 flex items-center justify-between">
              <span className="text-sm text-white/70 truncate">
                {mediaType === "video" ? "✓ Vidéo chargée" : "✓ Audio chargé"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveMedia}
                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label htmlFor="media-url" className="text-sm text-white/70">
              {mediaType === "video" ? "URL de la vidéo" : "URL de l'audio"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="media-url"
                type="url"
                value={urlValue}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={
                  mediaType === "video"
                    ? "https://example.com/video.mp4"
                    : "https://example.com/audio.mp3"
                }
                className="flex-1 bg-black/40 text-white placeholder:text-white/30"
              />
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveMedia}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {value && (
            <div className="rounded-lg border border-white/20 bg-black/60 p-3">
              <p className="text-xs text-white/50 mb-1">URL configurée :</p>
              <p className="text-sm text-white/70 truncate">{value}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}








