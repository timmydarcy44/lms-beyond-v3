"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CourseStructureBuilder } from "./course-structure-builder";
import { CourseResourcesManager } from "./course-resources-manager";
import { CourseStructureGeneratorModal } from "@/components/formateur/ai/course-structure-generator-modal";

type CourseBuilderWorkspaceProps = {
  initialData?: CourseBuilderSnapshot;
  previewHref?: string;
  courseId?: string; // ID du cours si on est en mode édition
};

export function CourseBuilderWorkspace({ initialData, previewHref, courseId }: CourseBuilderWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reset = useCourseBuilder((state) => state.reset);
  const hydrate = useCourseBuilder((state) => state.hydrateFromSnapshot);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Initialiser savedCourseId avec courseId si fourni (mode édition)
  const [savedCourseId, setSavedCourseId] = useState<string | null>(courseId || null);
  const [isMounted, setIsMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isStructureGeneratorOpen, setIsStructureGeneratorOpen] = useState(false);

  // S'assurer que le composant est monté côté client avant de rendre le DnD
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
    // Protection contre les doubles clics
    if (isSaving || isPublishing) {
      return;
    }

    const snapshot = getSnapshot();
    
    if (!snapshot.general.title || !snapshot.general.title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour la formation avant de sauvegarder.",
      });
      return;
    }

    if (status === "published") {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Utiliser savedCourseId OU courseId (prop) pour déterminer si c'est une mise à jour
      const currentCourseId = savedCourseId || courseId;
      
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snapshot,
          status,
          courseId: currentCourseId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Afficher l'erreur détaillée si disponible
        const errorMessage = data.error || "Erreur lors de la sauvegarde";
        const errorDetails = data.details || data.hint || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      // Mettre à jour savedCourseId pour les prochaines sauvegardes
      const newCourseId = data.course.id;
      setSavedCourseId(newCourseId);
      
      toast.success(status === "published" ? "Formation publiée !" : "Formation sauvegardée", {
        description: data.message,
      });
      
      // Détecter le contexte (Super Admin ou Formateur) basé sur l'URL actuelle
      const isSuperAdminContext = pathname?.includes('/super/studio/modules') || false;
      const isFormationContext = pathname?.includes('/super/studio/formations') || false;
      
      // Si c'était une création, rediriger vers l'URL avec l'ID pour les prochaines fois
      if (!currentCourseId && newCourseId) {
        let newUrl: string;
        if (isSuperAdminContext) {
          newUrl = `/super/studio/modules/${newCourseId}/structure`;
        } else if (isFormationContext) {
          newUrl = `/super/studio/formations/${newCourseId}/structure`;
        } else {
          newUrl = `/dashboard/formateur/formations/${newCourseId}/structure`;
        }
        router.replace(newUrl);
      }

      // Rediriger vers la liste après publication
      if (status === "published") {
        setTimeout(() => {
          let redirectUrl: string;
          if (isSuperAdminContext) {
            redirectUrl = "/super/studio/modules";
          } else if (isFormationContext) {
            redirectUrl = "/super/studio/formations";
          } else {
            redirectUrl = "/dashboard/formateur/formations";
          }
          router.push(redirectUrl);
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
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Structure & contenus</p>
            <p className="text-sm text-white/70">
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
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              Réinitialiser
            </Button>
            <Button
              asChild
              variant="ghost"
              disabled={isSaving || isPublishing}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              <Link href={pathname?.includes('/super/studio/modules') 
                ? "/super/studio/modules/new/metadata" 
                : pathname?.includes('/super/studio/formations')
                ? "/super/studio/formations/new/metadata"
                : "/dashboard/formateur/formations/new"}>Retour infos</Link>
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
            <CourseStructureBuilder previewHref={previewHref} courseId={savedCourseId || courseId || undefined} />
            <CourseResourcesManager />
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-4 text-sm">Chargement de l'éditeur...</p>
          </div>
        )}
      </div>
    </div>
  );
}

