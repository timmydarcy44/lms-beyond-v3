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
  const snapshot = useCourseBuilder((state) => state.snapshot);
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

  const sectionCount = snapshot.sections.length;
  const chapterCount = snapshot.sections.reduce((sum, section) => sum + section.chapters.length, 0);
  const subchapterCount = snapshot.sections.reduce(
    (sum, section) =>
      sum + section.chapters.reduce((inner, chapter) => inner + chapter.subchapters.length, 0),
    0,
  );
  const totalDuration = String(snapshot.general.duration || "").trim();

  return (
    <div className="space-y-8 bg-[#0a0a0a] pb-12 text-white">
      <Card className="border border-white/10 bg-[#0a0a0a] shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 px-6 py-6">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">
              Structure & contenus
            </p>
            <h2 className="text-lg font-semibold text-white">Organisez votre parcours avec clarté</h2>
            <p className="text-sm leading-relaxed text-white/60">
              Composez des sections, chapitres et sous-chapitres cohérents. Chaque bloc reste synchronisé avec vos ressources tant que l&apos;onglet est ouvert.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  reset();
                })
              }
              className="rounded-lg border border-white/10 bg-transparent px-3.5 py-2 text-sm font-medium text-red-400 hover:bg-white/5"
            >
              Réinitialiser
            </Button>
            <Button
              asChild
              variant="ghost"
              disabled={isSaving || isPublishing}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              <Link
                href={
                  pathname?.includes("/super/studio/modules")
                    ? "/super/studio/modules/new/metadata"
                    : pathname?.includes("/super/studio/formations")
                    ? "/super/studio/formations/new/metadata"
                    : savedCourseId || courseId
                    ? `/dashboard/formateur/formations/${savedCourseId || courseId}/metadata`
                    : "/dashboard/formateur/formations"
                }
              >
                Retour aux informations
              </Link>
            </Button>
            <Button
              onClick={() => handleSave("draft")}
              disabled={isSaving || isPublishing}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer le brouillon"
              )}
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={isSaving || isPublishing}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {isMounted && isHydrated ? (
            <>
              <CourseStructureBuilder previewHref={previewHref} courseId={savedCourseId || courseId || undefined} />
              <CourseResourcesManager courseId={savedCourseId || courseId || undefined} />
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 text-center text-white/60">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-4 text-sm">Chargement de l&apos;éditeur...</p>
            </div>
          )}
        </div>

        <div className="sticky top-4 h-fit">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Aperçu apprenant
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <div>
                <p className="text-white">{snapshot.general.title || "Formation sans titre"}</p>
                <p className="text-xs text-white/50">{snapshot.general.subtitle || "Sans sous-titre"}</p>
              </div>
              <div className="grid gap-2 text-xs text-white/60">
                <div>Sections : {sectionCount}</div>
                <div>Chapitres : {chapterCount}</div>
                <div>Sous-chapitres : {subchapterCount}</div>
                <div>Durée totale : {totalDuration || "—"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {snapshot.sections.length === 0 ? (
                <p className="text-xs text-white/40">Aucune section pour le moment.</p>
              ) : (
                snapshot.sections.map((section) => (
                  <details key={section.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-white/80">
                      {section.title || "Section"}
                    </summary>
                    <div className="mt-2 space-y-1 text-xs text-white/60">
                      {section.chapters.map((chapter) => (
                        <div key={chapter.id}>
                          <p className="text-white/70">{chapter.title || "Chapitre"}</p>
                          {chapter.subchapters.length > 0 ? (
                            <ul className="mt-1 space-y-1 pl-3 text-white/50">
                              {chapter.subchapters.map((sub) => (
                                <li key={sub.id}>{sub.title || "Sous-chapitre"}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

