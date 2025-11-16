"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CourseStructureBuilderSuperAdmin } from "./course-structure-builder-super-admin";
import { CourseResourcesManagerSuperAdmin } from "./course-resources-manager-super-admin";

type CourseBuilderWorkspaceSuperAdminProps = {
  initialData?: CourseBuilderSnapshot;
  previewHref?: string;
  courseId?: string;
  initialCourseId?: string;
};

export function CourseBuilderWorkspaceSuperAdmin({ initialData, previewHref, courseId, initialCourseId }: CourseBuilderWorkspaceSuperAdminProps) {
  const router = useRouter();
  const reset = useCourseBuilder((state) => state.reset);
  const hydrate = useCourseBuilder((state) => state.hydrateFromSnapshot);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // S'assurer que savedCourseId est toujours initialisé avec courseId si fourni
  const [savedCourseId, setSavedCourseId] = useState<string | null>(initialCourseId || courseId || null);
  
  // Mettre à jour savedCourseId si courseId change (pour éviter les duplications)
  useEffect(() => {
    if (courseId && courseId !== savedCourseId) {
      setSavedCourseId(courseId);
    }
  }, [courseId]);
  const [isMounted, setIsMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialData) {
      setIsHydrated(false);
      reset();
      hydrate(initialData);
      setIsHydrated(true);
    } else {
      setIsHydrated(true);
    }
  }, [reset, hydrate, initialData]);

  const handleSave = async (status: "draft" | "published" = "draft") => {
    if (isSaving || isPublishing) {
      return;
    }

    const snapshot = getSnapshot();
    
    if (!snapshot.general.title || !snapshot.general.title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour le module avant de sauvegarder.",
      });
      return;
    }

    if (status === "published") {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Priorité : courseId (prop) > initialCourseId (prop) > savedCourseId (state)
      // courseId et initialCourseId sont plus fiables car ils viennent de l'URL
      const currentCourseId = courseId || initialCourseId || savedCourseId;
      
      // Log pour debug
      console.log("[super-admin/builder] Saving course:", {
        savedCourseId,
        courseId,
        initialCourseId,
        currentCourseId,
        isUpdate: !!currentCourseId,
        title: snapshot.general.title,
      });
      
      // Vérification importante : ne pas créer de doublon si on a un courseId
      if (!currentCourseId) {
        console.warn("[super-admin/builder] ⚠️ Aucun courseId détecté, création d'un nouveau cours");
      } else {
        console.log("[super-admin/builder] ✅ Mise à jour du cours existant:", currentCourseId);
      }
      
      // Utiliser PATCH pour la mise à jour, POST pour la création
      const method = currentCourseId ? "PATCH" : "POST";
      const url = currentCourseId ? `/api/courses/${currentCourseId}` : "/api/courses";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snapshot,
          status,
          // Ne pas inclure courseId dans le body pour PATCH (il est dans l'URL)
          // Pour POST, on peut inclure courseId si on veut forcer un ID spécifique (mais généralement non)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Erreur lors de la sauvegarde";
        const errorDetails = data.details || data.hint || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      // Récupérer l'ID du cours (nouveau ou existant)
      // Si c'était une mise à jour, utiliser le currentCourseId
      // Si c'était une création, utiliser l'ID retourné par l'API
      const courseIdFromResponse = currentCourseId || data.course?.id;
      
      // Toujours mettre à jour savedCourseId pour éviter les duplications futures
      if (courseIdFromResponse && courseIdFromResponse !== savedCourseId) {
        setSavedCourseId(courseIdFromResponse);
        console.log("[super-admin/builder] ✅ savedCourseId mis à jour:", courseIdFromResponse);
      }
      
      toast.success(status === "published" ? "Module publié !" : "Module sauvegardé", {
        description: data.message,
      });
      
      // Si c'était une création (pas de currentCourseId), rediriger vers la page d'édition
      if (!currentCourseId && courseIdFromResponse) {
        // Rediriger vers la page d'édition (pas /new) pour éviter les duplications
        const newUrl = `/super/studio/modules/${courseIdFromResponse}/structure`;
        console.log("[super-admin/builder] 🔄 Redirection vers:", newUrl);
        router.replace(newUrl);
      }

      if (status === "published") {
        setTimeout(() => {
          router.push("/super/studio/modules");
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde.",
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <Card className="border-black bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Structure & contenus</p>
            <p className="text-sm text-gray-700">
              Segmentez votre parcours en sections, chapitres et sous-chapitres. Les ressources et évaluations restent synchronisées tant que l&apos;onglet est ouvert.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  reset();
                })
              }
              className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Réinitialiser
            </Button>
            <Button
              asChild
              variant="ghost"
              disabled={isSaving || isPublishing}
              className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Link href="/super/studio/modules/new">Retour infos</Link>
            </Button>
            <Button
              onClick={() => handleSave("draft")}
              disabled={isSaving || isPublishing}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer en brouillon"
              )}
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={isSaving || isPublishing}
              className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_rgba(255,81,47,0.35)] hover:opacity-90 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isMounted && isHydrated ? (
          <>
            <CourseStructureBuilderSuperAdmin previewHref={previewHref} />
            <CourseResourcesManagerSuperAdmin />
          </>
        ) : (
          <Card className="border-black bg-gray-50 text-center text-gray-600">
            <CardContent className="space-y-4 py-10">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="text-sm">Chargement de l'éditeur...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

