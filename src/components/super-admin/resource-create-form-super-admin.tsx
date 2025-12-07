"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, Video, FileText } from "lucide-react";
import { CategorySelectField } from "./category-select-field";
import { ImageUpload } from "@/components/ui/image-upload";

const resourceOptions = [
  { value: "pdf", label: "Document PDF", icon: FileText },
  { value: "video", label: "Vidéo", icon: Video },
  { value: "audio", label: "Audio", icon: Headphones },
];

export function ResourceCreateFormSuperAdmin() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(resourceOptions[0].value);
  const [price, setPrice] = useState<string>("10");
  const [category, setCategory] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const selectedOption = resourceOptions.find(opt => opt.value === type);
  const TypeIcon = selectedOption?.icon || FileText;

  const depositDate = useMemo(() => new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }), []);

  const handleSave = async (published: boolean = false) => {
    if (!title || !title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour la ressource avant de sauvegarder.",
      });
      return;
    }

    if (published) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Si un fichier PDF est sélectionné et que le type est "pdf", utiliser FormData
      const isPdfUpload = type === "pdf" && file;
      
      let response: Response;
      if (isPdfUpload) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim() || "");
        formData.append("type", type);
        formData.append("price", String(parseFloat(price) || 0));
        formData.append("category", category.trim() || "");
        formData.append("cover_image_url", coverImageUrl || "");
        formData.append("published", String(published));
        formData.append("file", file); // Ajouter le fichier PDF

        response = await fetch("/api/resources", {
          method: "POST",
          body: formData, // Pas de Content-Type header, le navigateur le définit automatiquement avec le boundary
        });
      } else {
        response = await fetch("/api/resources", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            type,
            price: parseFloat(price) || 0,
            category: category.trim() || null,
            cover_image_url: coverImageUrl || null,
            published,
          }),
        });
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          throw new Error(text || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const errorMessage = errorData.error || "Erreur lors de la sauvegarde";
        const errorDetails = errorData.details || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const data = await response.json();

      toast.success(published ? "Ressource publiée !" : "Ressource sauvegardée", {
        description: data.message,
      });

      if (published) {
        setTimeout(() => {
          router.push("/super/studio/ressources");
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error("[resource-create-super-admin] Erreur:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Erreur réseau", {
          description: "Impossible de contacter le serveur. Vérifiez votre connexion.",
        });
      } else {
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde.",
        });
      }
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-8 pb-16">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 md:text-2xl" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Préparez votre ressource premium
              </h2>
              <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Les métadonnées sont essentielles pour indexer correctement votre contenu et l'afficher dans les parcours apprenants.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving || isPublishing}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-violet-700"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving || isPublishing}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-teal-600"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                {isPublishing ? "Publication..." : "Publier"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-lg border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                <Link href="/super/studio/ressources">Retour</Link>
              </Button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="relative space-y-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Titre
              </span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Donnez un nom iconique à votre ressource"
                className="h-20 w-full border-gray-300 bg-gray-50 text-2xl font-semibold text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              />
              <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Ce titre sera mis en avant dans les parcours et la bibliothèque apprenant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              Métadonnées
            </CardTitle>
            <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              Assurez-vous que la description reflète fidèlement la valeur pédagogique de la ressource.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-2 text-sm text-gray-700">
              <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Description
              </span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Décrivez le contenu et la meilleure façon de l'utiliser"
                className="min-h-[140px] rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              />
            </label>

            <label className="space-y-2 text-sm text-gray-700">
              <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Type de ressource
              </span>
              <div className="flex items-center gap-3">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="flex-1 border-gray-300 bg-white text-gray-900">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {resourceOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <OptionIcon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center w-12 h-10 rounded-lg border border-gray-300 bg-gray-50">
                  <TypeIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </label>

            <label className="space-y-2 text-sm text-gray-700">
              <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Prix (€)
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              />
            </label>

            <CategorySelectField
              value={category}
              onChange={setCategory}
              label="Catégorie"
            />

            <ImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              label="Image de couverture"
              bucket="Public"
              folder="covers"
            />

            <label className="space-y-2 text-sm text-gray-700">
              <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Uploader le fichier
              </span>
              <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                <input
                  type="file"
                  accept={type === "pdf" ? "application/pdf" : type === "video" ? "video/*" : "audio/*"}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    setFile(selectedFile);
                    setFileName(selectedFile?.name ?? null);
                  }}
                  className="text-sm text-gray-700"
                />
                <p className="text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Formats acceptés : PDF / MP4 / MP3
                </p>
                {fileName ? <p className="text-xs text-gray-700">Fichier sélectionné · {fileName}</p> : null}
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Résumé automatique
              </CardTitle>
              <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Ces informations seront générées automatiquement lors de l'enregistrement.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Date de dépôt
                </span>
                <span>{depositDate}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="uppercase tracking-wider text-xs text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Auteur
                </span>
                <span>Super Admin (automatique)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

