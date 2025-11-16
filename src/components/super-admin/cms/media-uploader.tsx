"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type MediaUploaderProps = {
  type: "image" | "video";
  value?: string;
  onChange: (url: string, metadata?: { width?: number; height?: number; alt?: string }) => void;
};

export function MediaUploader({ type, value, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (type === "image" && !file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      toast.error("Veuillez sélectionner une vidéo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/cms/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const data = await response.json();
      setPreview(data.url);
      onChange(data.url, data.metadata);
      toast.success("Fichier uploadé avec succès");
    } catch (error) {
      console.error("[media-uploader] Error uploading:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative">
          {type === "image" ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-gray-200"
            />
          ) : (
            <video
              src={preview}
              controls
              className="w-full h-auto rounded-lg border border-gray-200"
            />
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            {type === "image" ? (
              <ImageIcon className="h-12 w-12 text-gray-400" />
            ) : (
              <Video className="h-12 w-12 text-gray-400" />
            )}
            <div>
              <Label htmlFor={`file-upload-${type}`} className="cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  Cliquez pour uploader {type === "image" ? "une image" : "une vidéo"}
                </span>
              </Label>
              <Input
                id={`file-upload-${type}`}
                type="file"
                accept={type === "image" ? "image/*" : "video/*"}
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </div>
            {uploading && (
              <p className="text-sm text-gray-500">Upload en cours...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



