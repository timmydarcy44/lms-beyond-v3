"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const gradientPrimary = "bg-gradient-to-r from-[#00C6FF] to-[#0072FF]";
const resourceOptions = [
  { value: "pdf", label: "Document PDF" },
  { value: "video", label: "Vidéo" },
  { value: "audio", label: "Audio" },
];

export function ResourceCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(resourceOptions[0].value);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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
      console.log("[resource-create] Envoi de la requête:", { title, type, published });
      
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type,
          published,
        }),
      });

      console.log("[resource-create] Réponse reçue:", { ok: response.ok, status: response.status, statusText: response.statusText });

      if (!response.ok) {
        // Essayer de parser le JSON d'erreur
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Si pas de JSON, utiliser le texte de la réponse
          const text = await response.text();
          throw new Error(text || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const errorMessage = errorData.error || "Erreur lors de la sauvegarde";
        const errorDetails = errorData.details || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const data = await response.json();
      console.log("[resource-create] Données reçues:", data);

      toast.success(published ? "Ressource publiée !" : "Ressource sauvegardée", {
        description: data.message,
      });

      // Rediriger vers la liste des ressources après publication
      if (published) {
        setTimeout(() => {
          router.push("/dashboard/formateur/ressources");
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error("[resource-create] Erreur lors de la sauvegarde:", error);
      
      // Gérer spécifiquement les erreurs de réseau
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
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardContent className="flex flex-col gap-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold text-white md:text-2xl">Préparez votre ressource premium</h2>
              <p className="text-sm text-white/70">
                Les métadonnées sont essentielles pour indexer correctement votre contenu et l'afficher dans les parcours apprenants.
                La date de dépôt et l'auteur seront ajoutés automatiquement à la validation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving || isPublishing}
                className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white ${gradientPrimary}`}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer la ressource"}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving || isPublishing}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:from-emerald-600 hover:to-teal-600"
              >
                {isPublishing ? "Publication..." : "Publier"}
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
              >
                <Link href="/dashboard/formateur/ressources">Retour à la bibliothèque</Link>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] p-8 shadow-2xl shadow-black/40"
          >
            <div className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-[#00C6FF]/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#0072FF]/25 blur-3xl" />
            <div className="relative space-y-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Titre</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Donnez un nom iconique à votre ressource"
                className="h-20 w-full border-0 bg-white/10 text-2xl font-semibold text-white placeholder:text-white/30 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/60 focus-visible:ring-offset-0"
              />
              <p className="text-sm text-white/70">
                Ce titre sera mis en avant dans les parcours et la bibliothèque apprenant. Jouez la carte du storytelling pour capter
                l'attention immédiatement.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Métadonnées</CardTitle>
            <p className="text-sm text-white/60">
              Assurez-vous que la description reflète fidèlement la valeur pédagogique de la ressource.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-2 text-sm text-white/70">
              <span className="uppercase tracking-[0.3em] text-xs text-white/40">Description</span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Décrivez le contenu et la meilleure façon de l'utiliser"
                className="min-h-[140px] rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-white/40 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/50 focus-visible:ring-offset-0"
              />
            </label>

            <label className="space-y-2 text-sm text-white/70">
              <span className="uppercase tracking-[0.3em] text-xs text-white/40">Type de ressource</span>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent className="bg-[#050816] text-white">
                  {resourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-2 text-sm text-white/70">
              <span className="uppercase tracking-[0.3em] text-xs text-white/40">Uploader le fichier</span>
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/20 bg-black/30 p-6">
                <input
                  type="file"
                  accept={type === "pdf" ? "application/pdf" : type === "video" ? "video/*" : "audio/*"}
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                  className="text-sm text-white"
                />
                <p className="text-xs text-white/50">
                  Formats acceptés : PDF / MP4 / MP3. La taille maximale sera définie lors de la connexion Supabase.
                </p>
                {fileName ? <p className="text-xs text-white/70">Fichier sélectionné · {fileName}</p> : null}
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Résumé automatique</CardTitle>
              <p className="text-sm text-white/60">
                Ces informations seront générées automatiquement lors de l'enregistrement côté serveur.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="uppercase tracking-[0.3em] text-xs text-white/40">Date de dépôt</span>
                <span>{depositDate}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="uppercase tracking-[0.3em] text-xs text-white/40">Auteur</span>
                <span>Timmy Darcy (automatique)</span>
              </div>
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-4 text-xs text-white/60">
                Une fois connecté à Supabase, les champs statut, URL sécurisée et taille du fichier seront ajoutés automatiquement.
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </form>
  );
}


