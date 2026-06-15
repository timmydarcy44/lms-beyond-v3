"use client";

import { useEffect, useMemo, useState } from "react";
import { Library, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import {
  buildAssessmentPlacementOptions,
  insertSubchapterAtPlacement,
  parsePlacementValue,
} from "@/lib/course-builder/assessment-placement";
import type { CourseBuilderResource } from "@/types/course-builder";

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

function mapResourceType(type: string): CourseBuilderResource["type"] {
  const t = type.toLowerCase();
  if (t === "pdf" || t === "video" || t === "audio" || t === "html") return t;
  return "document";
}

export function AddCourseResourceModal({
  open,
  onOpenChange,
  usedResourceIds = [],
}: AddCourseResourceModalProps) {
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const hydrateFromSnapshot = useCourseBuilder((s) => s.hydrateFromSnapshot);

  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [placementValue, setPlacementValue] = useState("end");
  const [busy, setBusy] = useState(false);

  const placementOptions = useMemo(
    () => buildAssessmentPlacementOptions(snapshot.sections),
    [snapshot.sections],
  );

  useEffect(() => {
    if (!open) {
      setSelectedResourceId("");
      setPlacementValue("end");
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

  const handleAdd = () => {
    if (!selectedResource) {
      toast.error("Sélectionnez une ressource.");
      return;
    }

    setBusy(true);
    try {
      const placement = parsePlacementValue(placementValue);
      const placementLabel =
        placementOptions.find((o) => o.value === placementValue)?.label ?? "Formation";

      const resourceUrl = `/ressources/${selectedResource.id}`;
      const mappedType = mapResourceType(selectedResource.type);

      const block = {
        id: nanoid(),
        title: selectedResource.title,
        duration: "5 min",
        type: "document" as const,
        summary: "Ressource complémentaire à consulter.",
        content: `<p><a href="${resourceUrl}" target="_blank" rel="noreferrer">Consulter la ressource « ${selectedResource.title.replace(/"/g, "&quot;")} »</a></p>`,
        kind: "resource" as const,
        resource_id: selectedResource.id,
      };

      const next = structuredClone(snapshot);
      next.resources = Array.isArray(next.resources) ? next.resources : [];
      next.resources.push({
        id: nanoid(),
        title: selectedResource.title,
        type: mappedType,
        url: resourceUrl,
        resource_id: selectedResource.id,
        placement_label: placementLabel,
      });

      const injected = insertSubchapterAtPlacement(next, block, placement);
      hydrateFromSnapshot(injected);

      toast.success("Ressource intégrée", {
        description: `Placée : ${placementLabel}`,
      });
      onOpenChange(false);
    } catch (e) {
      console.error("[add-course-resource]", e);
      toast.error(e instanceof Error ? e.message : "Impossible d'intégrer la ressource.");
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
                Intégrer une ressource
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Choisissez une ressource de votre bibliothèque et indiquez où elle apparaît dans le parcours
                apprenant, comme pour un quiz ou un entretien.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white">Ressource</Label>
              {loadingLibrary ? (
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de vos ressources…
                </p>
              ) : availableResources.length === 0 ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Aucune ressource disponible. Créez-en une dans{" "}
                  <span className="font-semibold">Formateur → Ressources</span>.
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

            {selectedResource ? (
              <p className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
                Lien apprenant : /ressources/{selectedResource.id}
              </p>
            ) : null}
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
            <Button
              type="button"
              disabled={busy || !selectedResource || loadingLibrary}
              onClick={handleAdd}
              className="rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 px-6 font-semibold text-white hover:opacity-95"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Intégrer la ressource
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
