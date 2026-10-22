"use client";

import { useEffect, useMemo, useState } from "react";
import { Library, Loader2, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import {
  buildAssessmentPlacementOptions,
  insertSubchapterAtPlacement,
  parsePlacementValue,
} from "@/lib/course-builder/assessment-placement";
import type { CourseBuilderResource, CourseBuilderSnapshot } from "@/types/course-builder";

type LibraryResource = {
  id: string;
  title: string;
  type: string;
  status: string;
};

type AddCourseResourceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs déjà intégrés dans cette formation */
  usedResourceIds?: string[];
};

type SourceMode = "upload" | "html";

const fileResourceOptions = [
  { value: "pdf", label: "Document PDF" },
  { value: "video", label: "Vidéo" },
  { value: "audio", label: "Audio" },
];

function mapResourceType(type: string): CourseBuilderResource["type"] {
  const t = type.toLowerCase();
  if (t === "pdf" || t === "video" || t === "audio" || t === "html") return t;
  return "document";
}

function integrateResource(
  snapshot: CourseBuilderSnapshot,
  resource: { id: string; title: string; type: string },
  placementValue: string,
  placementLabel: string,
) {
  const placement = parsePlacementValue(placementValue);
  const resourceUrl = `/ressources/${resource.id}`;
  const mappedType = mapResourceType(resource.type);
  const safeTitle = resource.title.replace(/"/g, "&quot;");

  const block = {
    id: nanoid(),
    title: resource.title,
    duration: "5 min",
    type: "document" as const,
    summary: "Ressource complémentaire à consulter.",
    content: `<p><a href="${resourceUrl}" target="_blank" rel="noreferrer">Consulter la ressource « ${safeTitle} »</a></p>`,
    kind: "resource" as const,
    resource_id: resource.id,
  };

  const next = structuredClone(snapshot);
  next.resources = Array.isArray(next.resources) ? next.resources : [];
  next.resources.push({
    id: nanoid(),
    title: resource.title,
    type: mappedType,
    url: resourceUrl,
    resource_id: resource.id,
    placement_label: placementLabel,
  });

  return insertSubchapterAtPlacement(next, block, placement);
}

export function AddCourseResourceModal({
  open,
  onOpenChange,
  usedResourceIds = [],
}: AddCourseResourceModalProps) {
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const hydrateFromSnapshot = useCourseBuilder((s) => s.hydrateFromSnapshot);

  const [mode, setMode] = useState<"create" | "library">("create");
  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [placementValue, setPlacementValue] = useState("end");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [fileType, setFileType] = useState("pdf");
  const [htmlContent, setHtmlContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const placementOptions = useMemo(
    () => buildAssessmentPlacementOptions(snapshot.sections),
    [snapshot.sections],
  );

  useEffect(() => {
    if (!open) {
      setMode("create");
      setSelectedResourceId("");
      setPlacementValue("end");
      setTitle("");
      setDescription("");
      setSourceMode("upload");
      setFileType("pdf");
      setHtmlContent("");
      setFile(null);
      return;
    }

    setLoadingLibrary(true);
    fetch("/api/formateur/content-library")
      .then((res) => res.json())
      .then((data: { resources?: LibraryResource[] }) => {
        setLibrary(Array.isArray(data.resources) ? data.resources : []);
      })
      .catch(() => {
        toast.error("Impossible de charger vos ressources.");
        setLibrary([]);
      })
      .finally(() => setLoadingLibrary(false));
  }, [open]);

  const availableResources = useMemo(
    () => library.filter((r) => !usedResourceIds.includes(r.id)),
    [library, usedResourceIds],
  );

  const selectedResource = availableResources.find((r) => r.id === selectedResourceId);
  const placementLabel =
    placementOptions.find((o) => o.value === placementValue)?.label ?? "Formation";

  const placeInCourse = (resource: { id: string; title: string; type: string }) => {
    const injected = integrateResource(snapshot, resource, placementValue, placementLabel);
    hydrateFromSnapshot(injected);
    toast.success("Ressource intégrée", {
      description: `Placée : ${placementLabel}`,
    });
    onOpenChange(false);
  };

  const handleAddExisting = () => {
    if (!selectedResource) {
      toast.error("Sélectionnez une ressource.");
      return;
    }
    setBusy(true);
    try {
      placeInCourse(selectedResource);
    } catch (e) {
      console.error("[add-course-resource]", e);
      toast.error(e instanceof Error ? e.message : "Impossible d'intégrer la ressource.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }
    if (sourceMode === "html" && !htmlContent.trim()) {
      toast.error("Collez le contenu HTML à intégrer.");
      return;
    }
    if (sourceMode === "upload" && !file) {
      toast.error("Ajoutez un fichier.");
      return;
    }

    setBusy(true);
    try {
      let response: Response;
      if (sourceMode === "upload" && file) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("type", fileType);
        formData.append("published", "true");
        formData.append("file", file);
        response = await fetch("/api/resources", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            type: "html",
            html_content: htmlContent,
            published: true,
          }),
        });
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        resource?: { id?: string };
      };
      if (!response.ok || !data.resource?.id) {
        const message = data.details ? `${data.error ?? "Erreur"}: ${data.details}` : data.error;
        throw new Error(message || "Impossible de créer la ressource.");
      }

      placeInCourse({
        id: data.resource.id,
        title: title.trim(),
        type: sourceMode === "html" ? "html" : fileType,
      });
    } catch (e) {
      console.error("[add-course-resource]", e);
      toast.error(e instanceof Error ? e.message : "Impossible de créer la ressource.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border border-white/10 bg-slate-950 bg-gradient-to-br from-sky-950/40 via-slate-950 to-emerald-950/30 p-0 text-white shadow-2xl">
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Library className="h-5 w-5 text-teal-300" />
                Ajouter une ressource
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Créez le fichier ou la page ici. Elle est publiée puis placée dans le parcours, sans passer par la bibliothèque.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                  mode === "create" ? "bg-white text-slate-950" : "bg-white/10 text-white/80"
                }`}
              >
                Créer ici
              </button>
              <button
                type="button"
                onClick={() => setMode("library")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                  mode === "library" ? "bg-white text-slate-950" : "bg-white/10 text-white/80"
                }`}
              >
                Bibliothèque
              </button>
            </div>

            {mode === "create" ? (
              <div className="space-y-4">
                <label className="space-y-2 text-sm text-white/80">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Titre</span>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Nom de la ressource"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  />
                </label>

                <label className="space-y-2 text-sm text-white/80">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Description</span>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Résumé visible dans le catalogue"
                    className="min-h-[80px] border-white/10 bg-black/30 text-white placeholder:text-white/40"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceMode("upload")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                      sourceMode === "upload" ? "bg-[#0A84FF] text-white" : "bg-white/10 text-white/70"
                    }`}
                  >
                    Fichier
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode("html")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                      sourceMode === "html" ? "bg-[#0A84FF] text-white" : "bg-white/10 text-white/70"
                    }`}
                  >
                    HTML
                  </button>
                </div>

                {sourceMode === "upload" ? (
                  <>
                    <label className="space-y-2 text-sm text-white/80">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Type</span>
                      <Select value={fileType} onValueChange={setFileType}>
                        <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border border-white/10 bg-slate-950 text-white">
                          {fileResourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm text-white/80">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Fichier</span>
                      <input
                        type="file"
                        accept={fileType === "pdf" ? "application/pdf" : fileType === "video" ? "video/*" : "audio/*"}
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                      />
                      {file ? <p className="text-xs text-white/70">{file.name}</p> : null}
                    </label>
                  </>
                ) : (
                  <label className="space-y-2 text-sm text-white/80">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Code HTML</span>
                    <Textarea
                      value={htmlContent}
                      onChange={(event) => setHtmlContent(event.target.value)}
                      placeholder="<section>...</section>"
                      className="min-h-[160px] border-white/10 bg-black/30 font-mono text-sm text-white placeholder:text-white/40"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Ressource existante</Label>
                {loadingLibrary ? (
                  <p className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement de vos ressources…
                  </p>
                ) : availableResources.length === 0 ? (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Aucune ressource dans la bibliothèque. Utilisez « Créer ici ».
                  </p>
                ) : (
                  <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                    <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Sélectionner une ressource" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 border border-white/10 bg-slate-950/95 text-white">
                      {availableResources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id} className="text-white">
                          {resource.title}
                          {resource.status !== "published" ? " (brouillon)" : ""}
                          {" · "}
                          {resource.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white">Où placer cette ressource ?</Label>
              <Select value={placementValue} onValueChange={setPlacementValue}>
                <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Choisir un emplacement" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border border-white/10 bg-slate-950/95 text-white">
                  {placementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                La ressource apparaîtra comme une étape dédiée dans le parcours, au même titre qu&apos;un quiz.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 bg-black/20 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white"
            >
              Annuler
            </Button>
            {mode === "create" ? (
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleCreateAndAdd()}
                className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 px-6 font-semibold text-white hover:opacity-95"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Créer et intégrer
              </Button>
            ) : (
              <Button
                type="button"
                disabled={busy || !selectedResource || loadingLibrary}
                onClick={handleAddExisting}
                className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 px-6 font-semibold text-white hover:opacity-95"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Intégrer la ressource
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
