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

const fileResourceOptions = [
  { value: "pdf", label: "Document PDF" },
  { value: "video", label: "Vidéo" },
  { value: "audio", label: "Audio" },
];

type SourceMode = "upload" | "html";

export function ResourceCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [type, setType] = useState<string>(fileResourceOptions[0].value);
  const [htmlContent, setHtmlContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const depositDate = useMemo(
    () => new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }),
    [],
  );

  const handleSave = async (published: boolean = false) => {
    if (!title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour la ressource avant de sauvegarder.",
      });
      return;
    }

    if (sourceMode === "html" && !htmlContent.trim()) {
      toast.error("Contenu HTML requis", {
        description: "Collez ou saisissez le code HTML à intégrer.",
      });
      return;
    }

    if (sourceMode === "upload" && published && !file && type === "pdf") {
      toast.error("Fichier requis", {
        description: "Ajoutez un fichier avant de publier une ressource PDF.",
      });
      return;
    }

    if (published) setIsPublishing(true);
    else setIsSaving(true);

    try {
      let response: Response;

      if (sourceMode === "upload" && file) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("type", type);
        formData.append("published", String(published));
        formData.append("file", file);
        response = await fetch("/api/resources", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            type: sourceMode === "html" ? "html" : type,
            html_content: sourceMode === "html" ? htmlContent : undefined,
            published,
          }),
        });
      }

      if (!response.ok) {
        let errorData: { error?: string; details?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          throw new Error(text || `Erreur HTTP ${response.status}`);
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
          router.push("/dashboard/formateur/ressources");
          router.refresh();
        }, 1200);
      }
    } catch (error) {
      console.error("[resource-create] Erreur:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde.",
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave(false);
      }}
      className="space-y-8 pb-16"
    >
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardContent className="flex flex-col gap-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold text-white md:text-2xl">Préparez votre ressource</h2>
              <p className="text-sm text-white/70">
                Uploadez un fichier (PDF, vidéo, audio) ou intégrez directement une page HTML pour vos apprenants.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={isSaving || isPublishing}
                className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white ${gradientPrimary}`}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave(true)}
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
                <Link href="/dashboard/formateur/ressources">Retour</Link>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] p-8 shadow-2xl shadow-black/40"
          >
            <div className="relative space-y-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Titre</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Donnez un nom à votre ressource"
                className="h-20 w-full border-0 bg-white/10 text-2xl font-semibold text-white placeholder:text-white/30 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/60 focus-visible:ring-offset-0"
              />
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contenu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceMode("upload")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  sourceMode === "upload" ? "bg-[#0A84FF] text-white" : "bg-white/10 text-white/70"
                }`}
              >
                Upload fichier
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("html")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  sourceMode === "html" ? "bg-[#0A84FF] text-white" : "bg-white/10 text-white/70"
                }`}
              >
                Intégration HTML
              </button>
            </div>

            <label className="space-y-2 text-sm text-white/70">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Description</span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Résumé pédagogique (visible dans le catalogue)"
                className="min-h-[100px] rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-white/40"
              />
            </label>

            {sourceMode === "upload" ? (
              <>
                <label className="space-y-2 text-sm text-white/70">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/40">Type de fichier</span>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#050816] text-white">
                      {fileResourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="space-y-2 text-sm text-white/70">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/40">Fichier</span>
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/20 bg-black/30 p-6">
                    <input
                      type="file"
                      accept={
                        type === "pdf" ? "application/pdf" : type === "video" ? "video/*" : "audio/*"
                      }
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="text-sm text-white"
                    />
                    {file ? <p className="text-xs text-white/70">Fichier sélectionné · {file.name}</p> : null}
                  </div>
                </label>
              </>
            ) : (
              <label className="space-y-2 text-sm text-white/70">
                <span className="text-xs uppercase tracking-[0.3em] text-white/40">Code HTML</span>
                <Textarea
                  value={htmlContent}
                  onChange={(event) => setHtmlContent(event.target.value)}
                  placeholder="<section>...</section> ou iframe embed"
                  className="min-h-[280px] rounded-2xl border border-white/10 bg-black/30 font-mono text-sm text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white/50">
                  Le HTML sera affiché directement aux apprenants ayant accès à la ressource. Évitez les scripts non
                  sécurisés.
                </p>
              </label>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/70">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Mode</span>
              <span>{sourceMode === "html" ? "HTML intégré" : "Upload fichier"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Date de dépôt</span>
              <span>{depositDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
