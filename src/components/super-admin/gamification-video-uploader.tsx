"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Video, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

type VideoType = "journalist" | "player" | "background" | "other";

type UploadedVideo = {
  id: string;
  url: string;
  path: string;
  title: string;
  video_type: VideoType;
};

export function GamificationVideoUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [formData, setFormData] = useState({
    video_type: "player" as VideoType,
    title: "",
    description: "",
    scenario_context: "media-training-psg",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [syncFileName, setSyncFileName] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Veuillez sélectionner un fichier vidéo");
        return;
      }
      
      // Vérifier la taille (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("La vidéo est trop volumineuse (max 100MB)");
        return;
      }
      
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une vidéo");
      return;
    }

    if (!formData.title) {
      toast.error("Veuillez entrer un titre");
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("video_type", formData.video_type);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("scenario_context", formData.scenario_context);

      const response = await fetch("/api/gamification/videos/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload");
      }

      toast.success("Vidéo uploadée avec succès !");
      
      // Ajouter à la liste
      if (result.video) {
        setUploadedVideos([result.video, ...uploadedVideos]);
      }

      // Réinitialiser le formulaire
      setFormData({
        video_type: "player",
        title: "",
        description: "",
        scenario_context: "media-training-psg",
      });
      setSelectedFile(null);
      
      // Réinitialiser l'input file
      const fileInput = document.getElementById("video-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("[gamification-video-uploader] Error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upload de Vidéos pour Gamification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Sélection de fichier */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Fichier vidéo</label>
            <div className="flex items-center gap-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="bg-white/5 border-white/10 text-white"
                disabled={uploading}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>{selectedFile.name}</span>
                  <span className="text-xs">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Type de vidéo */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Type de vidéo</label>
            <Select
              value={formData.video_type}
              onValueChange={(value) => setFormData({ ...formData, video_type: value as VideoType })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="journalist">Journaliste</SelectItem>
                <SelectItem value="player">Joueur</SelectItem>
                <SelectItem value="background">Fond/Arrière-plan</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Titre */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Titre *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Interview joueur PSG - Conférence de presse"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la vidéo..."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          {/* Contexte du scénario */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Contexte du scénario</label>
            <Input
              value={formData.scenario_context}
              onChange={(e) => setFormData({ ...formData, scenario_context: e.target.value })}
              placeholder="media-training-psg"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Bouton d'upload */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !formData.title}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader la vidéo
              </>
            )}
          </Button>
        </div>

        {/* Section de synchronisation pour vidéos existantes */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-white font-semibold mb-3">Synchroniser une vidéo existante</h3>
          <p className="text-white/60 text-sm mb-4">
            Si vous avez uploadé une vidéo directement dans Supabase Storage, vous pouvez la synchroniser avec la base de données ici.
          </p>
          <div className="space-y-3">
            <Input
              value={syncFileName}
              onChange={(e) => setSyncFileName(e.target.value)}
              placeholder="Nom du fichier dans Storage (ex: 20251028_1045_New Video...mp4)"
              className="bg-white/5 border-white/10 text-white"
            />
            <Button
              onClick={async () => {
                if (!syncFileName) {
                  toast.error("Veuillez entrer le nom du fichier");
                  return;
                }
                setUploading(true);
                try {
                  const response = await fetch("/api/gamification/videos/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      storage_path: syncFileName,
                      video_type: formData.video_type,
                      title: syncFileName.replace(/\.[^/.]+$/, "") || "Vidéo synchronisée",
                      description: formData.description,
                      scenario_context: formData.scenario_context,
                    }),
                  });
                  const result = await response.json();
                  if (!response.ok) {
                    throw new Error(result.error || "Erreur lors de la synchronisation");
                  }
                  toast.success("Vidéo synchronisée avec succès !");
                  if (result.video) {
                    setUploadedVideos([result.video, ...uploadedVideos]);
                  }
                  setSyncFileName(""); // Réinitialiser après succès
                } catch (error) {
                  console.error("[gamification-video-uploader] Sync error:", error);
                  toast.error(error instanceof Error ? error.message : "Erreur lors de la synchronisation");
                } finally {
                  setUploading(false);
                }
              }}
              disabled={uploading || !syncFileName}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                "Synchroniser la vidéo"
              )}
            </Button>
          </div>
        </div>

        {/* Liste des vidéos uploadées */}
        {uploadedVideos.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-white font-semibold mb-3">Vidéos uploadées récemment</h3>
            <div className="space-y-2">
              {uploadedVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{video.title}</p>
                    <p className="text-white/60 text-xs">{video.video_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Voir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

