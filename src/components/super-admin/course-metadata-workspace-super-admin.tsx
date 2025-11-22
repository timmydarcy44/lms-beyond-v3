"use client";

import Link from "next/link";
import { useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { CourseBuilderSection } from "@/types/course-builder";

import { CourseMetadataFormSuperAdmin } from "./course-metadata-form-super-admin";

function CourseMetadataWorkspaceContent() {
  const reset = useCourseBuilder((state) => state.reset);
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  const hydrateFromSnapshot = useCourseBuilder((state) => state.hydrateFromSnapshot);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  // Initialiser depuis les paramètres URL si disponibles
  useEffect(() => {
    const titleParam = searchParams.get("title");
    const structureParam = searchParams.get("structure");
    const methodParam = searchParams.get("method");
    const assignmentTypeParam = searchParams.get("assignment_type") as "no_school" | "organization" | null;

    const snapshot = getSnapshot();
    let shouldUpdate = false;
    const updates: any = {};

    // Charger le titre si fourni
    if (titleParam && !snapshot.general.title) {
      updates.title = decodeURIComponent(titleParam);
      shouldUpdate = true;
    }

    // Pré-remplir assignment_type si fourni dans l'URL
    if (assignmentTypeParam && snapshot.general.assignment_type !== assignmentTypeParam) {
      updates.assignment_type = assignmentTypeParam;
      if (assignmentTypeParam === "no_school") {
        // Pour Beyond No School, forcer target_audience à "apprenant"
        updates.target_audience = "apprenant";
      }
      shouldUpdate = true;
      console.log("[course-metadata-workspace] Setting assignment_type from URL:", assignmentTypeParam);
    }

    // Si on vient d'un prompt, charger les données
    if (methodParam === "prompt" && (titleParam || structureParam)) {
      console.log("[course-metadata-workspace] Loading from prompt:", { titleParam, hasStructure: !!structureParam });
      
      // Charger la structure générée par l'IA
      if (structureParam) {
        try {
          const parsed = JSON.parse(structureParam);
          const sections: CourseBuilderSection[] = parsed.sections || parsed || [];
          
          console.log("[course-metadata-workspace] Parsed structure:", sections.length, "sections");
          
          if (sections.length > 0) {
            // Mettre à jour le snapshot avec la structure
            hydrateFromSnapshot({
              ...snapshot,
              sections,
              general: {
                ...snapshot.general,
                ...updates,
                title: titleParam ? decodeURIComponent(titleParam) : snapshot.general.title,
              },
            });
            
            console.log("[course-metadata-workspace] ✅ Loaded structure from URL:", sections.length, "sections");
            return; // Ne pas continuer si on a hydraté depuis un prompt
          } else {
            console.warn("[course-metadata-workspace] No sections found in structure");
          }
        } catch (error) {
          console.error("[course-metadata-workspace] Error parsing structure from URL:", error);
        }
      }
    }

    // Mettre à jour les métadonnées si nécessaire
    if (shouldUpdate && Object.keys(updates).length > 0) {
      updateGeneral(updates);
      console.log("[course-metadata-workspace] ✅ Updated metadata from URL:", updates);
    }
  }, [searchParams, updateGeneral, hydrateFromSnapshot, getSnapshot]);

  return (
    <div className="space-y-8 pb-12">
      <Card className="border-black bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Étape 1 — Métadonnées</p>
            <p className="text-sm text-gray-700">
              Posez l&apos;ADN de votre module : titre, récit pédagogique, visuels et promesse. Ces éléments alimentent les pages
              apprenant.
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
              className="rounded-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md"
            >
              <Link href="/super/studio/modules/new/structure">Passer à la construction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <CourseMetadataFormSuperAdmin />
        </div>
        <div className="xl:sticky xl:top-4">
          <CourseLearnerPreview />
        </div>
      </div>
    </div>
  );
}

export function CourseMetadataWorkspaceSuperAdmin() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <CourseMetadataWorkspaceContent />
    </Suspense>
  );
}

