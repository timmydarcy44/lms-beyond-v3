"use client";

import Image from "next/image";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormateurContentLibrary } from "@/lib/queries/formateur";
import { cn } from "@/lib/utils";

type PathBuilderWorkspaceProps = {
  library: FormateurContentLibrary;
  initialData?: {
    pathId?: string;
    title?: string;
    subtitle?: string;
    objective?: string;
    selectedCourses?: string[];
    selectedTests?: string[];
    selectedResources?: string[];
    status?: "draft" | "published";
    price?: number | string | null;
    orgId?: string | null;
  };
  additionalFields?: () => Record<string, unknown>;
  extraHeaderSlot?: ReactNode;
};

type ToggleableItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
  badge?: string;
  accent?: "course" | "test" | "resource";
};

const gradientCta = "bg-gradient-to-r from-[#00C6FF] to-[#0072FF]";

export function PathBuilderWorkspace({
  library,
  initialData,
  additionalFields,
  extraHeaderSlot,
}: PathBuilderWorkspaceProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "Parcours neuro-pédagogie immersive");
  const [subtitle, setSubtitle] = useState(
    initialData?.subtitle || "Faites monter en puissance vos formateurs avec un enchaînement haute intensité de modules neurosciences",
  );
  const [objective, setObjective] = useState(
    initialData?.objective || "Structurer une progression mêlant rituels immersifs, diagnostics comportementaux et ressources premium.",
  );

  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    initialData?.selectedCourses || library.courses.slice(0, 2).map((item) => item.id)
  );
  const [selectedTests, setSelectedTests] = useState<string[]>(
    initialData?.selectedTests || library.tests.slice(0, 1).map((item) => item.id)
  );
  const [selectedResources, setSelectedResources] = useState<string[]>(
    initialData?.selectedResources || library.resources.slice(0, 2).map((item) => item.id)
  );

  const [savedPathId, setSavedPathId] = useState<string | null>(initialData?.pathId || null);
  const [price, setPrice] = useState<string>(
    initialData?.price !== undefined && initialData?.price !== null
      ? String(initialData.price)
      : "0",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Log des données initiales pour déboguer
  console.log("[path-builder] Initial data:", {
    pathId: initialData?.pathId,
    title: initialData?.title,
    hasSelectedCourses: initialData?.selectedCourses?.length ?? 0,
    hasSelectedTests: initialData?.selectedTests?.length ?? 0,
    hasSelectedResources: initialData?.selectedResources?.length ?? 0,
    status: initialData?.status,
  });

  const getAdditionalFields = useCallback(() => {
    try {
      return additionalFields ? additionalFields() ?? {} : {};
    } catch (error) {
      console.error("[path-builder] additionalFields() threw", error);
      return {};
    }
  }, [additionalFields]);

  const handleSave = async (status: "draft" | "published" = "draft") => {
    if (!title || !title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour le parcours avant de sauvegarder.",
      });
      return;
    }

    if (status === "published") {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Créer un snapshot pour la structure du parcours
      const builderSnapshot = {
        title,
        subtitle,
        objective,
        selectedCourses,
        selectedTests,
        selectedResources,
        updatedAt: new Date().toISOString(),
      };

      console.log("[path-builder] Saving path:", {
        pathId: savedPathId || undefined,
        title,
        status,
        coursesCount: selectedCourses.length,
        testsCount: selectedTests.length,
        resourcesCount: selectedResources.length,
        isUpdate: !!savedPathId,
      });

      const extraPayload = getAdditionalFields();

      const response = await fetch("/api/paths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: subtitle.trim() || null,
          status,
          pathId: savedPathId || undefined,
          selectedCourses,
          selectedTests,
          selectedResources,
          builderSnapshot,
          price: parseFloat(price) || 0,
          ...extraPayload,
        }),
      });

      const data = await response.json();

      console.log("[path-builder] Save response:", {
        ok: response.ok,
        pathId: data.path?.id,
        error: data.error,
      });

      if (!response.ok) {
        const errorMessage = data.error || "Erreur lors de la sauvegarde";
        const errorDetails = data.details || data.hint || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      setSavedPathId(data.path.id);
      toast.success(status === "published" ? "Parcours publié !" : savedPathId ? "Parcours mis à jour !" : "Parcours sauvegardé", {
        description: data.message,
      });

      // Rediriger vers la liste des parcours après publication
      if (status === "published") {
        setTimeout(() => {
          router.push("/dashboard/formateur/parcours");
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

  const courseItems: ToggleableItem[] = useMemo(
    () =>
      library.courses.map((course) => ({
        id: course.id,
        title: course.title,
        subtitle: course.category,
        meta: course.duration,
        image: course.coverImage,
        badge: course.status === "published" ? "Publié" : "Brouillon",
        accent: "course",
      })),
    [library.courses],
  );

  const defaultTestImage = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";
  const defaultResourceImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

  const testItems: ToggleableItem[] = useMemo(
    () =>
      library.tests.map((test) => ({
        id: test.id,
        title: test.title,
        subtitle: test.description,
        meta: test.duration,
        badge: test.status === "published" ? "Publié" : "Brouillon",
        image: defaultTestImage,
        accent: "test",
      })),
    [library.tests],
  );

  const resourceItems: ToggleableItem[] = useMemo(
    () =>
      library.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        subtitle: resource.type,
        image: resource.thumbnail ?? defaultResourceImage,
        badge: resource.status === "published" ? "Disponible" : "Brouillon",
        accent: "resource",
      })),
    [library.resources],
  );

  const toggleItem = (id: string, selected: string[], setter: (value: string[]) => void) => {
    setter(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-8 pb-16">
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Étape 1 — Définir le parcours</p>
            <p className="text-sm text-white/70">
              Commencez par nommer votre parcours et clarifier la promesse pédagogique. Vous pourrez bientôt le publier ou le
              partager directement depuis cette interface.
            </p>
          </div>
        <div className="flex flex-wrap items-center gap-3">
          {extraHeaderSlot ? <div className="min-w-[220px]">{extraHeaderSlot}</div> : null}
            <Button
              onClick={() => handleSave("draft")}
              disabled={isSaving || isPublishing}
              className={cn("rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white", gradientCta)}
            >
              {isSaving ? "Enregistrement..." : savedPathId ? "Mettre à jour" : "Enregistrer"}
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={isSaving || isPublishing}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white",
                "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              )}
            >
              {isPublishing ? "Publication..." : "Publier"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-8">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informations principales</CardTitle>
              <p className="text-sm text-white/60">
                Ces éléments alimenteront la présentation apprenant. Ils pourront être synchronisés avec vos fiches marketing.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#09111f] via-[#0f172a] to-[#1e293b] p-6 shadow-xl shadow-black/40">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00C6FF]/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#0072FF]/20 blur-3xl" />
                <div className="relative space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Titre du parcours</span>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Donnez un nom iconique à votre parcours"
                    className="h-20 w-full border-0 bg-white/10 text-3xl font-semibold text-white tracking-tight placeholder:text-white/30 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/60 focus-visible:ring-offset-0"
                  />
                  <p className="text-sm text-white/70">
                    Ce titre occupera toute la hero section côté apprenant. Pensez impact visuel, storytelling et promesse en une
                    phrase.
                  </p>
                </div>
              </div>
              <TextareaField
                label="Accroche"
                value={subtitle}
                onChange={setSubtitle}
                placeholder="Positionnez votre parcours en une phrase impactante"
              />
              <TextareaField
                label="Objectif principal"
                value={objective}
                onChange={setObjective}
                placeholder="Décrivez l'objectif transformateur pour vos apprenants et vos formateurs"
              />
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Prix (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="border-white/10 bg-black/30 text-white placeholder:text-white/40 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/50 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>

          <SelectionZone
            title="Formations"
            description="Sélectionnez les formations que vous avez créées pour structurer votre parcours. L'ordre pourra être ajusté avec le drag and drop bientôt disponible."
            items={courseItems}
            selected={selectedCourses}
            onToggle={(id) => toggleItem(id, selectedCourses, setSelectedCourses)}
            emptyCta="Créer une formation"
            emptyHref="/dashboard/formateur/formations/new"
          />

          <SelectionZone
            title="Tests & évaluations"
            description="Ajoutez des diagnostics ou évaluations pour mesurer l'impact pédagogique du parcours."
            items={testItems}
            selected={selectedTests}
            onToggle={(id) => toggleItem(id, selectedTests, setSelectedTests)}
            emptyCta="Créer un test"
            emptyHref="/dashboard/formateur/tests/new"
          />

          <SelectionZone
            title="Ressources premium"
            description="Rassemblez vos fiches, audios, vidéos ou templates qui accompagneront vos apprenants tout au long du parcours."
            items={resourceItems}
            selected={selectedResources}
            onToggle={(id) => toggleItem(id, selectedResources, setSelectedResources)}
            emptyCta="Créer une ressource"
            emptyHref="/dashboard/formateur/ressources/new"
          />
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Composition actuelle</CardTitle>
              <p className="text-sm text-white/60">
                Aperçu en temps réel des contenus qui composeront votre parcours. Vous pourrez bientôt sauvegarder cette structure
                et la prévisualiser côté apprenant.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-white/70">
              <SummaryBlock label="Formations" items={courseItems} selected={selectedCourses} badgeTone="bg-white/10 text-white" />
              <SummaryBlock label="Tests" items={testItems} selected={selectedTests} badgeTone="bg-emerald-500/20 text-emerald-100" />
              <SummaryBlock
                label="Ressources"
                items={resourceItems}
                selected={selectedResources}
                badgeTone="bg-sky-500/20 text-sky-100"
              />
            </CardContent>
          </Card>

          <Card className="border-dashed border-white/15 bg-gradient-to-br from-white/5 via-white/5 to-transparent p-6 text-white">
            <div className="space-y-3">
              <h3 className="text-base font-semibold">IA Beyond — bientôt disponible</h3>
              <p className="text-sm text-white/70">
                Générez automatiquement une proposition de parcours à partir de vos formations et de vos objectifs business. L'IA
                sélectionnera les contenus pertinents et proposera un enchaînement optimal.
              </p>
              <Button
                className="rounded-full bg-gradient-to-r from-[#FFE29F] to-[#FF719A] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black"
              >
                Créer le parcours avec Beyond AI (bientôt)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function TextareaField({ label, value, onChange, placeholder }: TextareaFieldProps) {
  return (
    <label className="space-y-2 text-sm text-white/70">
      <span className="uppercase tracking-[0.3em] text-xs text-white/40">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] rounded-2xl border border-white/10 bg-black/30/80 text-white placeholder:text-white/30 focus-visible:ring-4 focus-visible:ring-[#00C6FF]/50 focus-visible:ring-offset-0"
      />
    </label>
  );
}

type SelectionZoneProps = {
  title: string;
  description: string;
  items: ToggleableItem[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyCta: string;
  emptyHref: string;
};

function SelectionZone({ title, description, items, selected, onToggle, emptyCta, emptyHref }: SelectionZoneProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-white/60">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-white/20 bg-black/30 p-6 text-sm text-white/60">
            <p>Aucun contenu disponible pour le moment.</p>
            <Button asChild className={cn("rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]", gradientCta)}>
              <a href={emptyHref}>{emptyCta}</a>
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
              {items.map((item) => {
                const isSelected = selected.includes(item.id);
                const accentGradient =
                  item.accent === "course"
                    ? "from-[#0f172a]/90 via-[#1f2937]/70 to-transparent"
                    : item.accent === "test"
                      ? "from-[#0b1120]/95 via-[#1e3a8a]/70 to-transparent"
                      : "from-[#061119]/95 via-[#0f766e]/60 to-transparent";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      "group relative w-[260px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left transition-all duration-300",
                      isSelected ? "ring-2 ring-[#00C6FF]/80" : "hover:-translate-y-1 hover:border-white/25 hover:shadow-xl",
                    )}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105 group-hover:saturate-125"
                          sizes="260px"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#1f2937] via-[#0f172a] to-[#020617]" />
                      )}
                      <div className={cn("absolute inset-0 bg-gradient-to-t", accentGradient)} />
                      {item.badge ? (
                        <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70">
                          {item.badge}
                        </span>
                      ) : null}
                      {item.meta ? (
                        <span className="absolute right-4 top-4 text-xs text-white/80">{item.meta}</span>
                      ) : null}
                    </div>
                    <div className="space-y-2 px-5 py-4">
                      <p className="text-sm font-semibold text-white line-clamp-2">{item.title}</p>
                      {item.subtitle ? <p className="text-xs text-white/60 line-clamp-2">{item.subtitle}</p> : null}
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span className="rounded-full bg-white/5 px-2 py-1">
                          {isSelected ? "Sélectionné" : "Disponible"}
                        </span>
                        <span>{isSelected ? "Cliquer pour retirer" : "Cliquer pour ajouter"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type SummaryBlockProps = {
  label: string;
  items: ToggleableItem[];
  selected: string[];
  badgeTone: string;
};

function SummaryBlock({ label, items, selected, badgeTone }: SummaryBlockProps) {
  const visibleItems = items.filter((item) => selected.includes(item.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{label}</h4>
        <Badge className={cn("rounded-full text-[10px] uppercase tracking-[0.3em]", badgeTone)}>{visibleItems.length}</Badge>
      </div>
      {visibleItems.length === 0 ? (
        <p className="text-xs text-white/40">Aucun contenu sélectionné pour le moment.</p>
      ) : (
        <ul className="space-y-2 text-sm text-white/70">
          {visibleItems.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="font-medium text-white">{item.title}</p>
              {item.subtitle ? <p className="text-xs text-white/50">{item.subtitle}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


