"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { CourseStructureBuilder } from "./course-structure-builder";
import { CourseResourcesManager } from "./course-resources-manager";
import { CourseStructureGeneratorModal } from "@/components/formateur/ai/course-structure-generator-modal";

type CourseBuilderWorkspaceProps = {
  initialData?: CourseBuilderSnapshot;
  previewHref?: string;
  courseId?: string; // ID du cours si on est en mode édition
  theme?: "dark" | "light";
};

export function CourseBuilderWorkspace({ initialData, previewHref, courseId, theme = "dark" }: CourseBuilderWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reset = useCourseBuilder((state) => state.reset);
  const hydrate = useCourseBuilder((state) => state.hydrateFromSnapshot);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);
  const snapshot = useCourseBuilder((state) => state.snapshot);
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Initialiser savedCourseId avec courseId si fourni (mode édition)
  const [savedCourseId, setSavedCourseId] = useState<string | null>(courseId || null);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const [saveSuccessStatus, setSaveSuccessStatus] = useState<"draft" | "published">("draft");
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
      console.log("Payload de sauvegarde:", snapshot);
      
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snapshot,
          status,
          courseId: currentCourseId || undefined,
          // Galaxies: persister l'organisation choisie dans `courses.org_id`
          org_id: snapshot?.general?.assigned_organization_id ?? null,
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

      // Feedback visuel Apple-style
      setSaveSuccessStatus(status);
      setSaveSuccessOpen(true);
      
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
          newUrl = `/dashboard/formateur/formations/${newCourseId}`;
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

  const isLight = theme === "light";
  const primaryGradient =
    "bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] text-white font-semibold hover:opacity-95";

  return (
    <div className={isLight ? "space-y-8 bg-white pb-12 text-slate-950" : "space-y-8 bg-[#0a0a0a] pb-12 text-white"}>
      <Card className={isLight ? "border-0 bg-white shadow-sm" : "border border-white/10 bg-[#0a0a0a] shadow-none"}>
        <CardContent
          className={
            isLight
              ? "flex flex-wrap items-center justify-between gap-6 px-6 py-6"
              : "flex flex-wrap items-center justify-between gap-6 border-b border-white/10 px-6 py-6"
          }
        >
          <div className="max-w-xl space-y-2">
            <p className={isLight ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-medium uppercase tracking-[0.32em] text-white/60"}>
              Structure & contenus
            </p>
            <h2 className={isLight ? "text-lg font-extrabold tracking-tight text-slate-950" : "text-lg font-semibold text-white"}>
              Organisez votre parcours avec clarté
            </h2>
            <p className={isLight ? "text-sm leading-relaxed text-slate-600" : "text-sm leading-relaxed text-white/60"}>
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
              className={
                isLight
                  ? "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-slate-200"
                  : "rounded-lg border border-white/10 bg-transparent px-3.5 py-2 text-sm font-medium text-red-400 hover:bg-white/5"
              }
            >
              Réinitialiser
            </Button>
            <Button
              onClick={() => handleSave("draft")}
              disabled={isSaving || isPublishing}
              className={isLight ? `rounded-full px-5 py-2 text-sm ${primaryGradient} disabled:opacity-60` : "rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"}
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
              className={isLight ? `rounded-full px-5 py-2 text-sm ${primaryGradient} disabled:opacity-60` : "rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"}
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
              <CourseStructureBuilder
                previewHref={previewHref}
                courseId={savedCourseId || courseId || undefined}
                theme={theme}
              />
              <CourseResourcesManager courseId={savedCourseId || courseId || undefined} />
              {(snapshot?.general as any)?.has_badge ? (
                <Card className={isLight ? "border-0 bg-white shadow-sm" : "border border-white/10 bg-white/5 shadow-none"}>
                  <CardContent className="space-y-4 rounded-xl p-4">
                    <div className="space-y-1">
                      <p className={isLight ? "text-xs font-semibold uppercase tracking-[0.32em] text-slate-500" : "text-xs font-medium uppercase tracking-[0.32em] text-white/60"}>
                        Open Badge
                      </p>
                      <h3 className={isLight ? "text-lg font-extrabold tracking-tight text-slate-950" : "text-lg font-semibold text-white"}>
                        Configuration du badge
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <label className={isLight ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white/80"}>
                        Titre du Badge
                      </label>
                      <input
                        value={String((snapshot.general as any)?.badgeLabel ?? "")}
                        onChange={(e) => updateGeneral({ badgeLabel: e.target.value } as any)}
                        className={cn(
                          "h-12 w-full rounded-xl border px-4 text-sm outline-none focus:ring-2",
                          isLight
                            ? "border-slate-200 bg-[#f4f4f5] text-slate-950 focus:ring-blue-500/20"
                            : "border-white/10 bg-white/[0.06] text-white focus:ring-white/20",
                        )}
                        placeholder="Ex: Badge Prompt Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={isLight ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white/80"}>
                        Preuve attendue pour l'obtention
                      </label>
                      <textarea
                        value={String((snapshot.general as any)?.badge_proof_description ?? "")}
                        onChange={(e) => updateGeneral({ badge_proof_description: e.target.value } as any)}
                        className={cn(
                          "min-h-[140px] w-full rounded-xl border p-4 text-sm outline-none focus:ring-2",
                          isLight
                            ? "border-slate-200 bg-[#f4f4f5] text-slate-950 focus:ring-blue-500/20"
                            : "border-white/10 bg-white/[0.06] text-white focus:ring-white/20",
                        )}
                        placeholder="Expliquez ici ce que l'apprenant doit soumettre pour valider son badge (ex: un prompt, un lien, un texte)..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <div className={isLight ? "rounded-2xl bg-slate-50 p-8 text-center text-slate-600 shadow-sm" : "rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 text-center text-white/60"}>
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-4 text-sm">Chargement de l&apos;éditeur...</p>
            </div>
          )}
        </div>

        <div className="sticky top-4 h-fit">
          <div className={isLight ? "rounded-2xl bg-white p-4 shadow-sm" : "rounded-2xl border border-white/10 bg-[#111] p-4"}>
            <p className={isLight ? "text-xs font-extrabold uppercase tracking-[0.3em] text-slate-500" : "text-xs font-semibold uppercase tracking-[0.3em] text-white/60"}>
              Aperçu apprenant
            </p>
            <div className={isLight ? "mt-4 space-y-3 text-sm text-slate-700" : "mt-4 space-y-3 text-sm text-white/80"}>
              <div>
                <p className={isLight ? "text-slate-950" : "text-white"}>{snapshot.general.title || "Formation sans titre"}</p>
                <p className={isLight ? "text-xs text-slate-500" : "text-xs text-white/50"}>{snapshot.general.subtitle || "Sans sous-titre"}</p>
              </div>
              <div className={isLight ? "grid gap-2 text-xs text-slate-600" : "grid gap-2 text-xs text-white/60"}>
                <div>Sections : {sectionCount}</div>
                <div>Chapitres : {chapterCount}</div>
                <div>Sous-chapitres : {subchapterCount}</div>
                <div>Durée totale : {totalDuration || "—"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {snapshot.sections.length === 0 ? (
                <p className={isLight ? "text-xs text-slate-500" : "text-xs text-white/40"}>Aucune section pour le moment.</p>
              ) : (
                snapshot.sections.map((section) => (
                  <details key={section.id} className={isLight ? "rounded-xl bg-slate-50 p-3 shadow-sm" : "rounded-xl border border-white/10 bg-white/5 p-3"}>
                    <summary className={isLight ? "cursor-pointer text-xs font-bold text-slate-800" : "cursor-pointer text-xs font-semibold text-white/80"}>
                      {section.title || "Section"}
                    </summary>
                    <div className={isLight ? "mt-2 space-y-1 text-xs text-slate-600" : "mt-2 space-y-1 text-xs text-white/60"}>
                      {section.chapters.map((chapter) => (
                        <div key={chapter.id}>
                          <p className={isLight ? "text-slate-700" : "text-white/70"}>{chapter.title || "Chapitre"}</p>
                          {chapter.subchapters.length > 0 ? (
                            <ul className={isLight ? "mt-1 space-y-1 pl-3 text-slate-500" : "mt-1 space-y-1 pl-3 text-white/50"}>
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

      {saveSuccessOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-6 backdrop-blur-xl"
          onClick={() => setSaveSuccessOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/92 p-10 text-center shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
            >
              <Check className="h-9 w-9" strokeWidth={2.5} />
            </motion.div>
            <p className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
              {saveSuccessStatus === "published" ? "Votre cours est en ligne" : "Cours enregistré"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {saveSuccessStatus === "published"
                ? "Votre formation est visible pour les apprenants."
                : "Vos modifications ont été sauvegardées."}
            </p>
            <Button
              type="button"
              className="mt-10 h-12 w-full rounded-full bg-slate-950 text-sm font-semibold text-white hover:bg-slate-900"
              onClick={() => {
                setSaveSuccessOpen(false);
                router.push(pathname?.includes("/super/studio") ? "/super/studio/modules" : "/dashboard/formateur/formations");
              }}
            >
              {saveSuccessStatus === "published" ? "Accéder au catalogue" : "Retour au catalogue"}
            </Button>
          </motion.div>
        </div>
      ) : null}

      <div className="mt-10 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
        <h3 className="text-cyan-500 font-bold">Open Badge & Certification</h3>
        <p className="text-sm text-gray-400 mt-1">Définissez les critères d'obtention automatique.</p>
        <textarea
          className="w-full mt-4 bg-black/40 border border-white/10 rounded-xl p-4 text-white"
          placeholder="Quelle preuve l'apprenant doit-il fournir ?"
        />
      </div>
    </div>
  );
}

